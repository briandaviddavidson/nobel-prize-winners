// Chart 5: top countries by birthplace vs. where the prize-winning work was done
// (affiliation, else residence). People only; today's borders, as the API's countryNow.

// Constituent parts and territories the API lists separately, folded into the country.
const FOLD = {
  Scotland: 'United Kingdom',
  'Northern Ireland': 'United Kingdom',
  'Faroe Islands (Denmark)': 'Denmark',
  'Guadeloupe, France': 'France',
  'the Netherlands': 'Netherlands',
};
export const normalizeCountry = (c) => (c ? FOLD[c] ?? c : null);

const TOP_N = 10;

export function countries(rows) {
  const people = rows.filter((r) => r.laureateType === 'person');
  const tally = (field) => {
    const m = new Map();
    for (const r of people) {
      const c = normalizeCountry(r[field]);
      if (c) m.set(c, (m.get(c) ?? 0) + 1);
    }
    return m;
  };
  const born = tally('birthCountryNow');
  const worked = tally('workCountryNow');
  const topOf = (m) => [...m].sort((a, b) => b[1] - a[1]).slice(0, TOP_N).map(([c]) => c);
  const list = [...new Set([...topOf(born), ...topOf(worked)])]
    .map((country) => ({ country, born: born.get(country) ?? 0, worked: worked.get(country) ?? 0 }))
    .map((d) => ({ ...d, net: d.worked - d.born }))
    .sort((a, b) => b.worked - a.worked || b.born - a.born);

  const top = list[0];
  const topBornAbroad = people.filter(
    (r) => normalizeCountry(r.workCountryNow) === top.country && r.birthCountryNow && normalizeCountry(r.birthCountryNow) !== top.country,
  ).length;
  return {
    list,
    topBornAbroad,
    missingBirth: people.filter((r) => !r.birthCountryNow).length,
    missingWork: people.filter((r) => !r.workCountryNow).length,
  };
}

const named = (c) => (c === 'USA' ? 'the US' : c === 'United Kingdom' ? 'the UK' : c);

export function countriesCaption({ list, topBornAbroad }) {
  const [top] = list;
  const source = list.reduce((a, b) => (b.net < a.net ? b : a));
  return (
    `${named(top.country)[0].toUpperCase()}${named(top.country).slice(1)} is where Nobel work gets done: ` +
    `${top.worked} awards went to people working there, against ${top.born} to people born there, and ${topBornAbroad} ` +
    `of those ${top.worked} went to people born abroad. The biggest net source is ${named(source.country)}: ` +
    `${source.born} awards went to people born in what is now ${named(source.country)}, but only ${source.worked} ` +
    `to people working there.`
  );
}
