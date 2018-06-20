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

export const DefaultOptions: Options = {
  PORT: 8080,
  HOST: '0.0.0.0',
  NODE_ENV: 'development',
  LOG_PATH: path.join(__dirname, '../logs'),
};

const TestOptions: Options & Requirements = {
  JWT_SECRET: 'jwt-secret',
  NODE_ENV: 'test',
  ...DefaultOptions,
};

export const RequiredOptions = [
  'JWT_SECRET',
];

export class Config implements Options, Requirements {
  private environment: any;

  // Required
  readonly JWT_SECRET: string;

  // Optional
  readonly PORT: number;
  readonly HOST: string;
  readonly NODE_ENV: string;
  readonly LOG_PATH: string;

  constructor(environment: NodeJS.ProcessEnv) {
    this.environment = environment;

    // Required
    this.JWT_SECRET = this.env('JWT_SECRET');

    // Optional
    this.PORT = parseInt(this.env('PORT', DefaultOptions.PORT));
    this.HOST = this.env('HOST', DefaultOptions.HOST);
    this.NODE_ENV = this.env('NODE_ENV', DefaultOptions.NODE_ENV);
    this.LOG_PATH = this.env('LOG_PATH', DefaultOptions.LOG_PATH);
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
    const env = process.env.NODE_ENV === 'test' ? TestOptions : process.env;

    config_ = new Config(env as NodeJS.ProcessEnv);
  }

  return config_;
}
