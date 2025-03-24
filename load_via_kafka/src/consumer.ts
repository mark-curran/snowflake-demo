import { KafkaConsumer, ConsumerGlobalConfig, Assignment } from 'node-rdkafka';
import { getConnectionData, type ConnectionData } from './connection';
import logger from './logger';

export async function consumeData() {
  return;
}

// const connectionData: ConnectionData = getConnectionData();
// TODO: Move somewhere else.
// const SASL_USERNAME = '$ConnectionString';
// const topic = 'test-data';
// const partition = 0;
// const offset = 0;

// const config: ConsumerGlobalConfig = {
//   'metadata.broker.list': connectionData.broker,
//   'group.id': 'nodejs-cg',
//   'socket.keepalive.enable': true,
//   'enable.auto.commit': false,
//   'security.protocol': 'sasl_ssl',
//   'sasl.mechanism': 'PLAIN',
//   'sasl.username': SASL_USERNAME,
//   'sasl.password': connectionData.password,
// };

// const consumer = new KafkaConsumer(config, {});

// consumer.on('event.log', (eventData) =>
//   logger.debug(`Consumer log: ${JSON.stringify(eventData)}`),
// );
// consumer.on('event.error', (err) => logger.error(`Consumer error: ${err}`));
// consumer.on('disconnected', (clientMetrics) =>
//   logger.info(`Disconnecting Kafka consumer: ${clientMetrics}`),
// );

// consumer.on('data', (message) => {
//   logger.info(`Processing kafka message: ${JSON.stringify(message)}`);
//   // TODO: Commit the message
// });

// consumer.on('ready', (readyInfo) => {
//   logger.info(`Consumer ready ${JSON.stringify(readyInfo)}`);

//   logger.info(
//     `Subscribing to topic ${topic} partition: ${partition} offset ${offset} `,
//   );
//   const assignment: Assignment = {
//     topic: topic,
//     partition: partition,
//     offset: offset,
//   };
//   //   consumer.subscribe([topic]);
//   consumer.assign([assignment]);

//   logger.info(`Starting to consume`);
//   consumer.consume();
// });

// export function connectConsumer() {
//   logger.info('Connecting kafka consumer.');
//   consumer.connect();
// }
