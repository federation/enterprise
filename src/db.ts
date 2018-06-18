import pg from 'pg';

import { logger } from './logger';

let pool_: pg.Pool;

export function connection() {
  if (!pool_) {
    pool_ = new pg.Pool();

    pool_.on('acquire', (_client) => {
      logger.info('Acquired client from the PostgreSQL connection pool.');
    });

    pool_.on('remove', (_client) => {
      logger.info('Removed client from the PostgreSQL connection pool.');
    });

    pool_.on('error', (err, _client) => {
      logger.error('Unexpected error on idle PostgreSQL client.', err);

      process.exit(-1);
    });
  }

  return pool_;
}

export function createUser(
  id: string,
  name: string,
  email: string,
  password: string,
  refreshToken: string
): Promise<pg.QueryResult> {
  return connection().query(
    'INSERT INTO enterprise.account (account_id, name, email, password, refresh_token) \
     VALUES ($1, $2, $3, $4, $5)',
    [id, name, email, password, refreshToken]
  );
}

export function getUserByName(name: string): Promise<pg.QueryResult> {
  return connection().query(
    'SELECT account_id AS id, name, email, password, refresh_token as "refreshToken" \
     FROM enterprise.account \
     WHERE name = $1',
    [name]
  );
}

// TODO: make refresh_token unique?
export function getUserByRefreshToken(id: string, refreshToken: string): Promise<pg.QueryResult> {
    return connection().query(
      'SELECT account_id AS id, name, email, password \
       FROM enterprise.account \
       WHERE account_id = $1 AND refresh_token = $2',
      [id, refreshToken]
    );
}

export function updateRefreshToken(id: string, refreshToken: string): Promise<pg.QueryResult> {
  return connection().query(
    'UPDATE enterprise.account \
     SET refresh_token = $1 \
     WHERE account_id = $2',
    [refreshToken, id]
  );
}
