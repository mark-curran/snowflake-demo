/**
 * @module: rdkafkaHelpers
 * @description: Declaration for objects returned by the rdkafka library that don't have types.
 */

import type {
  LibrdKafkaError,
  DeliveryReport,
  NumberNullUndefined,
  Message as RdkafkaMessage,
  MessageValue,
  MessageKey,
  MessageHeader,
  TopicPartitionOffset as RdkafkaTopicPartitionOffset,
  Client as RdkafkaClient,
  Producer as RdkafkaProducer,
  KafkaConsumer as RdkafkaConsumer,
  KafkaClientEvents as RdkafkaKafkaClientEvents,
} from 'node-rdkafka';

type ClientMethods =
  | 'on'
  | 'isConnected'
  | 'connect'
  | 'disconnect'
  | 'listenerCount';

type ProducerMethods = ClientMethods | 'produce' | 'poll';
type ConsumerMethods =
  | ClientMethods
  | 'consume'
  | 'assign'
  | 'subscription'
  | 'subscribe'
  | 'seek';

export type Client = Pick<
  RdkafkaClient<RdkafkaKafkaClientEvents>,
  ClientMethods
>;

export type Producer = Pick<RdkafkaProducer, ProducerMethods>;
export type Consumer = Pick<RdkafkaConsumer, ConsumerMethods>;

export type TopicPartitionOffset = RdkafkaTopicPartitionOffset;
export type Message = RdkafkaMessage;

export type BusAck = {
  report: DeliveryReport;
  err?: LibrdKafkaError;
};

export type ProducerInput = {
  topic: string;
  partition: NumberNullUndefined;
  message: MessageValue;
  key?: MessageKey;
  timestamp?: NumberNullUndefined;
  opaque?: any;
  headers?: MessageHeader[];
};
