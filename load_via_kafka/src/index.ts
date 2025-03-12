// TODO: Start the producer.
// TODO: Start the consumer.
// TODO: Run using command line arguments.
import logger from './logger';
import { getConnectionData, type ConnectionData } from './connection';

const connectionData: ConnectionData = getConnectionData();

logger.info('Please stop here.');
