import path from 'path';

interface Options {
  readonly PORT: number;
  readonly HOST: string;
  readonly NODE_ENV: string;
  readonly LOG_PATH: string;
}

interface Requirements {
  readonly JWT_SECRET: string;
}

interface Configuration extends Options, Requirements {}

interface Environment {
  [variable: string]: string | undefined;
}

export function getDefaultOptions(): Options {
  return {
    PORT: 8080,
    HOST: '0.0.0.0',
    NODE_ENV: 'development',
    LOG_PATH: path.join(process.cwd(), 'logs/'),
  };
}

export function getTestEnvironment(): Environment {
  return {
    JWT_SECRET: 'jwt-secret',
    NODE_ENV: 'test',
  };
}

export function getRequiredOptions(): Array<string> {
  return [
    'JWT_SECRET',
  ];
}

export class Config implements Configuration {
  private environment: Environment;

  // Required
  readonly JWT_SECRET: string;

  // Optional
  readonly PORT: number;
  readonly HOST: string;
  readonly NODE_ENV: string;
  readonly LOG_PATH: string;

  constructor(environment: Environment) {
    const defaultOptions = getDefaultOptions();

    this.environment = environment;

    // Required
    this.JWT_SECRET = this.env('JWT_SECRET');

    // Optional
    this.PORT = parseInt(this.env('PORT', defaultOptions.PORT));
    this.HOST = this.env('HOST', defaultOptions.HOST);
    this.NODE_ENV = this.env('NODE_ENV', defaultOptions.NODE_ENV);
    this.LOG_PATH = this.env('LOG_PATH', defaultOptions.LOG_PATH);
  }

  private env(key: string, orDefault?: (() => any) | any) {
    if (typeof orDefault === 'undefined') {
      if (key in this.environment) {
        return this.environment[key];
      }

      throw new Error(`Missing required environment variable: ${key}`);
    } else if (orDefault instanceof Function) {
      return this.environment[key] || orDefault();
    } else {
      return this.environment[key] || orDefault;
    }
  }
}

let config_: Config;

export function setConfig(config: Config) {
  config_ = config;
}

export function config() {
  if (!config_) {
    const env = process.env.NODE_ENV === 'test' ? getTestEnvironment() : process.env;

    config_ = new Config(env);
  }

  return config_;
}
