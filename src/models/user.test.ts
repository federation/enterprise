jest.mock('argon2');
import argon2 from 'argon2';

jest.mock('../db/user');
import * as query from '../db/user';

import { User } from './user';

describe('User', () => {
  describe('constructor', () => {
    test('generates an id when none is given', () => {
      const user = new User({ name: 'bob' });

      expect(user.id).toBeDefined();
      expect(user.name).toBe('bob');
    });
  });

  describe('type guards', () => {
    test('can be considered Identifiable', () => {
      const identifiable = new User({});
      const unidentifiable = new User({});

      delete unidentifiable.id;

      expect(identifiable.isIdentifiable()).toBeTruthy();
      expect(unidentifiable.isIdentifiable()).toBeFalsy();
    });

    test('can be considered Contactable', () => {
      const contactable = new User({ name: 'bob', email: 'bob@loblaw.com' });
      const notContactable = new User({});

      expect(contactable.isContactable()).toBeTruthy();
      expect(notContactable.isContactable()).toBeFalsy();
    });

    test('can be considered Createable', () => {
      const createable = new User({ name: 'bob', email: 'bob@loblaw.com', refreshToken: 'refresh' });
      const notCreateable = new User({});

      expect(createable.isCreateable()).toBeTruthy();
      expect(notCreateable.isCreateable()).toBeFalsy();
    });

    test('can be considered Authenticateable', () => {
      const authenticateable = new User({ name: 'bob', password: 'hunter2' });
      const notAuthenticateable = new User({});

      expect(authenticateable.isAuthenticateable()).toBeTruthy();
      expect(notAuthenticateable.isAuthenticateable()).toBeFalsy();
    });
  });

  describe('create', () => {
    argon2.hash.mockResolvedValue('hashed');
    query.create.mockResolvedValue(undefined);

    afterEach(() => {
      argon2.hash.mockReset();
      query.create.mockReset();
    });

    test('creates Createable users', async () => {
      const user = new User({ name: 'bob', email: 'bob@loblaw.com', refreshToken: 'refresh' });

      await user.create('hunter2');

      expect(query.create).toHaveBeenCalledWith(user.id, user.name, user.email, 'hashed', user.refreshToken);
    });

    test("rejects users which can't create a refresh token", async () => {
      const user = new User({ name: 'bob' });

      expect(user.isCreateable()).toBeFalsy();

      await expect(user.create('hunter2')).rejects.toThrow();
    });
  });

  describe('authenticate', () => {
    argon2.verify.mockImplementation((hashed, normalized) => hashed === normalized);

    afterEach(() => {
      argon2.verify.mockReset();
    });

    test('authenticates Authenticateable users with valid credentials', async () => {
      const user = new User({ name: 'bob', password: User.normalizePassword('hunter2') });

      expect(user.isAuthenticateable()).toBeTruthy();
      await expect(user.authenticate('hunter2')).resolves.toBeTruthy();
    });

    test('rejects Authenticateable users with invalid credentials', async () => {
      const user = new User({ name: 'bob', password: User.normalizePassword('hunter2') });

      expect(user.isAuthenticateable()).toBeTruthy();
      await expect(user.authenticate('badpass')).resolves.toBeFalsy();
    });

    test('rejects non-Authenticateable users', async () => {
      const user = new User({});

      expect(user.isAuthenticateable()).toBeFalsy();
      await expect(user.authenticate('hunter2')).rejects.toThrow();
    });
  });
});
