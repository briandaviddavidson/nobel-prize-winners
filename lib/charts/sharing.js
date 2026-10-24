// Chart 4: solo vs. shared prizes over time. Counted per prize (not per laureate);
// years with no award are skipped. The statutes allow at most three laureates.
import { SCIENCES } from '../categories.js';

export const GROUPS = [
  { key: 'sciences', label: 'Physics, chemistry & medicine', short: 'Sciences', test: (c) => SCIENCES.includes(c) },
  { key: 'economics', label: 'Economics', test: (c) => c === 'Economic Sciences' },
  { key: 'peace', label: 'Peace', test: (c) => c === 'Peace' },
  { key: 'literature', label: 'Literature', test: (c) => c === 'Literature' },
];
export const WINNERS = [
  { n: 1, label: 'Solo' },
  { n: 2, label: 'Two winners' },
  { n: 3, label: 'Three winners' },
];

const EARLY_BEFORE = 1950;
const RECENT_FROM = 2000;
const decadeOf = (year) => Math.floor(year / 10) * 10;
const pct = (x) => `${Math.round(x * 100)}%`;

export function sharing(prizes) {
  const awarded = prizes.filter((p) => p.laureateCount > 0);
  const decades = [...new Set(awarded.map((p) => decadeOf(p.awardYear)))].sort((a, b) => a - b);
  const counts = [];
  for (const group of GROUPS) {
    for (const decade of decades) {
      const inCell = awarded.filter((p) => group.test(p.category) && decadeOf(p.awardYear) === decade);
      for (const { n } of WINNERS) {
        const count = inCell.filter((p) => p.laureateCount === n).length;
        if (count) counts.push({ group: group.key, decade, winners: n, count, total: inCell.length });
      }
    }
  }
  const summarize = (key, from, to) => {
    const ps = awarded.filter(
      (p) => GROUPS.find((g) => g.key === key).test(p.category) && p.awardYear >= from && p.awardYear < to,
    );
    return { total: ps.length, solo: ps.filter((p) => p.laureateCount === 1).length, three: ps.filter((p) => p.laureateCount === 3).length };
  };
  return {
    decades,
    counts,
    sciencesEarly: summarize('sciences', 0, EARLY_BEFORE),
    sciencesRecent: summarize('sciences', RECENT_FROM, Infinity),
    economicsRecent: summarize('economics', RECENT_FROM, Infinity),
    literatureAll: summarize('literature', 0, Infinity),
  };
}

export function sharingCaption({ sciencesEarly: e, sciencesRecent: r, economicsRecent: ec, literatureAll: lit }) {
  const solo = (s) => s.solo / s.total;
  return (
    `Science has become a team sport: before ${EARLY_BEFORE}, ${pct(solo(e))} of physics, chemistry and medicine prizes ` +
    `went to one person; since ${RECENT_FROM} it's ${pct(solo(r))}, and ${pct(r.three / r.total)} are split three ways, ` +
    `the most the rules allow. Literature remains a solo prize (${lit.solo} of ${lit.total} went to one writer), while economics has ` +
    `followed the sciences, ${pct(solo(ec))} solo since ${RECENT_FROM}.`
  );
}
