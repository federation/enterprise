import * as db from './db';
import * as query from './user';

// TODO: This seems to just be testing the implementation, what should be tested instead?
describe('db', () => {
  describe('user', () => {
    const user = {
      id: '66811411-3496-4d77-9ae5-08022f79b35a',
      name: 'bob',
      email: 'bob@loblaw.com',
      password: 'hunter2',
      createdAt: 'Sat Jun 23 2018 00:03:44 GMT+0000 (UTC)',
    };

    const spy = jest.spyOn(db, 'query');

    afterEach(() => {
      spy.mockReset();
    });

    function queryParams(spy) {
      return spy.mock.calls[0][1];
    }

    test('create', async () => {
      // eslint-disable-next-line no-undefined
      spy.mockResolvedValue(undefined);

      await query.create(user.id, user.name, user.email, user.password);

      expect(queryParams(spy)).toEqual([user.id, user.name, user.email, user.password]);
    });

    test('getByName', async () => {
      const queryResult = {
        rows: [user],
        rowCount: 1,
      };

      spy.mockResolvedValue(queryResult);

      const result = await query.getByName('bob');

      expect(result).toBe(user);

      expect(queryParams(spy)).toEqual(['bob']);
    });
  });
});
