import { KafkaConsumer, Message } from 'node-rdkafka';
import {
  connectAndResolve,
  consumerConfig,
  disconnectAndResolve,
  subscribeAndResolve,
  TOPIC,
  seekAndResolve,
} from './connection';
import logger from './logger';
import { ConsumerBatch } from './consumerBatch';

export async function consumeBatch() {
  const consumer = new KafkaConsumer(consumerConfig, {});

  const readyInfo = await connectAndResolve(consumer);
  logger.info(`Consumer is ready ${JSON.stringify(readyInfo)}`);

  const subscribeTopics = await subscribeAndResolve(consumer, [TOPIC]);
  logger.info(`Consumer is subscribed to ${JSON.stringify(subscribeTopics)}`);

  const initTopicPartitionOffset = { topic: TOPIC, partition: 0, offset: 0 };

  const batchSize = 2;
  const totalMessages = 10;

  const consumerBatch = new ConsumerBatch(
    consumer,
    initTopicPartitionOffset,
    async (message: Message) => {
      logger.debug(`Processing message: ${JSON.stringify(message)}`);
    },
    batchSize,
    2000,
    500,
  );

  logger.info(`Consuming batches until we process ${totalMessages} messages.`);
  await consumerBatch.consumeInBatches(totalMessages);
}

export async function testConsumeData() {
  const consumer = new KafkaConsumer(consumerConfig, {});

  const readyInfo = await connectAndResolve(consumer);
  logger.info(`Consumer is ready ${JSON.stringify(readyInfo)}`);

  var subscription = consumer.subscription();
  logger.info(
    `Consumer is curently subscribed to ${JSON.stringify(subscription)}`,
  );

  const subscribeTopics = await subscribeAndResolve(consumer, [TOPIC]);
  logger.info(`Consumer is subscribed to ${JSON.stringify(subscribeTopics)}`);

  subscription = consumer.subscription();
  logger.info(`Consumer is now subscribed to ${JSON.stringify(subscription)}`);

  logger.debug('Querying assignments');
  var assignments = consumer.assignments();
  logger.debug(`Assignments are: ${JSON.stringify(assignments)}`);

  const topicPartitionOffset = { topic: TOPIC, partition: 0, offset: 0 };

  logger.debug('Assigning consumer to a topic.');
  consumer.assign([topicPartitionOffset]);

  logger.debug('Querying assignments again');
  assignments = consumer.assignments();
  logger.debug(`Assignments are now: ${JSON.stringify(assignments)}`);

  logger.debug('Setting the consume event listener.');
  consumer.on('data', (message) => {
    logger.debug(`Consumed message: ${JSON.stringify(message)}`);
  });
  logger.debug('Setting the offset commit listener.');
  consumer.on('offset.commit', (error, topicPartitions) => {
    if (!error) {
      logger.debug(
        `Offset committed without error: ${JSON.stringify(topicPartitions)}`,
      );
    } else {
      logger.error(
        `Offset commit raised error ${JSON.stringify(error)} ` +
          `and payload: ${topicPartitions}`,
      );
    }
  });
  logger.debug('Setting the partition EOF event.');
  consumer.on('partition.eof', (eof) => {
    logger.debug(`Partition EOF event: ${JSON.stringify(eof)}`);
  });
  logger.debug('Setting the rebalance event.');
  consumer.on('rebalance', (err, assignments) => {
    logger.debug(`Rebalance event: ${JSON.stringify(assignments)}`);
  });

  /*
  NOTE: Consuming kafka from Event Hubs doesn't seem to be possible because Event Hub doesn't
  have a notion of consumer groups, assignments of Kafka offsets.
  
  This sample returns the same messages more than once and updates the topics when a partition
  is exhausted, all the while failing to trigger a 'rebalance' or 'partition.eof' event.

  Solution is to use the seek() command to manually move the read cursor after every 
  call to consume.  
  */
  for (var j = 0; j < 5; j++) {
    console.log();
    logger.debug('Consuming five messages');
    consumer.consume(5);

    logger.debug('Waiting main thread for 0 second.');
    await new Promise((resolve) => setTimeout(resolve, 10));

    logger.debug('Querying assignments again');
    assignments = consumer.assignments();
    logger.debug(`Assignments are now: ${JSON.stringify(assignments)}`);

    logger.debug('Waiting main thread again for second.');
    await new Promise((resolve) => setTimeout(resolve, 1000));

    logger.debug(`Awaiting a seek to ${JSON.stringify(topicPartitionOffset)}`);
    await seekAndResolve(consumer, topicPartitionOffset);
  }

  logger.debug('Disconnecting the consumer.');
  const clientMetrics = await disconnectAndResolve(consumer);
  logger.debug(`Disconnection info ${JSON.stringify(clientMetrics)}`);

  return;
}
