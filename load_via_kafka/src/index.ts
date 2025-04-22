import logger from './logger';
import { testConsumeData, consumeBatch } from './consume';
import { produceData } from './produce';
import { APP_CONFIG } from './config';

async function main() {
  logger.info('Starting Kafka publishing demo.');

  const mode = APP_CONFIG.mode;

  logger.info(`Operating in ${mode} mode.`);

  if (['produce', 'both'].includes(mode)) {
    await produceData(20, 2, 15);
  }

  if (['consume', 'both'].includes(mode)) {
    await consumeBatch();
  }

  // await testConsumeData();

  logger.info('End of main function.');
  process.exit();
}

main();
