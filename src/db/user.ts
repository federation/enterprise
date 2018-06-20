import * as db from './db';
import { Properties } from '../models/user';

export async function create(
  id: string,
  name: string,
  email: string,
  password: string,
  refreshToken: string
): Promise<void> {
  await db.query(
    'INSERT INTO enterprise.account (account_id, name, email, password, refresh_token) \
     VALUES ($1, $2, $3, $4, $5)',
    [id, name, email, password, refreshToken]
  );
}

export async function getByName(name: string): Promise<Properties> {
  const result = await db.query(
    'SELECT account_id AS id, name, email, password, refresh_token as "refreshToken" \
     FROM enterprise.account \
     WHERE name = $1',
    [name]
  );

  return db.expectRow(result, 'id', 'name', 'email', 'password', 'refreshToken');
}

// TODO: make refresh_token unique?
export async function getByRefreshToken(id: string, refreshToken: string): Promise<Properties> {
  const result = await db.query(
    'SELECT account_id AS id, name, email, password \
     FROM enterprise.account \
     WHERE account_id = $1 AND refresh_token = $2',
    [id, refreshToken]
  );

  return db.expectRow(result, 'id', 'name', 'email', 'password');
}

export async function updateRefreshToken(id: string, refreshToken: string): Promise<void> {
  await db.query(
    'UPDATE enterprise.account \
     SET refresh_token = $1 \
     WHERE account_id = $2',
    [refreshToken, id]
  );
}
