import crypto from 'crypto';

import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import uuidv4 from 'uuid/v4';

import * as db from '../db';
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
    if (!this.id) {
      throw new Error('User is not identifiable.');
    }

    return true;
  }

  isContactable(): this is Contactable {
    if (!this.isIdentifiable()) {
      return false;
    }

    const errorMessage = 'User cannot be contacted. Missing ';

    if (!this.name) {
      throw new Error(errorMessage + 'name.');
    }

    if (!this.email) {
      throw new Error(errorMessage + 'email.');
    }

    return true;
  }

  isCreateable(): this is Createable {
    if (!this.isContactable()) {
      return false;
    }

    const errorMessage = 'User cannot be created. Missing ';

    if (!this.refreshToken) {
      throw new Error(errorMessage + 'refreshToken.');
    }

    return true;
  }

  isAuthenticateable(): this is Authenticateable {
    if (!this.password) {
      throw new Error('User cannot be authenticated. Missing password.');
    }

    if (!this.name) {
      throw new Error('User cannot be authenticated. Missing name.');
    }

    return true;
  }

  async create(plainPassword: string) {
    const argon2Hash = await argon2.hash(User.normalizePassword(plainPassword));

    this.refreshToken = this.createRefreshToken();

    if (this.isCreateable()) {
      await db.user.create(this.id, this.name, this.email, argon2Hash, this.refreshToken);
    }
  }

  isAuthenticated(plainPassword: string): Promise<boolean> {
    if (!this.isAuthenticateable()) {
      throw new Error('User cannot be authenticated.');
    }

    return argon2.verify(this.password, User.normalizePassword(plainPassword));
  }

  // TODO: Make this an instance method?
  // const user = new User({ name, password });
  // const isAuthenticated = await user.authenticate();
  //
  // if (isAuthenticated) { … }
  static async authenticate(name: string, password: string): Promise<User> {
    const row = await db.user.getByName(name);
    const user = new User(row);

    const isAuthenticated = await user.isAuthenticated(password);

    if (isAuthenticated) {
      return user;
    }

    throw new AuthenticationError('Authentication failed');
  }

  static async getByRefreshToken(id: string, refreshToken: string): Promise<User> {
    const row = await db.user.getByRefreshToken(id, refreshToken);
    const user = new User(row);

    return user;
  }

  static normalizePassword(password: string): string {
    const sha512Hash = crypto.createHash('sha512').update(password);
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
    if (!this.isContactable()) {
      throw new Error("Couldn't create access token");
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

  updateRefreshToken(refreshToken?: string) {
    this.refreshToken = refreshToken || this.refreshToken || this.createRefreshToken();

    if (this.isIdentifiable()) {
      return db.user.updateRefreshToken(this.id, this.refreshToken!);
    }
  }
}
