import { test } from 'node:test';
import assert from 'node:assert/strict';
import { perDecade, perDecadeCaption } from '../lib/charts/per-decade.js';

const row = (decade, category) => ({ decade, category });
const rows = [
  ...Array(4).fill(row(1900, 'Physics')),
  ...Array(2).fill(row(1900, 'Literature')),
  row(1910, 'Physics'),
  ...Array(10).fill(row(1920, 'Physics')),
  ...Array(2).fill(row(1920, 'Literature')),
  row(1930, 'Physics'),
];
const prizes = [
  { awardYear: 1915, laureateCount: 0 },
  { awardYear: 1916, laureateCount: 0 },
  { awardYear: 1925, laureateCount: 0 },
  { awardYear: 1901, laureateCount: 1 },
];

test('perDecade counts every row once', () => {
  const { counts, unawarded } = perDecade(rows, prizes);
  assert.equal(counts.reduce((s, c) => s + c.count, 0), rows.length);
  assert.deepEqual(unawarded, { 1900: 0, 1910: 2, 1920: 1, 1930: 0 });
});

test('caption uses computed numbers and skips the partial last decade', () => {
  const caption = perDecadeCaption(perDecade(rows, prizes), { lastDecade: 1930 });
  assert.match(caption, /more than doubled, from 6 in the 1900s to 12 in the 1920s/);
  assert.match(caption, /100% of that growth was in physics/);
  assert.match(caption, /literature has held at 0–2 a decade/);
  assert.match(caption, /1910s and 1920s .* 2 and 1 prizes went unawarded/);
});
