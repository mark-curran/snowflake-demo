/**
 * @module: rdkafkaHelpers
 * @description: Helper functions for interacting with the rdkafka library.
 */
import {
  MessageKey,
  KafkaConsumer,
  TopicPartitionOffset,
  ClientMetrics,
  SubscribeTopicList,
  ReadyInfo,
} from 'node-rdkafka';
import { Client } from './rdkafkaSupplementaryTypes';
import logger from './logger';

export function decodeKey(key: MessageKey): string | null | undefined {
  if (typeof key === 'string') {
    return key;
  }
  if (key instanceof Buffer) {
    return key.toString('utf-8');
  }
}

export async function seekAndResolve(
  consumer: KafkaConsumer,
  topicPartitionOffset: TopicPartitionOffset,
): Promise<void> {
  new Promise((resolve) => {
    consumer.seek(topicPartitionOffset, null, (err) => {
      if (!err) {
        logger.debug('Seek callback no error');
      }
      resolve;
    });
  });
}

export async function disconnectAndResolve(
  client: Client,
): Promise<ClientMetrics> {
  return new Promise((resolve) => {
    client.on('disconnected', (clientMetrics) => {
      resolve(clientMetrics);
    });

    client.disconnect();
  });
}

export async function subscribeAndResolve(
  consumer: KafkaConsumer,
  topics: SubscribeTopicList,
): Promise<SubscribeTopicList> {
  return new Promise((resolve) => {
    consumer.on('subscribed', (topics: SubscribeTopicList) => {
      resolve(topics);
    });

    consumer.subscribe(topics);
  });
}

export async function connectAndResolve(client: Client): Promise<ReadyInfo> {
  return new Promise((resolve) => {
    client.on('ready', (readyInfo) => {
      resolve(readyInfo);
    });

    client.connect();
  });
}
