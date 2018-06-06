import path from 'path';

export class Config {
  static instance: Config;

  private environment: any;

  readonly PORT: number;
  readonly HOST: string;
  readonly NODE_ENV: string;
  readonly LOG_PATH: string;
  readonly JWT_SECRET: string;

  constructor(environment: NodeJS.ProcessEnv) {
    this.environment = environment;

    // Required
    this.JWT_SECRET = this.env('JWT_SECRET');

    // Optional
    this.PORT = parseInt(this.env('PORT', '8080'));
    this.HOST = this.env('HOST', '0.0.0.0');
    this.NODE_ENV = this.env('NODE_ENV', 'development');
    this.LOG_PATH = this.env('LOG_PATH', () => path.join(__dirname, '../logs'));

    Config.instance = this;
  }

  private env(key: string, orDefault?: (() => string) | string) {
    if (typeof orDefault === 'string') {
      return this.environment[key] || orDefault;
    } else if (orDefault instanceof Function) {
      return this.environment[key] || orDefault();
    } else {
      if (key in this.environment) {
        return this.environment[key];
      } else {
        throw new Error(`Missing required environment variable: ${key}`);
      }
    }
  }
}

const config = new Config(process.env);

export default config;
