import {Parent} from '../types.ts';

export const getDiaperQuantity = (size: string) =>
  size === 'N' || size === '1' ? 75 : 50;

export const formatCounts = (counts: {[key: string]: number}) =>
  Object.entries(counts)
    .sort(
      (a, b) =>
        Number(b[0] === 'N') - Number(a[0] === 'N') || a[0].localeCompare(b[0]),
    )
    .map(([size, count]) => `${count} of size ${size}`)
    .join(', ') || 'None';

export const calcDiaperSizes = (parents: Parent[]) => {
  const counts: {[key: string]: number} = {};
  for (const parent of parents) {
    if (!parent.is_active) continue;
    for (const {is_active, diaper_size} of parent.kid) {
      if (!is_active) continue;
      if (!counts[diaper_size]) counts[diaper_size] = 0;
      counts[diaper_size] += getDiaperQuantity(diaper_size);
    }
  }
  return formatCounts(counts);
};
