export function expectKeys<T extends object, K extends keyof T>(obj: T, ...keys: K[]) {
  for (const key of keys) {
    if (!obj.hasOwnProperty(key)) {
      throw new Error(`Missing property for key: ${key}`);
    }
  }
}


export function rowToProperties<T, K extends keyof T>(row: any, ...keys: K[]): Required<Pick<T, K>> {
  const obj: any = {};

  for (const key of keys) {
    if (row[key]) {
      obj[key] = row[key];
    } else {
      throw new Error(`Row is missing key: ${key}`);
    }
  }

  return obj;
}
