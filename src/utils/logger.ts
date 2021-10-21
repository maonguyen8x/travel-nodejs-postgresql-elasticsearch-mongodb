import * as root from 'app-root-path';
const winston = require('winston');
require('winston-daily-rotate-file');

const {createLogger, format, transports} = winston;
const {combine, timestamp, label, printf} = format;

const myFormat = printf(
  (options: {timestamp: string; label: string; level: string; message: string}) =>
    `${options.timestamp} [${options.label}] ${options.level}: ${options.message}`,
);

const logger = createLogger({
  format: combine(label({label: 'APPLICATION'}), timestamp(), myFormat),
  transports: [
    new winston.transports.DailyRotateFile({
      datePattern: 'YYYY-MM-DD',
      filename: '%DATE%.log',
      dirname: `${root}/logs/infos`,
      utc: true,
      level: 'info',
    }),

    new winston.transports.DailyRotateFile({
      datePattern: 'YYYY-MM-DD',
      filename: '%DATE%.err.log',
      dirname: `${root}/logs/errors`,
      utc: true,
      level: 'error',
    }),
  ],
});

logger.add(
  new transports.Console({
    handleExceptions: true,
    format: format.combine(
      format.colorize({
        all: true,
      }),
    ),
  }),
);

export default logger;
