// Turns the cached raw API responses into one flat row per laureate-prize, fills in
// missing coordinates, and writes a data-quality report. Nothing is dropped: rows with
// problems are kept and listed in data/quality-report.json.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { PROCESSED_DIR, QUALITY_REPORT, processedPath, rawPath } from './lib/paths.js';
import { ageAt, parseApiDate } from './lib/dates.js';
import { buildCountryCentroids, countryCentroid, flattenPlace, placeKey } from './lib/places.js';
import { geocodeAll } from './lib/geocode.js';
import { toCsv } from './lib/csv.js';

const readRaw = async (name) => {
  try {
    return JSON.parse(await readFile(rawPath(name), 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') throw new Error(`Missing ${rawPath(name)}. Run \`npm run fetch-data\` first.`);
    throw err;
  }
};
const en = (field) => field?.en?.trim() || null;
const prizeKey = (year, category) => `${year}|${category}`;

const { laureates, fetchedAt } = await readRaw('laureates');
const { nobelPrizes } = await readRaw('nobelPrizes');

const issues = {
  partialBirthDate: [],
  missingBirthDate: [],
  missingBirthPlace: [],
  organization: [],
  repeatWinner: [],
  notReceived: [],
  noAffiliation: [],
  multipleAffiliations: [],
  multipleResidences: [],
  residenceFallback: [],
  geocoded: [],
  countryCentroidOnly: [],
  noCoordinates: [],
  unawardedPrizes: [],
  crossCheck: [],
};

// Team size per prize comes from the prize endpoint, so it's independent of the laureate data.
const laureateCountByPrize = new Map();
for (const p of nobelPrizes) {
  const count = p.laureates?.length ?? 0;
  laureateCountByPrize.set(prizeKey(p.awardYear, en(p.category)), count);
  if (!count) issues.unawardedPrizes.push({ awardYear: Number(p.awardYear), category: en(p.category), note: en(p.topMotivation) });
}

const rows = [];
// Raw place objects per row, kept aside for the country-centroid fallback.
const rawPlaces = new Map();

for (const l of laureates) {
  const isOrg = Boolean(l.orgName);
  const name = isOrg ? en(l.orgName) : en(l.knownName);
  const birth = parseApiDate(l.birth?.date);
  const ref = (p) => ({ id: l.id, name, awardYear: Number(p.awardYear), category: en(p.category) });

  if (isOrg) issues.organization.push({ id: l.id, name, prizes: l.nobelPrizes.length });
  else if (!birth.precision) issues.missingBirthDate.push({ id: l.id, name, raw: l.birth?.date ?? null });
  else if (birth.precision !== 'day') issues.partialBirthDate.push({ id: l.id, name, raw: l.birth.date, precision: birth.precision });
  if (!isOrg && !l.birth?.place) issues.missingBirthPlace.push({ id: l.id, name });
  if (l.nobelPrizes.length > 1) {
    issues.repeatWinner.push({ id: l.id, name, prizes: l.nobelPrizes.map((p) => `${p.awardYear} ${en(p.category)}`) });
  }

  const sortedPrizes = [...l.nobelPrizes].sort((a, b) => a.awardYear - b.awardYear);
  sortedPrizes.forEach((p, i) => {
    const category = en(p.category);
    const awarded = parseApiDate(p.dateAwarded);
    const [num, den = 1] = p.portion.split('/').map(Number);
    const [primary, ...others] = p.affiliations ?? [];
    const residence = p.residences?.[0];

    if (p.prizeStatus !== 'received') issues.notReceived.push({ ...ref(p), status: p.prizeStatus });
    if (!primary) issues.noAffiliation.push({ ...ref(p), residence: residence ? en(residence.locationString) : null });
    if (p.residences?.length > 1) issues.multipleResidences.push({ ...ref(p), used: en(residence.locationString), all: p.residences.map((r) => en(r.locationString)) });
    if (others.length) issues.multipleAffiliations.push({ ...ref(p), used: en(primary.name), others: others.map((a) => en(a.name)) });

    const row = {
      id: l.id,
      name,
      laureateType: isOrg ? 'organization' : 'person',
      gender: l.gender ?? null,
      birthDate: isOrg ? null : l.birth?.date ?? null,
      birthDatePrecision: isOrg ? null : birth.precision,
      birthYear: isOrg ? null : birth.year,
      ...flattenPlace(isOrg ? null : l.birth?.place, 'birth'),
      awardYear: Number(p.awardYear),
      decade: Math.floor(p.awardYear / 10) * 10,
      category,
      dateAwarded: p.dateAwarded,
      prizeStatus: p.prizeStatus,
      ageAtAward: isOrg ? null : ageAt(birth, awarded),
      portion: p.portion,
      shareFraction: num / den,
      isSolo: p.portion === '1',
      prizeLaureateCount: laureateCountByPrize.get(prizeKey(p.awardYear, category)) ?? null,
      affiliationName: en(primary?.name),
      ...flattenPlace(primary, 'affiliation'),
      affiliationCount: p.affiliations?.length ?? 0,
      otherAffiliations: others.map((a) => en(a.name)).join('; ') || null,
      ...flattenPlace(residence, 'residence'),
      prizeNumber: i + 1,
      isRepeatWinner: l.nobelPrizes.length > 1,
      motivation: en(p.motivation),
      wikidataId: l.wikidata?.id ?? null,
    };
    rows.push(row);
    rawPlaces.set(row, { birth: isOrg ? null : l.birth?.place, affiliation: primary, residence });
  });
}

// Fill missing coordinates: geocode the named city, else fall back to a country
// centroid (flagged, since an arc to a country's middle is only approximate).
// Residences are usually just a country, and the API gives them no coordinates.
const PREFIXES = ['birth', 'affiliation', 'residence'];
const centroids = buildCountryCentroids(laureates);
const needsLookup = (row, prefix) => row[`${prefix}Lat`] == null && row[`${prefix}CityNow`];
const queryFor = (row, prefix) => placeKey(row[`${prefix}CityNow`], row[`${prefix}CountryNow`]);
const countryName = (row, prefix) => row[`${prefix}CountryNow`] ?? row[`${prefix}Country`];
// Countries that never appear with coordinates anywhere in the API get geocoded by name.
const needsCountryLookup = (row, prefix, place) =>
  place && row[`${prefix}Lat`] == null && countryName(row, prefix) && !countryCentroid(place, centroids);

const queries = rows.flatMap((row) =>
  PREFIXES.flatMap((pf) => {
    const place = rawPlaces.get(row)[pf];
    return [
      ...(needsLookup(row, pf) ? [queryFor(row, pf)] : []),
      ...(needsCountryLookup(row, pf, place) ? [countryName(row, pf)] : []),
    ];
  }),
);
const { lookup, newLookups } = await geocodeAll(queries);
const found = (hit) => (hit && !hit.notFound ? hit : null);

for (const row of rows) {
  for (const pf of PREFIXES) {
    if (row[`${pf}Lat`] != null) continue;
    const place = rawPlaces.get(row)[pf];
    if (!place) continue;
    const ref = { id: row.id, name: row.name, awardYear: row.awardYear, place: pf };
    const hit = row[`${pf}CityNow`] ? found(lookup[queryFor(row, pf)]) : null;
    const centroid = countryCentroid(place, centroids) ?? found(lookup[countryName(row, pf)]);
    if (hit) {
      const source = hit.source === 'manual' ? 'manual' : 'geocoded';
      Object.assign(row, { [`${pf}Lat`]: hit.lat, [`${pf}Lng`]: hit.lng, [`${pf}CoordSource`]: source });
      issues.geocoded.push({ ...ref, query: queryFor(row, pf), result: hit.displayName, source, note: hit.note });
    } else if (centroid) {
      Object.assign(row, { [`${pf}Lat`]: centroid.lat, [`${pf}Lng`]: centroid.lng, [`${pf}CoordSource`]: 'country-centroid' });
      // Country-only residences are expected; only flag places that named a city we couldn't find.
      if (pf !== 'residence' || row[`${pf}CityNow`]) {
        issues.countryCentroidOnly.push({ ...ref, country: countryName(row, pf), city: row[`${pf}CityNow`] });
      }
    } else {
      issues.noCoordinates.push({ ...ref, location: en(place.locationString) });
    }
  }
}

// Where the prize-winning work happened, for the map and country charts: the
// affiliation when there is one, else the residence the API records instead
// (mostly Literature and Peace laureates, and usually only a country).
for (const row of rows) {
  const pf = ['affiliation', 'residence'].find((p) => row[`${p}Lat`] != null);
  Object.assign(row, {
    workLocationSource: pf ?? null,
    workCityNow: pf ? row[`${pf}CityNow`] : null,
    workCountryNow: pf ? countryName(row, pf) : null,
    workLat: pf ? row[`${pf}Lat`] : null,
    workLng: pf ? row[`${pf}Lng`] : null,
    workPrecision: !pf ? null : row[`${pf}CoordSource`] === 'country-centroid' ? 'country' : 'city',
  });
  if (pf === 'residence') {
    issues.residenceFallback.push({ id: row.id, name: row.name, awardYear: row.awardYear, category: row.category, location: placeKey(row.workCityNow, row.workCountryNow), precision: row.workPrecision });
  }
}

// Sanity checks between the two endpoints.
const prizeEntries = nobelPrizes.reduce((sum, p) => sum + (p.laureates?.length ?? 0), 0);
if (prizeEntries !== rows.length) {
  issues.crossCheck.push(`nobelPrizes lists ${prizeEntries} laureate entries but laureates yields ${rows.length} rows`);
}
for (const row of rows) {
  if (row.prizeLaureateCount == null) issues.crossCheck.push(`No prize record for ${row.name} ${row.awardYear} ${row.category}`);
}

rows.sort((a, b) => a.awardYear - b.awardYear || a.category.localeCompare(b.category) || a.name.localeCompare(b.name));

await mkdir(PROCESSED_DIR, { recursive: true });
await writeFile(processedPath('laureate-prizes.json'), JSON.stringify(rows, null, 1) + '\n');
await writeFile(processedPath('laureate-prizes.csv'), toCsv(rows));

const summary = {
  fetchedAt,
  rows: rows.length,
  laureates: laureates.length,
  people: laureates.filter((l) => !l.orgName).length,
  organizations: issues.organization.length,
  awardYears: [rows[0].awardYear, rows.at(-1).awardYear],
  newGeocodeLookups: newLookups,
  issueCounts: Object.fromEntries(Object.entries(issues).map(([k, v]) => [k, v.length])),
};
await writeFile(QUALITY_REPORT, JSON.stringify({ summary, issues }, null, 2) + '\n');

console.log(`Wrote ${rows.length} rows to ${PROCESSED_DIR}`);
console.log('Data quality issues (details in data/quality-report.json):');
for (const [k, n] of Object.entries(summary.issueCounts)) if (n) console.log(`  ${k}: ${n}`);
if (issues.crossCheck.length) {
  console.error('Cross-check failures:\n  ' + issues.crossCheck.join('\n  '));
  process.exitCode = 1;
}
