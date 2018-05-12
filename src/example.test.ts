import { add, addAsync } from './example';

const TIMEOUT = 1000;

test('basic', () => {
  expect(add(2, 2)).toBe(4);
});

test('async', async () => {
  expect(await addAsync(2, 2)).toBe(4);
}, TIMEOUT);
