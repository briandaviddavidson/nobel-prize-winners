// Writes public/data/laureate-details.json: everything the laureate panel shows,
// one entry per award. The page fetches it on the first click, so it stays out of
// the HTML. Runs before `npm run dev` and `npm run build`.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { ROOT, PORTRAITS, processedPath } from './lib/paths.js';
import { DETAILS_FILE } from '../lib/site.js';
import { normalizeCountry } from '../lib/charts/countries.js';
import { place } from '../lib/charts/map.js';

const rows = JSON.parse(await readFile(processedPath('laureate-prizes.json'), 'utf8'));
const { portraits } = JSON.parse(await readFile(PORTRAITS, 'utf8'));

const details = rows.map((r) => {
  const p = r.laureateType === 'person' ? portraits[r.wikidataId] : null;
  return {
    key: `${r.id}:${r.awardYear}`,
    name: r.name,
    type: r.laureateType,
    gender: r.gender,
    category: r.category,
    year: r.awardYear,
    decade: r.decade,
    laureateCount: r.prizeLaureateCount,
    age: r.ageAtAward,
    motivation: r.motivation,
    birthCountry: normalizeCountry(r.birthCountryNow),
    workCountry: normalizeCountry(r.workCountryNow),
    born: place(r.birthCityNow, r.birthCountryNow) || null,
    worked:
      [r.workLocationSource === 'affiliation' ? r.affiliationName : null, place(r.workCityNow, r.workCountryNow)]
        .filter(Boolean)
        .join(', ') || null,
    wikipedia: r.wikipediaUrl,
    portrait: p
      ? { src: p.thumb, width: p.width, height: p.height, source: p.source, artist: p.artist, license: p.license, licenseUrl: p.licenseUrl }
      : null,
  };
});

const out = join(ROOT, 'public', DETAILS_FILE);
await mkdir(dirname(out), { recursive: true });
await writeFile(out, JSON.stringify(details));
console.log(`Wrote ${details.length} laureate details to ${out}`);
