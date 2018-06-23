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
    test('can be Identifiable', () => {
      const identifiable = new User();
      const unidentifiable = new User();

      delete unidentifiable.id;

      expect(identifiable.isIdentifiable()).toBeTruthy();
      expect(unidentifiable.isIdentifiable()).toBeFalsy();
    });

    test('can be Nameable', () => {
      const nameable = new User({ name: 'bob' });
      const unnameable = new User();

      expect(nameable.isNameable()).toBeTruthy();
      expect(unnameable.isNameable()).toBeFalsy();
    });

    test('can be Contactable', () => {
      const contactable = new User({ name: 'bob', email: 'bob@loblaw.com' });
      const notContactable = new User();

      expect(contactable.isContactable()).toBeTruthy();
      expect(notContactable.isContactable()).toBeFalsy();
    });

    test('can be Createable', () => {
      const createable = new User({ name: 'bob', email: 'bob@loblaw.com', refreshToken: 'refresh' });
      const notCreateable = new User();

      expect(createable.isCreateable()).toBeTruthy();
      expect(notCreateable.isCreateable()).toBeFalsy();
    });

    test('can be Authenticateable', () => {
      const authenticateable = new User({ name: 'bob', password: 'hunter2' });
      const notAuthenticateable = new User();

      expect(authenticateable.isAuthenticateable()).toBeTruthy();
      expect(notAuthenticateable.isAuthenticateable()).toBeFalsy();
    });
  });

  describe('create', () => {
    const password = '$argon2i$v=19$m=4096,t=3,p=1$K2B2ETSDq7GtE9QQEya+Pg$rTRVmHh/3/kEYhBSyJe76MWOje4gtiDgC3Mlz+c9HGU';
    const spy = jest.spyOn(argon2, 'hash').mockResolvedValue(password);

    afterEach(() => {
      spy.mockReset();
    });

    test('creates Createable user', async () => {
      const user = new User({ name: 'bob', email: 'bob@loblaw.com' });

      await user.create('hunter2');
      expect(query.create).toHaveBeenCalledWith(user.id, user.name, user.email, password, user.refreshToken);
    });

    test('creates a refresh token', async () => {
      const user = new User({ name: 'bob', email: 'bob@loblaw.com' });

      expect(user.refreshToken).not.toBeDefined();

      await user.create('hunter2');
      expect(user.refreshToken).toBeDefined();
    });

    test("rejects user for which it can't create a refresh token", async () => {
      const user = new User({ name: 'bob' });

      expect(user.isCreateable()).toBeFalsy();
      await expect(user.create('hunter2')).rejects.toThrow();
    });
  });

  describe('authenticate', () => {
    const password = '$argon2i$v=19$m=4096,t=3,p=1$K2B2ETSDq7GtE9QQEya+Pg$rTRVmHh/3/kEYhBSyJe76MWOje4gtiDgC3Mlz+c9HGU';

    // TODO: I'm not sure if it's correct to be testing the actual
    // argon2.verify() operation here.
    test('authenticates Authenticateable user with valid credentials', async () => {
      const user = new User({ name: 'bob', password });

      expect(user.isAuthenticateable()).toBeTruthy();
      await expect(user.authenticate('hunter2')).resolves.toBeTruthy();
    });

    test('rejects Authenticateable user with invalid credentials', async () => {
      const user = new User({ name: 'bob', password });

      expect(user.isAuthenticateable()).toBeTruthy();
      await expect(user.authenticate('badpass')).resolves.toBeFalsy();
    });

    test('rejects non-Authenticateable user', async () => {
      const user = new User();

      expect(user.isAuthenticateable()).toBeFalsy();
      await expect(user.authenticate('hunter2')).rejects.toThrow();
    });
  });

  describe('tokens', () => {
    describe('access', () => {
      test('rejects creating non-Contactable user', () => {
        const user = new User();

        expect(user.isContactable()).toBeFalsy();
        expect(() => user.createAccessToken()).toThrow();
      });

      test('deserializes to User', () => {
        const user = new User({ id: '123', name: 'bob', email: 'bob@loblaw.com' });
        const accessToken = user.createAccessToken();
        const deserialized = User.fromAccessToken(accessToken);

        expect(deserialized).toEqual(user);
      });

      test('rejects non-access token', () => {
        const user = new User({ id: '123', name: 'bob', email: 'bob@loblaw.com' });
        const refreshToken = user.createRefreshToken();

        expect(() => User.fromAccessToken(refreshToken)).toThrow(/Not an access token/);
      });

      test('rejects expired token', () => {
        const user = new User({ id: '123', name: 'bob', email: 'bob@loblaw.com' });
        const accessToken = user.createAccessToken();

        const NOW = Date.now();
        const MILLISECONDS_IN_MINUTE = 60000;
        const PAST_EXPIRATION = NOW + MILLISECONDS_IN_MINUTE;

        const spy = jest.spyOn(Date, 'now').mockReturnValue(PAST_EXPIRATION);

        expect(() => User.fromAccessToken(accessToken)).toThrow(/expired/);
        expect(spy).toHaveBeenCalled();

        spy.mockRestore();
      });
    });

    describe('refresh', () => {
      test('rejects creating for non-Contactable user', () => {
        const user = new User();

        expect(user.isContactable()).toBeFalsy();
        expect(() => user.createRefreshToken()).toThrow();
      });

      test('rejects updating for non-Identifiable user', async () => {
        const user = new User();

        expect(user.isRefreshable()).toBeFalsy();

        await expect(user.updateRefreshToken()).rejects.toThrow();
      });

      test('deserializes to User', () => {
        const user = new User({ id: '123', name: 'bob', email: 'bob@loblaw.com' });
        const refreshToken = user.createRefreshToken();
        const deserialized = User.fromRefreshToken(refreshToken);

        expect(deserialized).toEqual(user);
      });

      test('rejects non-refresh token', () => {
        const user = new User({ id: '123', name: 'bob', email: 'bob@loblaw.com' });
        const accessToken = user.createAccessToken();

        expect(() => User.fromRefreshToken(accessToken)).toThrow(/Not a refresh token/);
      });

      test('rejects expired token', () => {
        const user = new User({ id: '123', name: 'bob', email: 'bob@loblaw.com' });
        const refreshToken = user.createRefreshToken();

        const NOW = Date.now();
        const MILLISECONDS_IN_MONTH = 2592000000;
        const PAST_EXPIRATION = NOW + MILLISECONDS_IN_MONTH;

        const spy = jest.spyOn(Date, 'now').mockReturnValue(PAST_EXPIRATION);

        expect(() => User.fromRefreshToken(refreshToken)).toThrow(/expired/);
        expect(spy).toHaveBeenCalled();

        spy.mockRestore();
      });
    });
  });
});
