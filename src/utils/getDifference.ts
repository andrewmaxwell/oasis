export const getDifference = <T extends object>(obj1: T, obj2: Partial<T>) => {
  const result: Partial<T> = {};
  for (const key in obj1) {
    if (obj1[key] !== obj2[key]) {
      result[key] = obj1[key];
    }
  }
  return result;
};
