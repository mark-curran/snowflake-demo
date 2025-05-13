import { Consumer } from './rdkafkaSupplementaryTypes';
import { KafkaConsumer, type Message } from 'node-rdkafka';
import { consumerConfig, TOPIC } from './connection';
import {
  connectAndResolve,
  subscribeAndResolve,
  disconnectAndResolve,
} from './rdkafkaHelpers';
import logger from './logger';
import { ConsumerBatch } from './consumerBatch';
import { connect } from 'http2';

export async function consumeData(
  totalMessages: number,
  numParitions: number,
  batchSize: number,
) {
  const consumers: Consumer[] = [];

  // Get a bunch of consumers.
  for (var j = 0; j < numParitions; j++) {
    consumers.push(new KafkaConsumer(consumerConfig, {}));
  }
  // Connect them.
  const readyInforArray = await Promise.all(
    consumers.map((consumer) => connectAndResolve(consumer)),
  );
  readyInforArray.forEach((readyInfo) =>
    logger.info(`Consumer is ready ${JSON.stringify(readyInfo)}`),
  );

  // Subscribe them to the topic.
  const subscribeTopicsArray = await Promise.all(
    consumers.map((consumer) => subscribeAndResolve(consumer, [TOPIC])),
  );
  subscribeTopicsArray.forEach((subscribeTopics) => {
    logger.info(`Consumer is subscribed to ${JSON.stringify(subscribeTopics)}`);
  });

  const consumerBatches = consumers.map((consumer, idx) => {
    const initTopicPartitionOffset = {
      topic: TOPIC,
      partition: idx,
      offset: 0,
    };

    return new ConsumerBatch(
      consumer,
      initTopicPartitionOffset,
      async (message: Message) => {
        logger.info(`Processing message: ${JSON.stringify(message)}`);
      },
      batchSize,
      2000,
      500,
    );
  });

  logger.info(
    `Consuming batches until each batch processes ${totalMessages} messages.`,
  );

  var otherPromises = consumerBatches.map((consumerBatch) => {
    return consumerBatch.consumeInBatches(totalMessages);
  });

  await Promise.all(otherPromises);
}
