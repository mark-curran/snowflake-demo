import { KafkaConsumer } from 'node-rdkafka';
import {
  connectAndResolve,
  consumerConfig,
  disconnectAndResolve,
  subscribeAndResolve,
  TOPIC,
} from './connection';
import logger from './logger';
import { ConsumerBatch } from './consumeBatch';

export async function consumeData() {
  const consumer = getConfiguredConsumer();

  const readyInfo = await connectAndResolve(consumer);
  logger.info(`Consumer is ready ${JSON.stringify(readyInfo)}`);

  const subscribeTopics = await subscribeAndResolve(consumer, [TOPIC]);
  logger.info(`Consumer is subscribed to ${JSON.stringify(subscribeTopics)}`);

  logger.debug('Querying offests.');
  const offsets = consumer.getWatermarkOffsets(TOPIC, 0);
  logger.debug(`Offsets are: ${JSON.stringify(offsets)}`);

  logger.debug('Querying assignments');
  var assignments = consumer.assignments();
  logger.debug(`Assignments are: ${JSON.stringify(assignments)}`);

  const topicPartitionOffset = { topic: TOPIC, partition: 0, offset: 0 };

  logger.debug('Assigning consumer to a topic.');
  consumer.assign([topicPartitionOffset]);

  logger.debug('Querying assignments again');
  assignments = consumer.assignments();
  logger.debug(`Assignments are now: ${JSON.stringify(assignments)}`);

  logger.debug('Consuming one message');
  consumer.on('data', (message) => {
    logger.debug(`Consumed message: ${JSON.stringify(message)}`);
  });
  consumer.consume(1;

  logger.debug('Waiting main thread for five seconds.');
  await new Promise((resolve) => setTimeout(resolve, 5000));

  logger.debug('Querying assignments again');
  assignments = consumer.assignments();
  logger.debug(`Assignments are now: ${JSON.stringify(assignments)}`);

  logger.debug('Atempting to commit the offset');
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
  consumer.commitMessage(topicPartitionOffset);

  logger.debug('Waiting main thread for another five seconds.');
  await new Promise((resolve) => setTimeout(resolve, 5000));

  logger.debug('Querying assignments again');
  assignments = consumer.assignments();
  logger.debug(`Assignments are now: ${JSON.stringify(assignments)}`);

  logger.debug('Trying to get data about commits.');
  consumer.committed(
    [{ topic: TOPIC, partition: 0 }],
    1000,
    (err, returnedValue) => {
      logger.debug(
        `Error: ${err} TopicPartitionOffsets ${JSON.stringify(returnedValue)}`,
      );
    },
  );

  logger.debug('Waiting main thread for another two seconds.');
  await new Promise((resolve) => setTimeout(resolve, 2000));

  logger.debug('Disconnecting the consumer.');
  const clientMetrics = await disconnectAndResolve(consumer);
  logger.debug(`Disconnection info ${JSON.stringify(clientMetrics)}`);

  return;
}

function getConfiguredConsumer(): KafkaConsumer {
  const consumer = new KafkaConsumer(consumerConfig, {
    'auto.offset.reset': 'earliest',
  });

  consumer.on('event.log', (eventData) =>
    logger.debug(`Consumer log: ${JSON.stringify(eventData)}`),
  );
  consumer.on('event.error', (err) => logger.error(`Consumer error: ${err}`));

  return consumer;
}
