export function expectKeys<T, K extends keyof T>(obj: any, ...keys: Array<K>): T {
  for (const key of keys) {
    if (!obj.hasOwnProperty(key)) {
      throw new Error(`Missing property for key: ${key}`);
    }
  }

  return obj;
}
