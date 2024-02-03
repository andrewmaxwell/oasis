export const indexBy = <T, K extends keyof any>(
  arr: T[],
  getKey: (i: T) => K,
) =>
  arr.reduce(
    (result, item) => {
      result[getKey(item)] = item;
      return result;
    },
    {} as Record<K, T>,
  );
