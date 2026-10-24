// Chart 3: share of awards to women per decade. People only; organizations have no gender.
import { CATEGORY_NAMES, shortName } from '../categories.js';

const THRESHOLD = 0.1;
const pct = (x) => `${Math.round(x * 100)}%`;

export function genderByDecade(rows) {
  const people = rows.filter((r) => r.laureateType === 'person');
  const decades = [...new Set(people.map((r) => r.decade))].sort((a, b) => a - b);
  const byDecade = decades.map((decade) => {
    const inDecade = people.filter((r) => r.decade === decade);
    const women = inDecade.filter((r) => r.gender === 'female').length;
    return { decade, women, men: inDecade.length - women, total: inDecade.length, share: women / inDecade.length };
  });
  const byCategory = CATEGORY_NAMES.map((category) => {
    const inCat = people.filter((r) => r.category === category);
    const women = inCat.filter((r) => r.gender === 'female').length;
    return { category, women, total: inCat.length, share: women / inCat.length };
  });
  const women = people.filter((r) => r.gender === 'female').length;
  return { byDecade, byCategory, women, total: people.length };
}

export function genderCaption({ byDecade, byCategory, women, total }, { lastDecade }) {
  const firstOver = byDecade.find((d) => d.share >= THRESHOLD);
  const latest = byDecade.at(-1);
  const lowest = byCategory.filter((c) => c.total).reduce((a, b) => (b.share < a.share ? b : a));
  const latestLabel = latest.decade === lastDecade ? `the ${latest.decade}s so far` : `the ${latest.decade}s`;

  const trend = firstOver
    ? `their share stayed below ${pct(THRESHOLD)} in every decade until the ${firstOver.decade}s, and in ${latestLabel} it's ${pct(latest.share)} (${latest.women} of ${latest.total})`
    : `their share has never reached ${pct(THRESHOLD)} in any decade`;
  return (
    `Women account for ${women} of ${total.toLocaleString('en-US')} awards to people (${pct(women / total)}); ${trend}. ` +
    `${shortName(lowest.category)} is the most lopsided: ${lowest.women} of its ${lowest.total} awards went to women.`
  );
}
