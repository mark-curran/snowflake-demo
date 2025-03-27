// Load data to Kafka.
import { producerConfig, ProducerInput, TOPIC } from './connection';
import { Producer, ReadyInfo } from 'node-rdkafka';
import logger from './logger';
import { MessageBatch } from './messageBatch';

export async function produceData(
  numMessages: number,
  numProducers: number,
  maxBatchSize: number,
) {
  // Get a bunch of producers.
  const producers: Producer[] = [];
  for (var j = 0; j < numProducers; j++) {
    producers.push(getConfiguredProducer(`producer-${j}`));
  }

  // Wait for them all to connect.
  logger.info(`Waiting for ${producers.length} producers to connect.`);

  const readyInfo = await Promise.all(producers.map(connectAndResolve));
  logger.info(`Producers have returned ready info.`);
  readyInfo.forEach((readyInfo) => {
    logger.info(`Ready info: ${JSON.stringify(readyInfo)}`);
  });

  // Get a bunch of raw messages.
  const inputs = generateProducerInput(numMessages);

  // Get some batches to manage sending those messages.
  const batches = producers.map((producer) => {
    return new MessageBatch(producer, maxBatchSize);
  });

  // Split the input messages into batches.
  const batchedInputs = new Map<MessageBatch, ProducerInput[]>();
  inputs.forEach((input, j) => {
    const batch = batches[j % producers.length];
    batchedInputs.set(batch, [...(batchedInputs.get(batch) ?? []), input]);
  });

  // Send the batches.
  await Promise.all(
    Array.from(batchedInputs, ([batch, input]): Promise<void> => {
      return batch.sendBatch(input);
    }),
  );

  // Print the summaries.
  logger.info('Printing delivery summaries.');
  batches.forEach((batch) => {
    batch.busAcks.forEach(({ err, report }) => {
      logger.info(
        `Message key ${report.key} timestamp ${report.timestamp} sent to parition ${report.partition}`,
      );
    });
  });

  // Disconect each producer.
  logger.info('Disconnecting producers.');
  producers.forEach((producer) => {
    producer.disconnect();
  });
}

function generateProducerInput(numMessages: number): ProducerInput[] {
  const messages: ProducerInput[] = [];

  for (var j = 0; j < numMessages; j++) {
    const person = {
      id: j, // TODO: Replace with a more realistic non-colliding unique id.
      name: `Joey Joe Joe Junior Number ${j}`,
      age: 30 + j,
    };
    const value = Buffer.from(JSON.stringify(person), 'utf-8');

    const inputs: ProducerInput = {
      topic: TOPIC,
      partition: undefined,
      message: value,
      key: `${person.id}`,
    };

    messages.push(inputs);
  }

  return messages;
}

function getConfiguredProducer(clientId?: string): Producer {
  const producer = new Producer({ ...producerConfig, 'client.id': clientId });

  // Configuration options.
  producer.on('event.log', (eventData) => logger.debug(eventData));
  producer.on('event.error', (error) =>
    logger.error(`Kafka producer error ${error}`),
  );
  producer.on('disconnected', (clientMetrics) => {
    logger.info('Producer disconnected: ' + JSON.stringify(clientMetrics));
  });

  return producer;
}

// TODO: Use the common function for this.
async function connectAndResolve(producer: Producer): Promise<ReadyInfo> {
  return new Promise((resolve) => {
    producer.on('ready', (readyInfo) => {
      resolve(readyInfo);
    });

    producer.connect();
  });
}
