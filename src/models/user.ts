import crypto from 'crypto';

import argon2 from 'argon2';
import uuidv4 from 'uuid/v4';

import * as query from '../db/user';
import { config } from '../config';

export interface Properties {
  id?: string;
  name?: string;
  email?: string;

  password?: string;
  createdAt?: Date;
}

interface Identifiable {
  id: string;
}

interface Nameable {
  name: string;
}

interface Authenticateable extends Nameable {
  password: string;
}

interface Createable extends Identifiable, Nameable {
  email: string;
}

export class User implements Properties {
  id?: string;
  name?: string;
  email?: string;

  // TODO: Preferably this password shouldn't be stored as a field, or it should
  // be cleared as soon as possible? Should this be cleared by User.authenticate()?
  password?: string;
  createdAt?: Date;

  constructor(user: Properties = {}) {
    this.id = user.id || uuidv4();

    this.name = user.name;
    this.email = user.email;
    this.password = user.password;
    this.createdAt = user.createdAt;
  }

  isIdentifiable(): this is Identifiable {
    return Boolean(this.id);
  }

  isNameable(): this is Nameable {
    return Boolean(this.name);
  }

  isCreateable(): this is Createable {
    return this.isIdentifiable() && this.isNameable() && Boolean(this.email);
  }

  isAuthenticateable(): this is Authenticateable {
    return this.isNameable() && Boolean(this.password);
  }

  static async hashPassword(plainPassword: string): Promise<string> {
    const argon2Hash = await argon2.hash(User.normalizePassword(plainPassword));

    return argon2Hash;
  }

  async create(plainPassword: string) {
    const argon2Hash = await User.hashPassword(plainPassword);

    if (!this.isCreateable()) {
      throw new Error('User is not Createable');
    }

    return query.create(this.id, this.name, this.email, argon2Hash);
  }

  async authenticate(plainPassword: string): Promise<boolean> {
    if (!this.isAuthenticateable()) {
      throw new Error('User is not Authenticateable');
    }

    const normalizedPassword = User.normalizePassword(plainPassword);

    // TODO: Get the password at authentication time, ephemerally, then discard
    // both the password and the plaintext?

    // TODO: delete this.password; on success?
    return argon2.verify(this.password, normalizedPassword);
  }

  static async getById(id: string): Promise<User> {
    const row = await query.getById(id);
    const user = new User(row);

    return user;
  }

  static async getByName(name: string): Promise<User> {
    const row = await query.getByName(name);
    const user = new User(row);

    return user;
  }

  static normalizePassword(plainPassword: string): string {
    const sha512Hash = crypto.createHash('sha512').update(plainPassword);
    const base64Hash = sha512Hash.digest('base64');

    return base64Hash;
  }
}
