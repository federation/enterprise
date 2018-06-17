export function expectKeys<T extends object, K extends keyof T>(obj: T, ...keys: K[]) {
  for (const key of keys) {
    if (!obj.hasOwnProperty(key)) {
      throw new Error(`Missing property for key: ${key}`);
    }
  }
}
