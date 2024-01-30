import {distance} from 'fastest-levenshtein';

const getTermScore = (term: string, val: string) => {
  if (val.startsWith(term)) return 1;
  return 1 - distance(val, term) / Math.max(val.length, term.length); // 0 if completely different, 1 if identical
};

const getScore = <T>(row: T, searchTerms: string[], fields: (keyof T)[]) => {
  const values = fields.map((f) => String(row[f] ?? '').toLowerCase());

  return searchTerms
    .map((term) => Math.max(...values.map((val) => getTermScore(term, val))))
    .reduce((a, b) => a + b);
};

export const searchSorter = <T>(
  data: T[],
  search: string,
  fields: (keyof T)[],
) => {
  const searchTerms = search
    .trim()
    .toLowerCase()
    .split(/\W+/)
    .filter((t) => t);

  if (!searchTerms.length) return data;
  return data
    .map((row) => ({row, score: getScore(row, searchTerms, fields)}))
    .filter(({score}) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({row}) => row);
};
