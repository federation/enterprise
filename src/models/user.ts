import crypto from 'crypto';

import argon2 from 'argon2';
import jwt from 'jsonwebtoken';

import * as db from '../db';
import { config } from '../config';

export class AuthenticationError extends Error {
  constructor(m: string) {
    super(m);

    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

export class TokenVerificationError extends Error {
  constructor(m: string) {
    super(m);

    Object.setPrototypeOf(this, TokenVerificationError.prototype);
  }
}

export class User {
  constructor(readonly uuid: string, readonly name: string, readonly email: string) {}

  createAccessToken(): string {
    const payload = {
      uuid: this.uuid,
      name: this.name,
      email: this.email,
    };

    const metadata = {
      expiresIn: '1 minute',
    };

    return jwt.sign(payload, config().JWT_SECRET, metadata);
  }

  async createRefreshToken() {
    const payload = {
      uuid: this.uuid,
      name: this.name,
      email: this.email,
    };

    const metadata = {
      expiresIn: '1 month',
    };

    const token = jwt.sign(payload, config().JWT_SECRET, metadata);

    await db.updateUserRefreshToken(this.uuid, token);

    return token;
  }

  static async getByRefreshToken(refreshToken: string): Promise<User> {
    const user = await db.getUserByRefreshToken(refreshToken);

    return new User(user.uuid, user.name, user.email);
  }

  // TODO
  // https://github.com/auth0/node-jsonwebtoken#errors--codes
  static verify(token: string) {
    try {
      const user: any = jwt.verify(token, config().JWT_SECRET);

      return new User(user.uuid, user.name, user.email);
    } catch (e) {
      throw new TokenVerificationError("Couldn't verify the JWT");
    }
  }

  static normalizePassword(password: string): string {
    const sha512Hash = crypto.createHash('sha512').update(password);
    const base64Hash = sha512Hash.digest('base64')

    return base64Hash;
  }

  static async create(name: string, email: string, password: string): Promise<User> {
    const argon2Hash = await argon2.hash(User.normalizePassword(password));
    const user = await db.createUser(name, email, argon2Hash);

    return new User(user.uuid, user.name, user.email);
  }

  static async authenticate(email: string, password: string): Promise<User> {
    const user = await db.getUserByEmail(email);
    const isAuthenticated = await argon2.verify(User.normalizePassword(password), user.password);

    if (isAuthenticated) {
      return new User(user.uuid, user.name, user.email);
    }

    throw new AuthenticationError("Authentication failed");
  }
}
