// Load data to Kafka.
import { producerConfig, TOPIC } from './connection';
import { ProducerInput, type Producer } from './rdkafkaSupplementaryTypes';
import { Producer as RdkafkaProducer } from 'node-rdkafka';
import logger from './logger';
import { ProducerBatch } from './producerBatch';
import { connectAndResolve, disconnectAndResolve } from './rdkafkaHelpers';
import { generateProducerInput } from './dataGeneration';

export async function produceData(
  numMessages: number,
  numProducers: number,
  maxBatchSize: number,
) {
  // Get a bunch of producers.
  const producers: Producer[] = [];
  for (var j = 0; j < numProducers; j++) {
    producers.push(
      new RdkafkaProducer({
        ...producerConfig,
        'client.id': `producer-${j}`,
      }),
    );
  }

  // Wait for them all to connect.
  logger.info(`Waiting for ${producers.length} producers to connect.`);
  const readyInfoObjects = await Promise.all(producers.map(connectAndResolve));
  logger.info(`Producers have returned ready info.`);
  readyInfoObjects.forEach((readyInfo) => {
    logger.info(`Ready info: ${JSON.stringify(readyInfo)}`);
  });

  // Generate a bunch of raw messages.
  const inputs = generateProducerInput(numMessages);

  // Get some ProducerBatches to manage sending those messages.
  const producerBatches = producers.map((producer) => {
    return new ProducerBatch(producer, maxBatchSize);
  });

  // Split the input messages into batches.
  const batchedInputs = new Map<ProducerBatch, ProducerInput[]>();
  inputs.forEach((input, j) => {
    const batch = producerBatches[j % producers.length];
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
  producerBatches.forEach((producerBatch) => {
    producerBatch.busAcks.forEach(({ err, report }) => {
      logger.info(
        `Message key ${report.key} timestamp ${report.timestamp} sent to parition ${report.partition} + with error ${err}`,
      );
    });
  });

  // Disconect each producer.
  logger.info('Disconnecting producers.');
  const clientMetricsObjects = await Promise.all(
    producers.map((producer) => disconnectAndResolve(producer)),
  );
  clientMetricsObjects.map((clientMetrics) =>
    logger.info(`Client metrics ${JSON.stringify(clientMetrics)}`),
  );
}
