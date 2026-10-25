import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sharing, sharingCaption } from '../lib/charts/sharing.js';

const p = (awardYear, category, laureateCount) => ({ awardYear, category, laureateCount });
const prizes = [
  p(1910, 'Physics', 1), p(1920, 'Chemistry', 1), p(1930, 'Physics', 2), p(1940, 'Physics', 0),
  p(2005, 'Physics', 3), p(2010, 'Chemistry', 3), p(2015, 'Physiology or Medicine', 1), p(2020, 'Physics', 2),
  p(1950, 'Literature', 1), p(2000, 'Literature', 1), p(2010, 'Literature', 2),
  p(2001, 'Economic Sciences', 1), p(2011, 'Economic Sciences', 3),
];

test('sharing skips unawarded prizes and counts winners per decade and group', () => {
  const data = sharing(prizes);
  assert.deepEqual(data.sciencesEarly, { total: 3, solo: 2, three: 0 });
  assert.deepEqual(data.sciencesRecent, { total: 4, solo: 1, three: 2 });
  assert.ok(!data.counts.some((c) => c.decade === 1940));
  const sci2010 = data.counts.filter((c) => c.group === 'sciences' && c.decade === 2010);
  assert.deepEqual(sci2010.map((c) => [c.winners, c.count, c.total]), [[1, 1, 2], [3, 1, 2]]);
});

test('caption is built from the computed shares', () => {
  assert.equal(
    sharingCaption(sharing(prizes)),
    "Science has become a team sport: before 1950, 67% of physics, chemistry and medicine prizes went to one person; " +
      "since 2000 it's 25%, and 50% are split three ways, the most the rules allow. Literature remains a solo prize " +
      '(2 of 3 went to one writer), while economics has followed the sciences, 50% solo since 2000.',
  );
});
