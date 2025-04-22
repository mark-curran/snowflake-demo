/**
 * @module: rdkafkaHelpers
 * @description: Declaration for objects returned by the rdkafka library that don't have types.
 */

import type {
  LibrdKafkaError,
  DeliveryReport,
  NumberNullUndefined,
  MessageValue,
  MessageKey,
  MessageHeader,
} from 'node-rdkafka';

import type {
  Client as RdkafkaClient,
  Producer as RdkafkaProducer,
  KafkaClientEvents as RdkafkaKafkaClientEvents,
} from 'node-rdkafka';

type ClientMethods =
  | 'on'
  | 'isConnected'
  | 'connect'
  | 'disconnect'
  | 'listenerCount';

type ProducerMethods = ClientMethods | 'produce' | 'poll';

export type Client = Pick<
  RdkafkaClient<RdkafkaKafkaClientEvents>,
  ClientMethods
>;

export type Producer = Pick<RdkafkaProducer, ProducerMethods>;

export type busAck = {
  err: LibrdKafkaError;
  report: DeliveryReport;
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
