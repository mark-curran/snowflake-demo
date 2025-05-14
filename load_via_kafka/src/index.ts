import logger from './logger';
import { consumeData } from './consume';
import { produceData } from './produce';
import { APP_CONFIG } from './config';

async function main() {
  logger.info('Starting Kafka publishing demo.');

  const mode = APP_CONFIG.mode;

  logger.info(`Operating in ${mode} mode.`);

  if (['produce', 'both'].includes(mode)) {
    await produceData(
      APP_CONFIG.producedMessagesCount,
      APP_CONFIG.producerCount,
      APP_CONFIG.producedBatchSize,
    );
  }

  if (['consume', 'both'].includes(mode)) {
    await consumeData(
      APP_CONFIG.consumedTotalMessages,
      APP_CONFIG.partitionCount,
      APP_CONFIG.consumedBatchSize,
    );
  }

  logger.info('End of main function.');
  process.exit();
}

main();
