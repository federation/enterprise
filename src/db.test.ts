/* eslint-disable no-magic-numbers */
/* eslint-disable import/imports-first */
/* eslint-disable import/no-imports-first */

import pg from 'pg';

import { resetConfig, Config } from './config';

resetConfig(new Config({ JWT_SECRET: 'hunter2' }));

import * as db from './db';

interface Person {
  name: string;
  age: number;
}

describe('db', () => {
  describe('expectRow', () => {
    test('it should get a single row', () => {
      const result: pg.QueryResult = {
        rows: [{ name: 'bob', age: 18 }],
        rowCount: 1,
      };

      const person: Person = db.expectRow(result, 'name', 'age');

      expect(person.name).toBe('bob');
      expect(person.age).toBe(18);
    });

    test('it should throw on more than one row', () => {
      const result: pg.QueryResult = {
        rows: [
          { name: 'bob', age: 18 },
          { name: 'alice', age: 19 },
        ],
        rowCount: 2,
      };

      expect(() => {
        const person: Person = db.expectRow(result, 'name', 'age');
      }).toThrow();
    });
  });

  describe('expectRows', () => {
    test('it should get multiple rows', () => {
      const result: pg.QueryResult = {
        rows: [
          { name: 'bob', age: 18 },
          { name: 'alice', age: 19 },
        ],
        rowCount: 2,
      };

      const people: Person[] = db.expectRows(result, 'name', 'age');

      expect(people).toHaveLength(2);

      expect(people[0]).toEqual({ name: 'bob', age: 18 });
      expect(people[1]).toEqual({ name: 'alice', age: 19 });
    });
  });
});
