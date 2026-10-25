import { test } from 'node:test';
import assert from 'node:assert/strict';
import { genderByDecade, genderCaption } from '../lib/charts/gender.js';

const r = (decade, category, gender, laureateType = 'person') => ({ decade, category, gender, laureateType });
const rows = [
  r(1900, 'Physics', 'male'), r(1900, 'Physics', 'male'), r(1900, 'Peace', 'female'),
  ...Array(9).fill(r(1900, 'Chemistry', 'male')),
  r(1910, 'Peace', 'female'), r(1910, 'Physics', 'male'), r(1910, 'Physics', 'male'), r(1910, 'Physics', 'male'),
  r(1910, 'Peace', null, 'organization'),
];

test('genderByDecade excludes organizations and computes shares', () => {
  const { byDecade, women, total } = genderByDecade(rows);
  assert.equal(total, 16);
  assert.equal(women, 2);
  assert.deepEqual(byDecade.map((d) => [d.decade, d.women, d.total]), [[1900, 1, 12], [1910, 1, 4]]);
});

test('caption finds the first decade at 10% and the most lopsided category', () => {
  const caption = genderCaption(genderByDecade(rows), { lastDecade: 1910 });
  assert.equal(
    caption,
    'Women account for 2 of 16 awards to people (13%); their share stayed below 10% in every decade until the 1910s, ' +
      "and in the 1910s so far it's 25% (1 of 4). Physics is the most lopsided: 0 of its 5 awards went to women.",
  );
});
