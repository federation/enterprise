import path from 'path';

export class Config {
  static instance: Config;

  private environment: any;

  // TODO
  // Use camelcase.
  readonly port: number;
  readonly host: string;
  readonly node_env: string;
  readonly log_path: string;
  readonly jwt_secret: string;

  constructor(environment: NodeJS.ProcessEnv) {
    this.environment = environment;

    this.port = parseInt(this.env('PORT', '8080'));
    this.host = this.env('HOST', '0.0.0.0');
    this.node_env = this.env('NODE_ENV', 'development');
    this.log_path = this.env('LOG_PATH', () => path.join(__dirname, '../logs'));

    this.jwt_secret = this.env('JWT_SECRET');

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
