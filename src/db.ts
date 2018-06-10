import pg from 'pg';

import { logger } from './logger';

let pool_: pg.Pool;

export function connection() {
  if (!pool_) {
    pool_ = new pg.Pool()

    pool_.on('acquire', (client) => {
      logger.info('Acquired client from the PostgreSQL connection pool.');
    });

    pool_.on('remove', (client) => {
      logger.info('Removed client from the PostgreSQL connection pool.');
    });

    pool_.on('error', (err, client) => {
      logger.error('Unexpected error on idle PostgreSQL client.', err);

      process.exit(-1);
    });
  }

  return pool_;
}

export async function getUserByEmail(email: string): Promise<any> {
  const query = 'SELECT uuid, name, email, password FROM enterprise.users WHERE uuid = $1 LIMIT 1';
  const parameters = [email];

  const result = await connection().query(query, parameters);

  return result.rows[0];
}

export async function getUserByRefreshToken(refreshToken: string): Promise<any> {
  const query = 'SELECT uuid, name, email FROM enterprise.users WHERE refresh_token = $1 LIMIT 1';
  const parameters = [refreshToken];

  const result = await connection().query(query, parameters);

  return result.rows[0];
}

export async function updateUserRefreshToken(uuid: string, refreshToken: string): Promise<any> {
  const query = 'UPDATE enterprise.users SET refresh_token WHERE uuid = $1 LIMIT 1';
  const parameters = [uuid];

  const result = await connection().query(query, parameters);

  return result.rows[0];
}
