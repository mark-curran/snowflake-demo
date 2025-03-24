import logger from './logger';
import { consumeData } from './consumer';
import { produceData } from './producer';

async function main() {
  logger.info('Starting Kafka publishing demo.');

  const numMessages = 39;
  const numProducers = 5;
  const maxBatchSize = 15;

  await produceData(numMessages, numProducers, maxBatchSize);

  await consumeData();
}

main();
