// Geocodes place names the API has no coordinates for, via OpenStreetMap Nominatim.
// Every answer (including "not found") is cached in data/geocode-cache.json so a
// place is only ever looked up once. Nominatim's policy: max 1 request/second, an
// identifying User-Agent, and results may be cached. Data © OpenStreetMap (ODbL).
import { readFile, writeFile } from 'node:fs/promises';
import { GEOCODE_CACHE, GEOCODE_OVERRIDES } from './paths.js';

const ENDPOINT = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'nobel-prize-winners-viz/0.1 (https://briandaviddavidson.com/nobel/)';

export async function loadCache() {
  try {
    return JSON.parse(await readFile(GEOCODE_CACHE, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return {};
    throw err;
  }
}

export async function saveCache(cache) {
  const sorted = Object.fromEntries(Object.entries(cache).sort(([a], [b]) => a.localeCompare(b)));
  await writeFile(GEOCODE_CACHE, JSON.stringify(sorted, null, 2) + '\n');
}

async function lookup(query) {
  const url = `${ENDPOINT}?${new URLSearchParams({ q: query, format: 'jsonv2', limit: '1' })}`;
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'en' } });
  if (!res.ok) throw new Error(`Nominatim ${res.status} for "${query}"`);
  const [hit] = await res.json();
  return hit
    ? { lat: Number(hit.lat), lng: Number(hit.lon), displayName: hit.display_name, source: 'nominatim' }
    : { notFound: true, source: 'nominatim' };
}

// Hand-checked coordinates for places Nominatim gets wrong or can't find.
async function loadOverrides() {
  const overrides = JSON.parse(await readFile(GEOCODE_OVERRIDES, 'utf8'));
  return Object.fromEntries(Object.entries(overrides).map(([q, v]) => [q, { ...v, source: 'manual' }]));
}

// Resolves each query from overrides, then the cache, hitting Nominatim only for
// ones never seen. Returns a lookup table covering every query.
export async function geocodeAll(queries) {
  const overrides = await loadOverrides();
  const cache = await loadCache();
  const misses = [...new Set(queries)].filter((q) => !(q in overrides) && !(q in cache));
  for (const [i, query] of misses.entries()) {
    if (i > 0) await new Promise((r) => setTimeout(r, 1100));
    cache[query] = { ...(await lookup(query)), queriedAt: new Date().toISOString() };
    console.log(`  geocoded ${i + 1}/${misses.length}: ${query} → ${cache[query].notFound ? 'not found' : cache[query].displayName}`);
  }
  if (misses.length) await saveCache(cache);
  return { lookup: { ...cache, ...overrides }, newLookups: misses.length };
}
