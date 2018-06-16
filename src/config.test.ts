import { Config, DefaultOptions } from './config';

describe('Config', () => {
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
      const envWithoutRequiredVariables: NodeJS.ProcessEnv = {};

      // eslint-disable-next-line no-unused-vars
      const config = new Config(envWithoutRequiredVariables);
    }).toThrow();
  });
});
