import { Pool } from 'pg';

import { logger } from './logger';

const pool = new Pool();

pool.on('error', (err, client) => {
  logger.error('Unexpected error on idle client', err);

  process.exit(-1);
});

export function connection() {
  return pool;
}

// TODO
// Instead of passing these parameters loosely, use an interface or the User type?
export async function createUser(name: string, email: string, password: string): Promise<any> {
  const query = 'INSERT INTO enterprise.users (name, email, password) VALUES ($1, $2, $3) RETURNING uuid, name, email';
  const parameters = [name, email, password];

  const result = await connection().query(query, parameters);

  return result.rows[0];
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
