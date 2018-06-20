import pg from 'pg';

import { logger } from '../logger';
import { expectKeys } from '../common';

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
