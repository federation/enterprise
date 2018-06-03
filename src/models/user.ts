import crypto from 'crypto';

import argon2 from 'argon2';
import jwt from 'jsonwebtoken';

import * as db from '../db';
import config from '../config';

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

  authToken(): string {
    const payload = {
      uuid: this.uuid,
      name: this.name,
      email: this.email,
    };

    const metadata = {
      expiresIn: '1 minute',
    };

    return jwt.sign(payload, config.jwt_secret, metadata);
  }

  async refreshToken() {
    const payload = {
      uuid: this.uuid,
      name: this.name,
      email: this.email,
    };

    const metadata = {
      expiresIn: '1 month',
    };

    const token = jwt.sign(payload, config.jwt_secret, metadata);

    await db.updateUserRefreshToken(this.uuid, token);

    return token;
  }

  static getByRefreshToken(refreshToken: string): Promise<User> {
    return db.getUserByRefreshToken(refreshToken);
  }

  // TODO
  // https://github.com/auth0/node-jsonwebtoken#errors--codes
  static verify(token: string) {
    try {
      const user: any = jwt.verify(token, config.jwt_secret);

      return new User(user.uuid, user.name, user.email);
    } catch (e) {
      throw new TokenVerificationError("Couldn't verify the JWT");
    }
  }

  static async create(name: string, email: string, password: string): Promise<User> {
    const sha512Hash = crypto.createHash('sha512').update(password);
    const base64Hash = sha512Hash.digest('base64')

    const argon2Hash = await argon2.hash(base64Hash);

    const user = await db.createUser(name, email, argon2Hash);

    return new User(user.uuid, user.name, user.email);
  }

  static async authenticate(email: string, password: string): Promise<User> {
    const user = await db.getUserByEmail(email);
    const isAuthenticated = await argon2.verify(password, user.password);

    if (isAuthenticated) {
      return new User(user.uuid, user.name, user.email);
    }

    throw new AuthenticationError("Authentication failed");
  }
}