import { Config, getDefaultOptions } from './config';

describe('Config', () => {
  const DefaultOptions = getDefaultOptions();

  const RequiredOptions = {
    JWT_SECRET: 'hunter2',
  };

  test('uses default values', () => {
    const envWithDefaultValues = { ...RequiredOptions };
    const config = new Config(envWithDefaultValues);

    expect(config.NODE_ENV).toBe(DefaultOptions.NODE_ENV);
  });

  test('overrides defaults with environment variables', () => {
    const envWithCustomHost = { ...RequiredOptions, HOST: '127.0.0.1' };
    const config = new Config(envWithCustomHost);

    expect(config.HOST).not.toBe(DefaultOptions.HOST);
    expect(config.HOST).toBe('127.0.0.1');
  });

  test('throws when missing a required variable', () => {
    expect(() => {
      const envWithoutRequiredVariables = {};

      // eslint-disable-next-line no-unused-vars
      const config = new Config(envWithoutRequiredVariables);
    }).toThrow();
  });

  test('isDevelopment', () => {
    const developmentEnv = { NODE_ENV: 'development', ...RequiredOptions };
    const config = new Config(developmentEnv);

    expect(config.isDevelopment()).toBeTruthy();
  });

  test('isProduction', () => {
    const productionEnv = { NODE_ENV: 'production', ...RequiredOptions };
    const config = new Config(productionEnv);

    expect(config.isProduction()).toBeTruthy();
  });

  test('isTest', () => {
    const testEnv = { NODE_ENV: 'test', ...RequiredOptions };
    const config = new Config(testEnv);

    expect(config.isTest()).toBeTruthy();
  });
});
