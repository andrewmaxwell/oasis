import {formatCounts} from '../components/pages/NewOrderPage/calcDiaperSizes.ts';
import {OrderKid} from '../types.ts';

export const consolidateOrderKids = (orderKids: OrderKid[]) => {
  const counts: {[key: string]: number} = {};
  for (const {diaper_quantity, diaper_size} of orderKids) {
    counts[diaper_size] = (counts[diaper_size] || 0) + diaper_quantity;
  }
  return formatCounts(counts);
};
