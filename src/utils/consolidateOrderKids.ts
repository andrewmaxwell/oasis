import {DiaperSize} from '../types.ts';
import {formatCounts} from './calcDiaperSizes.ts';

export const consolidateOrderKids = (
  orderKids: {diaper_size: DiaperSize; diaper_quantity: number}[],
) => {
  const counts: Partial<{[key in DiaperSize]: number}> = {};
  for (const {diaper_quantity, diaper_size} of orderKids) {
    counts[diaper_size] = (counts[diaper_size] || 0) + diaper_quantity;
  }
  return formatCounts(counts);
};
