/**
 * @module: connection
 * @description: Config for managing the connection to Event Hubs.
 */
import {
  GlobalConfig,
  ConsumerGlobalConfig,
  ProducerGlobalConfig,
} from 'node-rdkafka';
import { APP_CONFIG } from './config';

const SASL_USERNAME = '$ConnectionString';
const GLOGAL_CONFIG: GlobalConfig = {
  'metadata.broker.list': APP_CONFIG.broker,
  'socket.keepalive.enable': true,
  'security.protocol': 'sasl_ssl',
  'sasl.mechanism': 'PLAIN',
  'sasl.username': SASL_USERNAME,
  'sasl.password': APP_CONFIG.password,
};

// TODO: Retrieve directly from app config.
export const TOPIC = APP_CONFIG.topic;
export const consumerConfig: ConsumerGlobalConfig = {
  ...GLOGAL_CONFIG,
  // TODO: In EventHub do we even need a consumer group at all?
  'group.id': 'happy-consumer-group',
  'enable.auto.commit': false,
};
export const producerConfig: ProducerGlobalConfig = {
  ...GLOGAL_CONFIG,
  dr_cb: true,
};
