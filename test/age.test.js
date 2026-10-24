import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ageCaption, ages, median, slopePerDecade } from '../lib/charts/age.js';

test('slopePerDecade is the least-squares slope in years per decade', () => {
  const points = [1900, 1950, 2000].map((year) => ({ year, age: 40 + (year - 1900) * 0.2 }));
  assert.equal(slopePerDecade(points), 2);
});

test('median handles odd and even lengths', () => {
  assert.equal(median([3, 1, 2]), 2);
  assert.equal(median([4, 1, 2, 3]), 2.5);
});

test('ages skips organizations and the caption names the steepest and only-younger categories', () => {
  const r = (category, awardYear, ageAtAward) => ({ category, awardYear, ageAtAward, name: 'x' });
  const rows = [
    r('Physics', 1910, 40), r('Physics', 1920, 42), r('Physics', 2005, 75), r('Physics', 2010, 77),
    r('Chemistry', 1910, 50), r('Chemistry', 2010, 60),
    r('Physiology or Medicine', 1910, 50), r('Physiology or Medicine', 2010, 55),
    r('Literature', 1910, 60), r('Literature', 2010, 61),
    r('Peace', 1910, 70), r('Peace', 2010, 50),
    r('Economic Sciences', 1970, 60), r('Economic Sciences', 2010, 62),
    { category: 'Peace', awardYear: 1917, ageAtAward: null, name: 'org' },
  ];
  const data = ages(rows);
  assert.equal(data.points.length, 14);
  assert.equal(
    ageCaption(data),
    'Laureates are getting older overall: the median physics winner was 41 before 1950 and 76 since 2000, ' +
      'the steepest rise of any category. Peace is the only prize trending younger, from a median of 70 to 50.',
  );
});
