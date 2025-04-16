/*
Import the application config.
*/
type RequiredEnvVars = {
  PRIMARY_CONNECTION_STRING: string;
  TOPIC: string;
  MODE: Mode;
};
type AppConfig = {
  broker: string;
  password: string;
  topic: string;
  mode: Mode;
};
enum Mode {
  produce = 'produce',
  consume = 'consume',
  both = 'both',
}

function getRequiredEnvVars(): RequiredEnvVars {
  const primaryConnectionString = process.env.PRIMARY_CONNECTION_STRING;
  const topic = process.env.TOPIC;
  const mode = process.env.MODE;

  // TODO: Make this a loop
  if (!primaryConnectionString) {
    throw new Error('The envvar PRIMARY_CONNECTION_STRING must be defined.');
  }
  if (!topic) {
    throw new Error('The envvar TOPIC must be defined.');
  }
  if (!mode) {
    throw new Error('The envvar MODE must be defined.');
  }

  if (!Object.values(Mode).includes(mode as Mode)) {
    throw new Error(
      "The envvar MODE must be one of 'produce', 'consumer' or 'both'.",
    );
  }

  return {
    PRIMARY_CONNECTION_STRING: primaryConnectionString,
    TOPIC: topic,
    MODE: mode as Mode,
  };
}

function extractBrokerAddress(primaryConnectionString: string): string {
  // TODO: Setup some unit tests.
  const broker = primaryConnectionString.split('//')[1].split('/')[0] + ':9093';

  return broker;
}

function getAppConfig(requiredEnvVars: RequiredEnvVars): AppConfig {
  return {
    broker: extractBrokerAddress(requiredEnvVars.PRIMARY_CONNECTION_STRING),
    password: requiredEnvVars.PRIMARY_CONNECTION_STRING,
    topic: requiredEnvVars.TOPIC,
    mode: requiredEnvVars.MODE,
  };
}

export const APP_CONFIG = getAppConfig(getRequiredEnvVars());
