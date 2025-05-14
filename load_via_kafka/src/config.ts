import { readFileSync } from 'fs';

/*
Import the application config.
*/
type RequiredEnvVars = {
  PRIMARY_CONNECTION_STRING: string;
  TOPIC: string;
  MODE: Mode;
  LOG_LEVEL: LogLevel;
  PARTITION_COUNT: number;
  PRODUCER_COUNT: number;
  PRODUCED_MESSAGES_COUNT: number;
  PRODUCED_BATCH_SIZE: number;
  CONSUMED_TOTAL_MESSAGES: number;
  CONSUMED_BATCH_SIZE: number;
};

type AppConfig = {
  broker: string;
  password: string;
  topic: string;
  mode: Mode;
  logLevel: LogLevel;
  partitionCount: number;
  producerCount: number;
  producedMessagesCount: number;
  producedBatchSize: number;
  consumedTotalMessages: number;
  consumedBatchSize: number;
};

enum Mode {
  produce = 'produce',
  consume = 'consume',
  both = 'both',
}

enum LogLevel {
  INFO = 'info',
  DEBUG = 'debug',
}

function getLogLevelFromEnv(): LogLevel {
  const rawValue = process.env.LOG_LEVEL;

  if (rawValue === 'INFO') return LogLevel.INFO;
  if (rawValue === 'DEBUG') return LogLevel.DEBUG;

  throw new Error(
    `Invalid LOG_LEVEL: "${rawValue}". Must be "INFO" or "DEBUG".`,
  );
}

function get_secret(secretName: string): string {
  // TODO: Check if the secret exists as an environment variable.
  const value =
    process.env[secretName] ??
    readFileSync(`/run/secrets/${secretName}`, 'utf-8');

  if (!value) {
    throw new Error(
      `Secret ${secretName} not found in env vars or /run/secrets/${secretName}`,
    );
  }

  return value;
}

function getRequiredEnvVars(): RequiredEnvVars {
  const primaryConnectionString = get_secret('PRIMARY_CONNECTION_STRING');
  const topic = process.env.TOPIC;
  const mode = process.env.MODE;
  const partitionCount = Number(process.env.PARTITION_COUNT);
  const producerCount = Number(process.env.PRODUCER_COUNT);
  const producedMessagesCount = Number(process.env.PRODUCED_MESSAGES_COUNT);
  const producedBatchSize = Number(process.env.PRODUCED_BATCH_SIZE);
  const consumedTotalMessages = Number(process.env.CONSUMED_TOTAL_MESSAGES);
  const consumedBatchSize = Number(process.env.CONSUMED_BATCH_SIZE);

  if (!primaryConnectionString) {
    throw new Error('The envvar PRIMARY_CONNECTION_STRING must be defined.');
  }
  if (!topic) {
    throw new Error('The envvar TOPIC must be defined.');
  }
  if (!mode) {
    throw new Error('The envvar MODE must be defined.');
  }
  if (!partitionCount) {
    throw new Error('The envvar PARTITION_COUNT is not a valid number.');
  }
  if (!producerCount) {
    throw new Error('The envvar PRODUCER_COUNT is not a valid number.');
  }

  if (!producedMessagesCount) {
    throw new Error(
      'The envvar PRODUCED_MESSAGES_COUNT is not a valid number.',
    );
  }
  if (!producedBatchSize) {
    throw new Error('The envvar PRODUCED_BATCH_SIZE is not a valid number.');
  }
  if (!consumedTotalMessages) {
    throw new Error(
      'The envvar CONSUMED_TOTAL_MESSAGES is not a valid number.',
    );
  }
  if (!consumedBatchSize) {
    throw new Error('The envvar CONSUMED_BATCH_SIZE is not a valid number.');
  }

  // Extra validation to change to lower case.
  const logLevel = getLogLevelFromEnv();

  if (!Object.values(Mode).includes(mode as Mode)) {
    throw new Error(
      "The envvar MODE must be one of 'produce', 'consumer' or 'both'.",
    );
  }

  return {
    PRIMARY_CONNECTION_STRING: primaryConnectionString,
    TOPIC: topic,
    MODE: mode as Mode,
    LOG_LEVEL: logLevel,
    PARTITION_COUNT: partitionCount,
    PRODUCER_COUNT: producerCount,
    PRODUCED_MESSAGES_COUNT: producedMessagesCount,
    PRODUCED_BATCH_SIZE: producedBatchSize,
    CONSUMED_TOTAL_MESSAGES: consumedTotalMessages,
    CONSUMED_BATCH_SIZE: consumedBatchSize,
  };
}

function extractBrokerAddress(primaryConnectionString: string): string {
  const broker = primaryConnectionString.split('//')[1].split('/')[0] + ':9093';

  return broker;
}

function getAppConfig(requiredEnvVars: RequiredEnvVars): AppConfig {
  return {
    broker: extractBrokerAddress(requiredEnvVars.PRIMARY_CONNECTION_STRING),
    password: requiredEnvVars.PRIMARY_CONNECTION_STRING,
    topic: requiredEnvVars.TOPIC,
    mode: requiredEnvVars.MODE,
    logLevel: requiredEnvVars.LOG_LEVEL,
    partitionCount: requiredEnvVars.PARTITION_COUNT,
    producerCount: requiredEnvVars.PRODUCER_COUNT,
    producedMessagesCount: requiredEnvVars.PRODUCED_MESSAGES_COUNT,
    producedBatchSize: requiredEnvVars.PRODUCED_BATCH_SIZE,
    consumedTotalMessages: requiredEnvVars.CONSUMED_TOTAL_MESSAGES,
    consumedBatchSize: requiredEnvVars.CONSUMED_BATCH_SIZE,
  };
}

export const APP_CONFIG = getAppConfig(getRequiredEnvVars());
