// TODO: Configure the logger.
import { createLogger, format, transports } from 'winston';

const logger = createLogger({
  level: 'info',
  transports: [new transports.Console()],
});

export default logger;
