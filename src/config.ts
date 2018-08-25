import process from 'process';

interface Options {
  readonly PORT: number;
  readonly HOST: string;
  readonly NODE_ENV: string;
}

interface Requirements {
  readonly COOKIE_SECRET: string;
  readonly WORK_DIR: string;
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
  };
}

export function getTestEnvironment(): Environment {
  return {
    COOKIE_SECRET: 'cookie-secret',
    NODE_ENV: 'test',
  };
}

export function getRequiredOptions(): Array<string> {
  return [
    'COOKIE_SECRET',
    'WORK_DIR',
  ];
}

export class Config implements Configuration {
  private environment: Environment;

  // Required
  readonly COOKIE_SECRET: string;
  readonly WORK_DIR: string;

  // Optional
  readonly PORT: number;
  readonly HOST: string;
  readonly NODE_ENV: string;

  constructor(environment: Environment) {
    const defaultOptions = getDefaultOptions();

    this.environment = environment;

    // Required
    this.COOKIE_SECRET = this.env('COOKIE_SECRET');
    this.WORK_DIR = this.env('WORK_DIR', process.cwd);

    // Optional
    this.PORT = parseInt(this.env('PORT', defaultOptions.PORT));
    this.HOST = this.env('HOST', defaultOptions.HOST);
    this.NODE_ENV = this.env('NODE_ENV', defaultOptions.NODE_ENV);
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

  isDevelopment() {
    return this.NODE_ENV === 'development';
  }

  isProduction() {
    return this.NODE_ENV === 'production';
  }

  isTest() {
    return this.NODE_ENV === 'test';
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
