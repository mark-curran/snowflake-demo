import {
  KafkaConsumer,
  KafkaConsumerEvents,
  Message,
  TopicPartitionOffset,
} from 'node-rdkafka';
import logger from './logger';
import { AsyncQueue } from './exclusiveQueue';

export class ConsumerBatch {
  private static activeClients = new Set<KafkaConsumer>();
  private consumer: KafkaConsumer;
  private consumptionCallback: (message: Message) => Promise<void>;
  private messageBuffer: AsyncQueue<Message>;
  private batchSize: number; // NOTE: This is per topic-partition.
  private batchTimeout: number;
  private clientPollInterval: number;
  private topicPartitionOffsets: TopicPartitionOffset;

  constructor(
    consumer: KafkaConsumer,
    initTopicPartitionOffsets: TopicPartitionOffset,
    consumptionCallback: (message: Message) => Promise<void>,
    batchSize = 1,
    batchTimeout = 5000,
    clientPollInterval = 20,
    allowExistingDataListeners = false,
  ) {
    // Check the consumer is connected
    if (!consumer.isConnected()) {
      throw new Error(
        'Consumer must be connected to use the consumeBatch class.',
      );
    }

    // Check the consumer isn't already in the active set.
    if (ConsumerBatch.activeClients.has(consumer)) {
      throw new Error(`There is already a consumer batch with this consumer`);
    } else {
      ConsumerBatch.activeClients.add(consumer);
      this.consumer = consumer;
      this.consumer.assign([initTopicPartitionOffsets]);
    }

    // Check there are no active listeners to the 'data' event for this consumer.
    // TODO: Does `data` belong to an node-rdkafka enum?
    const existingListeners = consumer.listenerCount(
      'data' as KafkaConsumerEvents,
    );
    if (existingListeners > 0 && allowExistingDataListeners) {
      throw new Error(`Consumer with name `);
    } else {
      this.setDataListener();
    }

    // Check you are subscribed to the topic.
    const clientSubscriptions = consumer.subscription();
    if (!clientSubscriptions.includes(initTopicPartitionOffsets.topic)) {
      throw new Error(
        `KafkaConsumer is not subscribed to ${initTopicPartitionOffsets.topic}`,
      );
    }
    // Set remaining attributes.
    this.topicPartitionOffsets = initTopicPartitionOffsets;
    this.consumptionCallback = consumptionCallback;
    this.messageBuffer = new AsyncQueue<Message>();
    this.batchTimeout = batchTimeout;
    this.clientPollInterval = clientPollInterval;
    this.batchSize = batchSize;
  }

  private setDataListener() {
    this.consumer.on(
      'data' as KafkaConsumerEvents,
      async (message: Message) => {
        logger.debug(
          `Data received by rdkafka client: ${JSON.stringify(message)}`,
        );
        await this.messageBuffer.push(message);
      },
    );
  }

  private async seekAndResolve(
    topicPartitionOffset: TopicPartitionOffset,
  ): Promise<void> {
    /* NOTE: The `topicPartitionOffset` argument is an object, so nodejs will pass a
    reference, not a deep copy of it's values. So that this promise resolves to a unique
    value, create a function scoped copy.

    If we were interested in creating a full blown Kafka client, we'd wrap kafka seek
    behaviour in a mutex to prevent multiple async seek commands being run in a parallel.
    */
    const localTopicPartitionOffset = structuredClone(topicPartitionOffset);
    new Promise((resolve) => {
      this.consumer.seek(localTopicPartitionOffset, null, (err) => {
        logger.debug(
          `Finished seeking to ${JSON.stringify(localTopicPartitionOffset)}.`,
        );
        resolve;
      });
    });
  }

  private async consumeTopicPartitionOffset(): Promise<number> {
    // TODO: Cannot be invoked while consuming another batch.
    const startBufferLength = await this.messageBuffer.getLength();

    /*
    NOTE: In Event Hub it seems that after a seek the next consume will only consume
    messages from that topic.

    In native Kafka the broker should determine the balance of messages the consumer
    gets from each partition.
    */
    // Seek to start position for this batch.
    await this.seekAndResolve(this.topicPartitionOffsets);

    // Ask the client to consume more messages without exceeding batch size.
    /* 
    NOTE: Unclear from documentation, but .consume probably asynchronous based on bespoke 
    testing.
    */
    this.consumer.consume(this.batchSize - startBufferLength);

    // Process as many messages as possible within the batch timeout.
    const timeStartBatch = Date.now();
    var messagesProcessed: Message[] = [];

    for (;;) {
      logger.debug('Entering message processing loop.');
      var timeStartLoop = Date.now();

      // Break the loop if the batch has exceeded the timeout.
      if (timeStartLoop > timeStartBatch + this.batchTimeout) {
        logger.debug('Timeout for batch exceeded.');
        break;
      }

      // Break the loop if you've already processed enough messages.
      if (messagesProcessed.length >= this.batchSize) {
        logger.debug(`Already processed ${this.batchSize} messages`);
        break;
      }

      var currentBufferLength = await this.messageBuffer.getLength();
      if (currentBufferLength === 0) {
        // Wait some time for the buffer to fill up.
        await new Promise((resolve) =>
          setTimeout(resolve, this.clientPollInterval),
        );
      } else {
        // If there's something on the buffer, then process it up to the
        // maximum batch size.
        const messagesFromBuffer = await this.messageBuffer.splice(
          0,
          this.batchSize,
        );

        logger.debug(`Spliced ${messagesFromBuffer.length} from the buffer.`);
        await Promise.all(
          messagesFromBuffer.map((message) => {
            this.consumptionCallback(message);
          }),
        );
        messagesProcessed.push(...messagesFromBuffer);
      }
    }

    logger.debug('Updating partition and offset.');
    this.updateParitionOffset(messagesProcessed);

    return messagesProcessed.length;
  }

  private updateParitionOffset(messagesProcessed: Message[]) {
    if (messagesProcessed.length > 0) {
      const largestOffset = Math.max(
        ...messagesProcessed.map((message) => {
          return message.offset;
        }),
      );
      this.topicPartitionOffsets.offset = largestOffset + 1;
    }
  }

  public async consumeInBatches(
    number?: number,
    backOffCallback = new Promise((resolve) => {
      setTimeout(resolve, 1000);
    }),
  ) {
    var messagesProcessed = 0;

    for (;;) {
      const processedOneBatch = await this.consumeTopicPartitionOffset();
      messagesProcessed += processedOneBatch;

      if (number) {
        if (messagesProcessed >= number) {
          logger.debug(
            `Processed ${messagesProcessed} messages, breaking from the loop.`,
          );
          break;
        }
      }
    }

    logger.debug('Calling back off callback.');
    await backOffCallback;
  }
}
