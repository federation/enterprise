import crypto from 'crypto';

import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import uuidv4 from 'uuid/v4';

import * as db from '../db';
import { config } from '../config';
import { AuthenticationError, TokenVerificationError } from '../errors';
import { rowToProperties } from '../common';

interface TokenPayload {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly tokenType: 'access' | 'refresh';
}

interface AccessTokenPayload extends TokenPayload {
  readonly tokenType: 'access';
}

interface RefreshTokenPayload extends TokenPayload {
  readonly tokenType: 'refresh';
}

export class User {
  readonly id: string;
  readonly name: string;
  readonly email: string;

  refreshToken?: string;
  password?: string;
  createdAt?: Date;

  constructor(user: Partial<User> & Required<{ name: string, email: string }>) {
    this.id = user.id || uuidv4();

    this.name = user.name;
    this.email = user.email;

    this.refreshToken = user.refreshToken;
    this.password = user.password;
    this.createdAt = user.createdAt;
  }

  static fromRow<K extends keyof User>(row: any, ...keys: K[]): User {
    const mappedRow = rowToProperties<User, K>(row, ...keys);

    return new User(mappedRow);
  }

  async create(password: string): Promise<this> {
    const argon2Hash = await argon2.hash(User.normalizePassword(password));

    this.refreshToken = this.createRefreshToken();

    await db.connection().query(
      'INSERT INTO enterprise.account (account_id, name, email, password, refresh_token) \
       VALUES ($1, $2, $3, $4, $5)',
      [this.id, this.name, this.email, argon2Hash, this.refreshToken]
    );

    return this;
  }

  static async authenticate(name: string, password: string): Promise<User> {
    const result = await db.connection().query(
      'SELECT account_id AS id, name, email, password, refresh_token as "refreshToken" \
       FROM enterprise.account \
       WHERE name = $1',
      [name]
    );

    if (result.rowCount > 1) {
      throw new Error('More than one user with the same account_id and refresh_token exists!');
    }

    const user = User.fromRow(result.rows[0], 'id', 'name', 'email', 'password', 'refreshToken');

    // NOTE: The type assertion operator is used because we guarantee that
    // password exists above.
    const isAuthenticated = await argon2.verify(user.password!, User.normalizePassword(password));

    if (isAuthenticated) {
      return user;
    }

    throw new AuthenticationError('Authentication failed');
  }

  static async getByRefreshToken(id: string, refreshToken: string): Promise<User> {
    const result = await db.connection().query(
      'SELECT account_id AS id, name, email, password \
       FROM enterprise.account \
       WHERE account_id = $1 AND refresh_token = $2',
      [id, refreshToken]
    );

    if (result.rowCount > 1) {
      throw new Error('More than one user with the same account_id and refresh_token exists!');
    }

    return User.fromRow(result.rows[0], 'id', 'name', 'email', 'password');
  }

  static normalizePassword(password: string): string {
    const sha512Hash = crypto.createHash('sha512').update(password);
    const base64Hash = sha512Hash.digest('base64');

    return base64Hash;
  }

  createAccessToken(): string {
    const payload: AccessTokenPayload = {
      id: this.id,
      name: this.name,
      email: this.email,
      tokenType: 'access',
    };

    const MILLISECONDS_IN_MINUTE = 60000;

    const metadata = {
      expiresIn: MILLISECONDS_IN_MINUTE,
    };

    return jwt.sign(payload, config().JWT_SECRET, metadata);
  }

  // TODO: https://github.com/auth0/node-jsonwebtoken#errors--codes
  static verifyAccessToken(token: string): User {
    try {
      const user = jwt.verify(token, config().JWT_SECRET) as AccessTokenPayload;

      if (user.tokenType !== 'access') {
        throw new TokenVerificationError('Not an access token');
      }

      return new User(user);
    } catch (e) {
      throw new TokenVerificationError("Couldn't verify the JWT");
    }
  }

  createRefreshToken() {
    const payload: RefreshTokenPayload = {
      id: this.id,
      name: this.name,
      email: this.email,
      tokenType: 'refresh',
    };

    const MILLISECONDS_IN_30_DAYS = 2592000000;

    const metadata = {
      expiresIn: MILLISECONDS_IN_30_DAYS,
    };

    return jwt.sign(payload, config().JWT_SECRET, metadata);
  }

  static verifyRefreshToken(token: string): User {
    try {
      const user = jwt.verify(token, config().JWT_SECRET) as RefreshTokenPayload;

      if (user.tokenType !== 'refresh') {
        throw new TokenVerificationError('Not a refresh token');
      }

      return new User(user);
    } catch (e) {
      throw new TokenVerificationError("Couldn't verify the JWT");
    }
  }

  async updateRefreshToken(refreshToken?: string) {
    this.refreshToken = refreshToken || this.refreshToken || this.createRefreshToken();

    await db.connection().query(
      'UPDATE enterprise.account \
       SET refresh_token = $1 \
       WHERE account_id = $2',
      [this.refreshToken, this.id]
    );
  }
}
