import crypto from 'crypto';

import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import uuidv4 from 'uuid/v4';

import * as query from '../db/user';
import { config } from '../config';
import { AuthenticationError, TokenVerificationError } from '../errors';

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

export interface Properties {
  id?: string;
  name?: string;
  email?: string;

  refreshToken?: string;
  password?: string;
  createdAt?: Date;
}

interface Identifiable {
  id: string;
}

interface Authenticateable {
  name: string;
  password: string;
}

interface Contactable extends Identifiable {
  name: string;
  email: string;
}

interface Createable extends Contactable {
  refreshToken: string;
}

export class User implements Properties {
  id?: string;
  name?: string;
  email?: string;

  refreshToken?: string;
  password?: string;
  createdAt?: Date;

  constructor(user: Properties) {
    this.id = user.id || uuidv4();

    this.name = user.name;
    this.email = user.email;
    this.refreshToken = user.refreshToken;
    this.password = user.password;
    this.createdAt = user.createdAt;
  }

  isIdentifiable(): this is Identifiable {
    return Boolean(this.id);
  }

  isContactable(): this is Contactable {
    return this.isIdentifiable() && Boolean(this.name) && Boolean(this.email);
  }

  isCreateable(): this is Createable {
    return this.isContactable() && Boolean(this.refreshToken);
  }

  isAuthenticateable(): this is Authenticateable {
    return Boolean(this.password) && Boolean(this.name);
  }

  async create(plainPassword: string) {
    const argon2Hash = await argon2.hash(User.normalizePassword(plainPassword));

    this.refreshToken = this.createRefreshToken();

    if (!this.isCreateable()) {
      throw new Error('User is not createable!');
    }

    return query.create(this.id, this.name, this.email, argon2Hash, this.refreshToken);
  }

  async authenticate(plainPassword: string): Promise<boolean> {
    if (!this.isAuthenticateable()) {
      throw new Error('User cannot be authenticated.');
    }

    const normalizedPassword = User.normalizePassword(plainPassword);

    // TODO: delete this.password; on success?
    return argon2.verify(this.password, normalizedPassword);
  }

  static async getByName(name: string): Promise<User> {
    const row = await query.getByName(name);
    const user = new User(row);

    return user;
  }

  static async getByRefreshToken(id: string, refreshToken: string): Promise<User> {
    const row = await query.getByRefreshToken(id, refreshToken);
    const user = new User(row);

    return user;
  }

  static normalizePassword(plainPassword: string): string {
    const sha512Hash = crypto.createHash('sha512').update(plainPassword);
    const base64Hash = sha512Hash.digest('base64');

    return base64Hash;
  }

  createAccessToken(): string {
    if (!this.isContactable()) {
      throw new Error("Couldn't create access token");
    }

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
  static fromAccessToken(token: string): User {
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
    if (!this.isContactable()) {
      throw new Error("Couldn't create refresh token");
    }

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

  static fromRefreshToken(token: string): User {
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

  updateRefreshToken() {
    if (!this.isIdentifiable()) {
      throw new Error('User is not identifiable!');
    }

    return query.updateRefreshToken(this.id, this.refreshToken!);
  }
}
