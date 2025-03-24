// TODO: Zod library for type checking.
import * as fs from 'fs';
import logger from './logger';
import { z } from 'zod';
import {
  GlobalConfig,
  ConsumerGlobalConfig,
  ProducerGlobalConfig,
  LibrdKafkaError,
  DeliveryReport,
  NumberNullUndefined,
  MessageValue,
  MessageKey,
  MessageHeader,
} from 'node-rdkafka';

// TODO: Find somewhere to put this
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

const connectionData: ConnectionData = getConnectionData();

// TODO: Do not export these.
export type ConnectionData = {
  broker: string;
  password: string;
};

export const SASL_USERNAME = '$ConnectionString';
export const TOPIC = 'test-data';

export const globalConfig: GlobalConfig = {
  'metadata.broker.list': connectionData.broker,
  'socket.keepalive.enable': true,
  'security.protocol': 'sasl_ssl',
  'sasl.mechanism': 'PLAIN',
  'sasl.username': SASL_USERNAME,
  'sasl.password': connectionData.password,
};
export const consumerConfig: ConsumerGlobalConfig = {
  ...globalConfig,
  'group.id': 'test-consumer-group',
  'enable.auto.commit': false,
};
export const producerConfig: ProducerGlobalConfig = {
  ...globalConfig,
  dr_cb: true,
};

export function getConnectionData(): ConnectionData {
  const terraformOutputJson = fs.readFileSync(
    'event_hub_connection.json',
    'utf-8',
  );

  const terraformOutputSchema = z.object({
    primary_connection_string: z.string(),
  });

  logger.info('Retrieving connection data.');
  const parsedTerraformOutput: z.infer<typeof terraformOutputSchema> =
    terraformOutputSchema.parse(JSON.parse(terraformOutputJson));

  return {
    broker: getBrokerAddress(parsedTerraformOutput.primary_connection_string),
    password: parsedTerraformOutput.primary_connection_string,
  };
}

export function decodeKey(key: MessageKey): string | null | undefined {
  if (typeof key === 'string') {
    return key;
  }
  if (key instanceof Buffer) {
    return key.toString('utf-8');
  }
}

function getBrokerAddress(primaryConnectionString: string): string {
  // TODO: Setup some unit tests.
  const broker = primaryConnectionString.split('//')[1].split('/')[0] + ':9093';

  return broker;
}
