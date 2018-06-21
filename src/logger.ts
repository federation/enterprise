import path from 'path';
import util from 'util';

import winston from 'winston';
import Transport from 'winston-transport';
import logform, { format } from 'logform';

import _ from 'lodash';

import { config } from './config';

// TODO: Move this to Config?
function logPath(log: string): string {
  return path.join(config().WORK_DIR, 'logs/', log);
}

interface ConsoleFormatterOptions {
  colorize: boolean;
}

class ConsoleFormatter {
  private opts: ConsoleFormatterOptions;

  constructor(opts: ConsoleFormatterOptions = { colorize: true }) {
    this.opts = opts;
  }

  transform(info: logform.TransformableInfo) {
    const excludedKeys = [
      'timestamp',
      'level',
      'message',
      'splat',
      Symbol.for('level'),
      Symbol.for('message'),
      Symbol.for('splat'),
    ];
    const extraOptions = _.omit(info, excludedKeys);
    const inspected = util.inspect(extraOptions, false, null, this.opts.colorize);

    const padding = (info.padding && info.padding[info.level]) || '';

    const MESSAGE: any = Symbol.for('message');

    info[MESSAGE] = `${info.timestamp} [${info.level}]:${padding} ${info.message}`;

    if (inspected !== '{}') {
      info[MESSAGE] += `\n${inspected}`;
    }

    return info;
  }
}

export class NullTransport extends Transport {
  log(info: any, callback: any) {
    callback();
  }
}

let logger_: winston.Logger;

export function setLogger(logger: winston.Logger) {
  logger_ = logger;
}

export function logger(): winston.Logger {
  if (!logger_) {
    if (config().NODE_ENV === 'test') {
      logger_ = winston.createLogger({
        silent: true,
        transports: [new NullTransport()],
      });

      return logger_;
    }

    logger_ = winston.createLogger({
      level: 'info',
      format: format.combine(
        format.timestamp(),
        format.json()
      ),
      transports: [
        new winston.transports.File({ filename: logPath('error.log'), level: 'error' }),
        new winston.transports.File({ filename: logPath('combined.log') }),
      ],
      exceptionHandlers: [
        new winston.transports.File({ filename: logPath('exceptions.log') }),
      ],
    });

    if (config().NODE_ENV === 'development') {
      logger_.add(new winston.transports.Console({
        handleExceptions: true,
        format: format.combine(
          format.colorize(),
          format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          new ConsoleFormatter(),
        ),
      }));
    }
  }

  return logger_;
}
