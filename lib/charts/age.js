// Chart 2: age at award over time, by category, with a linear trend per category.
import { CATEGORIES, shortName } from '../categories.js';

const EARLY_BEFORE = 1950;
const RECENT_FROM = 2000;

export const median = (values) => {
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

// Least-squares slope of age on award year, in years of age per decade.
export function slopePerDecade(points) {
  const n = points.length;
  const mx = points.reduce((s, p) => s + p.year, 0) / n;
  const my = points.reduce((s, p) => s + p.age, 0) / n;
  let num = 0;
  let den = 0;
  for (const p of points) {
    num += (p.year - mx) * (p.age - my);
    den += (p.year - mx) ** 2;
  }
  return (num / den) * 10;
}

// People only: organizations have no age. Year-only birth dates are kept (age can be off by one).
export function ages(rows) {
  const points = rows
    .filter((r) => r.ageAtAward != null)
    .map((r) => ({ year: r.awardYear, age: r.ageAtAward, category: r.category, name: r.name }));
  const stats = CATEGORIES.map(({ name }) => {
    const pts = points.filter((p) => p.category === name);
    const early = pts.filter((p) => p.year < EARLY_BEFORE).map((p) => p.age);
    const recent = pts.filter((p) => p.year >= RECENT_FROM).map((p) => p.age);
    return {
      category: name,
      count: pts.length,
      slope: slopePerDecade(pts),
      earlyMedian: early.length ? median(early) : null,
      recentMedian: recent.length ? median(recent) : null,
      youngest: pts.reduce((a, b) => (b.age < a.age ? b : a)),
      oldest: pts.reduce((a, b) => (b.age > a.age ? b : a)),
    };
  });
  return { points, stats };
}

export function ageCaption({ stats }) {
  const comparable = stats.filter((s) => s.earlyMedian != null && s.recentMedian != null);
  const steepest = comparable.reduce((a, b) => (b.slope > a.slope ? b : a));
  const younger = comparable.filter((s) => s.slope < 0);
  const lower = (s) => shortName(s.category).toLowerCase();
  const r = Math.round;

  let caption =
    `Laureates are getting older overall: the median ${lower(steepest)} winner was ${r(steepest.earlyMedian)} ` +
    `before ${EARLY_BEFORE} and ${r(steepest.recentMedian)} since ${RECENT_FROM}, the steepest rise of any category.`;
  if (younger.length === 1) {
    const [y] = younger;
    caption += ` ${shortName(y.category)} is the only prize trending younger, from a median of ${r(y.earlyMedian)} to ${r(y.recentMedian)}.`;
  } else if (younger.length > 1) {
    caption += ` ${younger.map((y) => shortName(y.category)).join(' and ')} are trending younger.`;
  }
  return caption;
}
