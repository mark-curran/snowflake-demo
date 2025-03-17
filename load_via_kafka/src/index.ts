import logger from './logger';
import { getConnectionData, type ConnectionData } from './connection';
import {
  KafkaProducerEvents,
  Producer,
  ProducerGlobalConfig,
  ReadyInfo,
} from 'node-rdkafka';
import { number } from 'zod';
import { connectConsumer } from './consumer';

connectConsumer();

// TODO: Publish to a specific offset.
// const connectionData: ConnectionData = getConnectionData();
// const SASL_USERNAME = '$ConnectionString';

// const config: ProducerGlobalConfig = {
//   'metadata.broker.list': connectionData.broker,
//   dr_cb: true,
//   'security.protocol': 'sasl_ssl',
//   'sasl.mechanism': 'PLAIN',
//   'sasl.username': SASL_USERNAME,
//   'sasl.password': connectionData.password,
// };

// TODO: Share the name of the topic between terraform and nodejs.
// const topic = 'test-data';
// const producer = new Producer(config);
// const partition = -1;
// const maxMessages = 1;
// var counter = 0;

// // TODO: Move the producer initialisation somewhere else.
// producer.on('event.log', (eventData) => logger.debug(eventData));
// producer.on('event.error', (error) =>
//   logger.error(`Kafka producer error ${error}`),
// );
// producer.on('disconnected', (clientMetrics) => {
//   console.log('Producer disconnected: ' + JSON.stringify(clientMetrics));
// });

// producer.on('delivery-report', (error, report) => {
//   if (!error) {
//     logger.info(`Successful delivery: ${report}`);
//   }
//   counter++;
// });
// producer.on('ready', (readyInfo) => {
//   logger.info(`Producer is ready ${JSON.stringify(readyInfo)}`);

//   for (var j = 0; j < maxMessages; j++) {
//     const person = { id: j, name: `Joey Joe Joe Number ${j}`, age: 30 + j };
//     const value = Buffer.from(JSON.stringify(person), 'utf-8');
//     const key = `key_${j + 10}`;
//     logger.info(`Attempting to send key-value to Kafka: ${key} : ${value}`);
//     producer.produce(topic, partition, value, key, Date.now());
//   }

//   var pollLoop = setInterval(() => {
//     logger.info('Polling topic.');
//     producer.poll();
//     logger.info(`Counter is currently ${counter}`);
//     if (counter == maxMessages) {
//       clearInterval(pollLoop);
//       logger.info('All messages delivered. Disconnecting.');
//       producer.disconnect();
//     }
//   }, 1000);
// });

// // TODO: Move data synthesis and types into separate module.
// // TODO: How to I share data definition types with my python code?
// type Person = {
//   id: number;
//   name: string;
//   age: number;
// };

// logger.info('Connecting to kafka.');
// producer.connect();
