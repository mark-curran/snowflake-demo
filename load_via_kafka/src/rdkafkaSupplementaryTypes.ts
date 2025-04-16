/**
 * @module: rdkafkaHelpers
 * @description: Declaration for objects returned by the rdkafka library that don't have types.
 */

import {
  LibrdKafkaError,
  DeliveryReport,
  NumberNullUndefined,
  MessageValue,
  MessageKey,
  MessageHeader,
} from 'node-rdkafka';

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
