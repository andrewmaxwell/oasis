import {DIAPER_SIZES, DiaperSize, Parent} from '../types.ts';

const diaperQuantities: {[key in DiaperSize]: number} = {
  P: 75,
  N: 75,
  1: 75,
  2: 50,
  3: 50,
  4: 50,
  5: 50,
  6: 50,
  7: 50,
};

export const getDiaperQuantity = (size: DiaperSize) => diaperQuantities[size];

export const formatCounts = (counts: Partial<{[key in DiaperSize]: number}>) =>
  Object.entries(counts)
    .sort(
      (a, b) =>
        DIAPER_SIZES.indexOf(a[0] as DiaperSize) -
        DIAPER_SIZES.indexOf(b[0] as DiaperSize),
    )
    .map(([size, count]) => `${count} of size ${size}`)
    .join(', ') || 'None';

export const calcDiaperSizes = (parents: Parent[]) => {
  const counts: Partial<{[key in DiaperSize]: number}> = {};
  for (const parent of parents) {
    if (!parent.is_active) continue;
    for (const {is_active, diaper_size} of parent.kid) {
      if (!is_active) continue;
      if (!counts[diaper_size]) counts[diaper_size] = 0;
      counts[diaper_size] += diaperQuantities[diaper_size];
    }
  }
  return formatCounts(counts);
};
