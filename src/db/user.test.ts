/* eslint-disable no-magic-numbers */
/* eslint-disable import/imports-first */
/* eslint-disable import/no-imports-first */

import { setConfig, Config } from '../config';

setConfig(new Config({ JWT_SECRET: 'hunter2' }));

import * as db from './db';
import * as query from './user';

describe('db', () => {
  describe('user', () => {
    test('getByName', async () => {
      const user = {
        id: 'abc',
        name: 'bob',
        email: 'bob@loblaw.com',
        password: 'hunter2',
        refreshToken: 'refresh',
      };

      const queryResult = {
        rows: [user],
        rowCount: 1,
      };

      const spy = jest.spyOn(db, 'query');

      spy.mockResolvedValue(queryResult);

      const result = await query.getByName('bob');

      expect(result).toBe(user);
      spy.mockRestore();
    });
  });
});
