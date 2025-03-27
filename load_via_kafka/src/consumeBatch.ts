import {
  ConsumerGlobalConfig,
  KafkaConsumer,
  KafkaConsumerEvents,
  Message,
  TopicPartitionOffset,
} from 'node-rdkafka';
import { isValidName } from './connection';
import logger from './logger';

export class ConsumerBatch {
  private static activeConsumers = new Map<string, Set<string>>();
  private consumer: KafkaConsumer;
  private consumerGroup: string;
  private consumerName: string;
  private consumptionCallback: (message: Message) => Promise<void>;
  private errorCallback: (message: Message) => Promise<void>;
  private messageBuffer: Message[];
  private batchSize: number;
  private batchTimeout: number;
  private consumingBatch: boolean;

  constructor(
    consumer: KafkaConsumer,
    consumptionCallback: (message: Message) => Promise<void>,
    errorCallback: (message: Message) => Promise<void>,
    batchSize = 1,
    batchTimeout = 5000,
    allowExistingDataListeners = false,
  ) {
    // Check the consumer is connected
    if (!consumer.isConnected()) {
      throw new Error(
        'Consumer must be connected to use the consumeBatch class.',
      );
    }

    // Check the consumer has a global config.
    var globalConfig: ConsumerGlobalConfig;
    if ('globalConfig' in consumer) {
      globalConfig = consumer.globalConfig as ConsumerGlobalConfig;
    } else {
      throw new Error('KafkaConsumer is missing a globalConfig attribute.');
    }

    // If the consumer group is not an empty string, then assign it to an attribute.
    var consumerGroup = globalConfig['group.id'];
    if (isValidName(globalConfig['group.id'])) {
      this.consumerGroup = consumerGroup as string;
    } else {
      throw new Error(
        `Consumer group named ${consumerGroup} is not a valid consumer group.`,
      );
    }

    // Check the consumer has a valid name.
    var name: string;
    if ('name' in consumer) {
      name = consumer.name as string;
    } else {
      throw new Error(
        `KafkaConsumer in group ${consumerGroup} does not have a 'name' attribute.`,
      );
    }

    // If the name is not an empty string, then assign it to an attribute.
    if (isValidName(name)) {
      this.consumerName = name as string;
    } else {
      throw new Error(
        `KafkaConsumer in group ${consumerGroup} does not have a valid name.`,
      );
    }

    // Now that we know the consumer group and name are valid, add it to the set of
    // active consumers.
    try {
      ConsumerBatch.addToActiveConsumers(this.consumerGroup, this.consumerName);
      this.consumer = consumer;
    } catch (err) {
      throw new Error(
        `Error encountered while adding consumer to ConsumerBatch ${err}`,
      );
    }

    // Check there are no active listeners to the 'data' event for this consumer.
    // TODO: Does `data` belong to an node-rdkafka enum?
    const existingListeners = consumer.listenerCount('data');
    if (existingListeners > 0 && allowExistingDataListeners) {
      throw new Error(`Consumer with name `);
    } else {
      this.setDataListener();
    }

    // Check we're only getting data from one topic.
    const subscriptions = consumer.subscription();
    if (subscriptions.length !== 1) {
      throw new Error(
        `ConsumerBatch can only be subscribed to one topic. Kafka client subscribed to ${subscriptions} topics`,
      );
    }

    // Set remaining attributes.
    this.consumptionCallback = consumptionCallback;
    this.errorCallback = errorCallback;
    this.messageBuffer = [];
    this.batchTimeout = batchTimeout;
    this.batchSize = batchSize;
    this.consumingBatch = false;
  }

  private setDataListener(): void {
    this.consumer.on('data', (message) => {
      logger.debug(`Data received ${JSON.stringify(message)}`);
      this.messageBuffer.push(message);
    });
  }

  private constructCommitPayload(): TopicPartitionOffset {
    return { topic: 'hi', partition: 0, offset: 0 };
  }

  private static addToActiveConsumers(
    consumerGroup: string,
    consumerName: string,
  ) {
    if (ConsumerBatch.activeConsumers.has(consumerGroup)) {
      const consumersSameGroup = ConsumerBatch.activeConsumers.get(
        consumerGroup,
      ) as Set<string>;
      if (consumersSameGroup.has(consumerName)) {
        throw new Error(
          `There already exists a ConsumerBatch in group ${consumerGroup} with consumer named ${consumerName}.`,
        );
      } else {
        // NOTE: A Set<string> is a refernce type so we shouldn't need to update the Map object.
        consumersSameGroup.add(consumerName);
      }
    } else {
      ConsumerBatch.activeConsumers.set(consumerGroup, new Set([consumerName]));
    }
  }

  public async consumeBatch(): Promise<void> {
    // TODO: Not callable if already consuming a batch.
    // TODO: Warning if your batch size exceeds "consume.callback.max.messages"

    // This method shouldn't return until all `data` callbacks are run.
    logger.debug(`Calling client to process batch of size ${this.batchSize}`);
    this.consumer.consume(this.batchSize);

    logger.debug(`Processing batch of size ${this.messageBuffer.length}`);
    const callbackResults: PromiseSettledResult<void>[] =
      // TODO: Race against a timeout.
      await Promise.allSettled(
        this.messageBuffer.map((message) => {
          this.consumptionCallback(message);
        }),
      );

    logger.debug(`Filtering callback results.`);
    const messageResultMap = new Map<Message, PromiseSettledResult<void>>();
    this.messageBuffer.forEach((message, j) =>
      messageResultMap.set(message, callbackResults[j]),
    );
    const rejectedMessages: Message[] = [];
    messageResultMap.forEach((result, message) => {
      if (result.status === 'fulfilled') {
        rejectedMessages.push(message);
      }
    });

    if (rejectedMessages.length > 0) {
      logger.debug(`Calling the error callback function.`);
      try {
        await Promise.all(
          rejectedMessages.map((message) => this.errorCallback(message)),
        );
        // TODO: Race against a timeout.
      } catch {
        // TODO: Make a throw versus warn something configurable.
        logger.error('Error processing rejected messages.');
      }
    }

    // TODO: Commit the offset.
  }
}
