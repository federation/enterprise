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
