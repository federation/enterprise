/* eslint-disable no-magic-numbers */

import * as common from './common';

interface Person {
  name: string;
  age: number;
}

describe('expectKeys', () => {
  test('it should work when the keys exist', () => {
    const personObject: any = { name: 'bob', age: 18 };
    const person: Person = common.expectKeys(personObject, 'name', 'age');

    expect(person.name).toBe('bob');
    expect(person.age).toBe(18);
  });

  test('it should throw when a key is missing', () => {
    const personMissingAge: any = { name: 'bob' };

    expect(() => {
      // eslint-disable-next-line no-unused-vars
      const person: Person = common.expectKeys(personMissingAge, 'name', 'age');
    }).toThrow();
  });
});
