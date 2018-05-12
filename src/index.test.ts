const TIMEOUT = 1000;

test('basic', () => {
  expect(2 + 2).toBe(4);
});

test('async', async () => {
  expect(1).toBe(1);
}, TIMEOUT);
