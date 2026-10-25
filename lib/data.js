// Build-time access to the processed dataset. Only imported by server components,
// so the full file never ships to the browser; charts get small aggregates.
import rows from '../data/processed/laureate-prizes.json' with { type: 'json' };
import prizes from '../data/processed/prizes.json' with { type: 'json' };

export { rows, prizes };

export const lastYear = Math.max(...rows.map((r) => r.awardYear));
export const lastDecade = Math.floor(lastYear / 10) * 10;
// Years of the latest decade covered so far, e.g. 7 for 2020–2026.
export const yearsInLastDecade = lastYear - lastDecade + 1;
