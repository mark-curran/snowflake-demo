/**
 * @module: rdkafkaTestTypes
 * @description: Some rdkafka method like RdkafkaProducer.poll() return `this` instead
 * of `void`. We don't use the return values in the application code but need the types
 * so that we can write mocks for our tests.
 */
import type {
  Producer as RdkafkaProducer,
  KafkaConsumer as RdkafkaConsumer,
} from 'node-rdkafka';

export type TestRdkafkaProducer = RdkafkaProducer;
export type TestRdKafkaConsumer = RdkafkaConsumer;
