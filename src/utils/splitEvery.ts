export const splitEvery = <T>(size: number, input: T[]) => {
  if (size < 1) {
    throw new Error('Size must be at least 1.');
  }

  const result = [];
  for (let i = 0; i < input.length; i += size) {
    result.push(input.slice(i, i + size));
  }
  return result;
};
