import logger from './logger';
import { testConsumeData, consumeBatch } from './consumer';
import { produceData } from './producer';

async function main() {
  logger.info('Starting Kafka publishing demo.');

  // await produceData(10, 1, 15);

  // await testConsumeData();

  await consumeBatch();

  logger.info('End of main function.');
  process.exit();
}

main();
