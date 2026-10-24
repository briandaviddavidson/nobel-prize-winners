// The API writes unknown date parts as 00, e.g. "1948-00-00" when only the year is known.
export function parseApiDate(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s ?? '');
  if (!m) return { year: null, month: null, day: null, precision: null };
  const [year, month, day] = m.slice(1).map(Number);
  const precision = day ? 'day' : month ? 'month' : 'year';
  return { year, month: month || null, day: day || null, precision };
}

// Whole years between birth and award. Exact when the birth date is complete; when only
// the year (or year and month) is known, falls back to the coarser difference, which can
// be off by one. Callers flag those rows via birthDatePrecision.
export function ageAt(birth, award) {
  if (birth.year == null || award.year == null) return null;
  let age = award.year - birth.year;
  if (birth.month && award.month) {
    if (award.month < birth.month || (award.month === birth.month && birth.day && award.day < birth.day)) {
      age -= 1;
    }
  }
  return age;
}
