import pg from 'pg';

import { logger } from './logger';
import { expectKeys } from './common';
import { Properties as UserProperties } from './models/user';

let pool_: pg.Pool;

export function connection(): pg.Pool {
  if (!pool_) {
    pool_ = new pg.Pool();

    pool_.on('acquire', (_client) => {
      logger().info('Acquired client from the PostgreSQL connection pool.');
    });

    pool_.on('remove', (_client) => {
      logger().info('Removed client from the PostgreSQL connection pool.');
    });

    pool_.on('error', (err, _client) => {
      logger().error('Unexpected error on idle PostgreSQL client.', err);

      process.exit(-1);
    });
  }

  return pool_;
}

export async function query(text: string, params?: any[]): Promise<pg.QueryResult> {
  const result = await connection().query(text, params);

  logger().info('PostgreSQL Query', {
    query: text,
    params,
    rowCount: result.rowCount,
    rows: result.rows,
  });

  return result;
}

export function expectRow<T, K extends keyof T>(result: pg.QueryResult, ...keys: Array<K>): T {
  if (result.rowCount !== 1) {
    throw new Error('Expected single row result!');
  }

  return expectKeys(result.rows[0], ...keys);
}

export function expectRows<T, K extends keyof T>(result: pg.QueryResult, ...keys: Array<K>): T[] {
  return result.rows.map((row): T => expectKeys(row, ...keys));
}

export const user = {
  async create(
    id: string,
    name: string,
    email: string,
    password: string,
    refreshToken: string
  ): Promise<void> {
    await query(
      'INSERT INTO enterprise.account (account_id, name, email, password, refresh_token) \
       VALUES ($1, $2, $3, $4, $5)',
      [id, name, email, password, refreshToken]
    );
  },

  async getByName(name: string): Promise<UserProperties> {
    const result = await query(
      'SELECT account_id AS id, name, email, password, refresh_token as "refreshToken" \
       FROM enterprise.account \
       WHERE name = $1',
      [name]
    );

    return expectRow(result, 'id', 'name', 'email', 'password', 'refreshToken');
  },

  // TODO: make refresh_token unique?
  async getByRefreshToken(id: string, refreshToken: string): Promise<UserProperties> {
    const result = await query(
      'SELECT account_id AS id, name, email, password \
       FROM enterprise.account \
       WHERE account_id = $1 AND refresh_token = $2',
      [id, refreshToken]
    );

    return expectRow(result, 'id', 'name', 'email', 'password');
  },

  async updateRefreshToken(id: string, refreshToken: string): Promise<void> {
    await query(
      'UPDATE enterprise.account \
       SET refresh_token = $1 \
       WHERE account_id = $2',
      [refreshToken, id]
    );
  },
};
