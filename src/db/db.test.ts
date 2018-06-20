/* eslint-disable no-magic-numbers */
/* eslint-disable import/imports-first */
/* eslint-disable import/no-imports-first */

import { QueryResult } from 'pg';

import { resetConfig, Config } from '../config';

resetConfig(new Config({ JWT_SECRET: 'hunter2' }));

import * as db from './db';

interface Person {
  name: string;
  age: number;
}

describe('db', () => {
  describe('expectRow', () => {
    test('it should get a single row', () => {
      const singleRowResult: QueryResult = {
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

    test('it should throw on more than one row', () => {
      const multiRowResult: QueryResult = {
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
    test('it should get multiple rows', () => {
      const multiRowResult: QueryResult = {
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
