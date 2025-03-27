import logger from './logger';
import { consumeData } from './consumer';
import { produceData } from './producer';

async function main() {
  logger.info('Starting Kafka publishing demo.');

  const numMessages = 10;
  const numProducers = 1;
  const maxBatchSize = 15;

  // await produceData(numMessages, numProducers, maxBatchSize);

  await consumeData();

  logger.info('End of main function.');
  process.exit();
}

main();
