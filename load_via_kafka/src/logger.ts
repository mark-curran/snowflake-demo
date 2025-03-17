// TODO: Configure the logger.
import { createLogger, format, transports } from 'winston';

const logger = createLogger({
  level: 'debug',
  transports: [new transports.Console()],
  // TODO: Add formatting.
});

export default logger;
