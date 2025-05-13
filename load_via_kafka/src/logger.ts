import { createLogger, transports } from 'winston';
import { APP_CONFIG } from './config';

const logger = createLogger({
  level: APP_CONFIG.logLevel,
  transports: [new transports.Console()],
});

export default logger;
