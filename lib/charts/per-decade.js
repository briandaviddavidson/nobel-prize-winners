// Chart 1: laureates per decade, stacked by category, plus the caption's numbers.
import { CATEGORY_NAMES, SCIENCES } from '../categories.js';

const decadeLabel = (d) => `${d}s`;

export function perDecade(rows, prizes) {
  const decades = [...new Set(rows.map((r) => r.decade))].sort((a, b) => a - b);
  const counts = [];
  for (const decade of decades) {
    for (const category of CATEGORY_NAMES) {
      const count = rows.filter((r) => r.decade === decade && r.category === category).length;
      if (count) counts.push({ decade, category, count });
    }
  }
  const unawarded = Object.fromEntries(
    decades.map((d) => [d, prizes.filter((p) => Math.floor(p.awardYear / 10) * 10 === d && !p.laureateCount).length]),
  );
  return { decades, counts, unawarded };
}

export function perDecadeCaption({ decades, counts, unawarded }, { lastDecade }) {
  const total = (d, cats = CATEGORY_NAMES) =>
    counts.filter((c) => c.decade === d && cats.includes(c.category)).reduce((s, c) => s + c.count, 0);
  const complete = decades.filter((d) => d !== lastDecade);
  const first = complete[0];
  const peak = complete.reduce((a, b) => (total(b) > total(a) ? b : a));
  const growth = total(peak) / total(first);
  const scienceShare = (total(peak, SCIENCES) - total(first, SCIENCES)) / (total(peak) - total(first));
  const lit = complete.map((d) => total(d, ['Literature']));
  const wartime = [...complete].sort((a, b) => unawarded[b] - unawarded[a]).slice(0, 2).sort((a, b) => a - b);

  const growthWords = growth >= 2 ? 'more than doubled' : `grew ${Math.round((growth - 1) * 100)}%`;
  return (
    `Laureate numbers ${growthWords}, from ${total(first)} in the ${decadeLabel(first)} to ${total(peak)} in the ` +
    `${decadeLabel(peak)}, and ${Math.round(scienceShare * 100)}% of that growth was in physics, chemistry and medicine, ` +
    `while literature has held at ${Math.min(...lit)}–${Math.max(...lit)} a decade. ` +
    `The dips in the ${decadeLabel(wartime[0])} and ${decadeLabel(wartime[1])} are the world wars, when ` +
    `${unawarded[wartime[0]]} and ${unawarded[wartime[1]]} prizes went unawarded.`
  );
}
