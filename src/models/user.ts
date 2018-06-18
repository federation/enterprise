import crypto from 'crypto';

import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import uuidv4 from 'uuid/v4';

import * as db from '../db';
import { config } from '../config';
import { AuthenticationError, TokenVerificationError } from '../errors';
import { expectKeys } from '../common';

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

  constructor(id: string, name: string, email: string) {
    this.id = id;
    this.name = name;
    this.email = email;
  }

  static generateId(name: string, email: string): User {
    return new User(uuidv4(), name, email);
  }

  static async create(name: string, email: string, password: string): Promise<CreateUser> {
    const argon2Hash = await argon2.hash(User.normalizePassword(password));
    const createdUser = await CreateUser.query(name, email, argon2Hash);

    return createdUser;
  }

  static async authenticate(name: string, password: string): Promise<GetUserByName> {
    const user = await GetUserByName.query(name);
    const isAuthenticated = await argon2.verify(user.password, User.normalizePassword(password));

    if (isAuthenticated) {
      return user;
    }

    throw new AuthenticationError('Authentication failed');
  }

  static async getByRefreshToken(id: string, refreshToken: string): Promise<GetUserByRefreshToken> {
    const user = await GetUserByRefreshToken.query(id, refreshToken);

    return user;
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

      return new User(user.id, user.name, user.email);
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

      return new User(user.id, user.name, user.email);
    } catch (e) {
      throw new TokenVerificationError("Couldn't verify the JWT");
    }
  }

  async updateRefreshToken(refreshToken?: string): Promise<UpdateUserRefreshToken> {
    if (!refreshToken) {
      refreshToken = this.createRefreshToken();
    }

    const user = await UpdateUserRefreshToken.query(this.id, refreshToken);

    return user;
  }
}

export class CreateUser extends User {
  readonly refreshToken: string;

  constructor(result: any) {
    const row = result.rows[0];

    expectKeys(row, 'account_id', 'name', 'email', 'refresh_token');

    super(row.account_id, row.name, row.email);

    this.refreshToken = row.refresh_token;
  }

  static async query(name: string, email: string, password: string): Promise<CreateUser> {
    const user = User.generateId(name, email);
    const refreshToken = user.createRefreshToken();

    const result = await db.connection().query(
      'INSERT INTO enterprise.account (account_id, name, email, password, refresh_token) \
       VALUES ($1, $2, $3, $4, $5) \
       RETURNING account_id, name, email, refresh_token',
      [user.id, user.name, user.email, password, refreshToken]
    );

    return new CreateUser(result);
  }
}

export class GetUserByName extends User {
  readonly password: string;

  private constructor(user: GetUserByName) {
    super(user.id, user.name, user.email);

    this.password = user.password;
  }

  static async query(name: string): Promise<GetUserByName> {
    const result = await db.connection().query(
      'SELECT account_id AS id, name, email, password \
       FROM enterprise.users \
       WHERE name = $1 \
       LIMIT 1',
      [name]
    );

    const row: GetUserByName = result.rows[0];

    expectKeys(row, 'id', 'name', 'email', 'password');

    return new GetUserByName(row);
  }
}

export class GetUserByRefreshToken extends User {
  readonly password: string;

  private constructor(user: GetUserByName) {
    super(user.id, user.name, user.email);

    this.password = user.password;
  }

  static async query(id: string, refreshToken: string): Promise<GetUserByRefreshToken> {
    const result = await db.connection().query(
      'SELECT account_id AS id, name, email, password \
       FROM enterprise.users \
       WHERE account_id = $1 AND refresh_token = $2 \
       LIMIT 1',
      [id, refreshToken]
    );

    const row: GetUserByRefreshToken = result.rows[0];

    // TODO: Test that this is actually working, and not getting set to null.
    expectKeys(row, 'id', 'name', 'email', 'password');

    return new GetUserByRefreshToken(row);
  }
}

export class UpdateUserRefreshToken extends User {
  readonly refreshToken: string

  private constructor(user: UpdateUserRefreshToken) {
    super(user.id, user.name, user.email);

    this.refreshToken = user.refreshToken;
  }

  static async query(id: string, refreshToken: string): Promise<UpdateUserRefreshToken> {
    const result = await db.connection().query(
      'UPDATE enterprise.users \
       SET refresh_token = $1 \
       WHERE account_id = $2 \
       RETURNING account_id AS id, name, email, refresh_token AS refreshToken',
      [refreshToken, id]
    );

    const row: UpdateUserRefreshToken = result.rows[0];

    return new UpdateUserRefreshToken(row);
  }
}
