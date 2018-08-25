import * as db from './db';
import { Properties } from '../models/user';

export async function create(
  id: string,
  name: string,
  email: string,
  password: string,
): Promise<void> {
  await db.query(
    'INSERT INTO enterprise.account (account_id, name, email, password) \
     VALUES ($1, $2, $3, $4, $5)',
    [id, name, email, password]
  );
}

export async function getById(id: string): Promise<Properties> {
  const result = await db.query(
    'SELECT account_id AS id, \
            name, email, password, \
            to_iso8601(created_at) as "createdAt" \
     FROM enterprise.account \
     WHERE account_id = $1',
    [id]
  );

  return db.expectRow(result, 'id', 'name', 'email', 'password', 'createdAt');
}

export async function getByName(name: string): Promise<Properties> {
  const result = await db.query(
    'SELECT account_id AS id, \
            name, email, password, \
            to_iso8601(created_at) as "createdAt" \
     FROM enterprise.account \
     WHERE name = $1',
    [name]
  );

  return db.expectRow(result, 'id', 'name', 'email', 'password', 'createdAt');
}
