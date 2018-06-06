import path from 'path';
import util from 'util';

import winston from 'winston';
import logform, { format } from 'logform';

import _ from 'lodash';

import { config } from './config';

// TODO
// Move this to Config?
function logPath(log: string): string {
  return path.join(config().LOG_PATH, log);
}

const winstonLogger = winston.createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new winston.transports.File({ filename: logPath('error.log'), level: 'error' }),
    new winston.transports.File({ filename: logPath('combined.log') })
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: logPath('exceptions.log') })
  ]
});

interface ConsoleFormatterOptions {
  colorize: boolean;
}

class ConsoleFormatter {
  private opts: ConsoleFormatterOptions;

  constructor(opts: ConsoleFormatterOptions = { colorize: true }) {
    this.opts = opts;
  }

  transform(info: logform.TransformableInfo) {
    const excludedKeys = ['timestamp', 'level', 'message', Symbol.for('level'), Symbol.for('message')];
    const extraOptions = _.omit(info, excludedKeys);
    const inspected = util.inspect(extraOptions, false, null, this.opts.colorize);

    const padding = info.padding && info.padding[info.level] || '';

    const MESSAGE: any = Symbol.for('message');

    if (inspected !== '{}') {
      info[MESSAGE] = `${info.timestamp} [${info.level}]:${padding} ${info.message}\n${inspected}`;
    } else {
      info[MESSAGE] = `${info.timestamp} [${info.level}]:${padding} ${info.message}`;
    }

    return info;
  }
}

if (config().NODE_ENV !== 'production') {
  winstonLogger.add(new winston.transports.Console({
    handleExceptions: true,
    format: format.combine(
      format.colorize(),
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      new ConsoleFormatter(),
    )
  }));
}

export default winstonLogger;
