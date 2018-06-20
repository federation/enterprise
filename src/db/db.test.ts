jest.mock('pg');
import pg from 'pg';

jest.mock('../logger');
import * as logger from '../logger';
import * as db from './db';

interface Person {
  name: string;
  age: number;
}

describe('db', () => {
  const onMock = jest.fn();
  const queryMock = jest.fn();

  pg.Pool.mockImplementation(() => {
    return {
      query: queryMock,
      on: onMock,
    };
  });

  afterEach(() => {
    queryMock.mockReset();
    onMock.mockReset();
    pg.Pool.mockReset();
  });

  describe('connection', () => {
    test('it registers event handlers', () => {
      // eslint-disable-next-line no-unused-vars
      const pool = db.connection();

      expect(onMock.mock.calls[0][0]).toEqual('acquire');
      expect(onMock.mock.calls[1][0]).toEqual('remove');
      expect(onMock.mock.calls[2][0]).toEqual('error');
    });
  });

  describe('query', () => {
    const infoMock = jest.fn();

    logger.logger.mockImplementation(() => {
      return {
        info: infoMock,
      };
    });

    afterEach(() => {
      infoMock.mockReset();
    });

    test('perform and log the query', async () => {
      const result = {
        rowCount: 1,
        rows: [{ name: 'bob', age: 18 }],
      };

      queryMock.mockResolvedValue(result);

      const query = 'SELECT name FROM enterprise.accounts WHERE account_id = $1';
      const params = [1];

      await db.query(query, params);

      expect(queryMock).toHaveBeenCalledWith(query, params);

      expect(infoMock).toHaveBeenCalledWith('PostgreSQL Query', {
        query,
        params,
        ...result,
      });
    });
  });

  describe('expectRow', () => {
    test('get a single row', () => {
      const singleRowResult: pg.QueryResult = {
        rows: [{ name: 'bob', age: 18 }],
        rowCount: 1,
        command: null,
        oid: null,
        fields: null,
      };

      const person: Person = db.expectRow(singleRowResult, 'name', 'age');

      expect(person.name).toBe('bob');
      expect(person.age).toBe(18);
    });

    test('throw on more than one row', () => {
      const multiRowResult: pg.QueryResult = {
        rows: [
          { name: 'bob', age: 18 },
          { name: 'alice', age: 19 },
        ],
        rowCount: 2,
        command: null,
        oid: null,
        fields: null,
      };

      expect(() => {
        // eslint-disable-next-line no-unused-vars
        const person: Person = db.expectRow(multiRowResult, 'name', 'age');
      }).toThrow();
    });
  });

  describe('expectRows', () => {
    test('get multiple rows', () => {
      const multiRowResult: pg.QueryResult = {
        rows: [
          { name: 'bob', age: 18 },
          { name: 'alice', age: 19 },
        ],
        rowCount: 2,
        command: null,
        oid: null,
        fields: null,
      };

      const people: Person[] = db.expectRows(multiRowResult, 'name', 'age');

      expect(people).toHaveLength(2);

      expect(people[0]).toEqual({ name: 'bob', age: 18 });
      expect(people[1]).toEqual({ name: 'alice', age: 19 });
    });
  });
});
