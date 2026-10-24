// Downloads every laureate and prize from the Nobel Prize API v2.1 and caches
// the raw responses in data/raw. Re-run only when you want fresh data.
import { mkdir, writeFile } from 'node:fs/promises';
import { RAW_DIR, rawPath } from './lib/paths.js';

const API = 'https://api.nobelprize.org/2.1';
const PAGE_SIZE = 100;

async function getJson(url, attempt = 1) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (res.ok) return res.json();
  if (attempt < 4 && (res.status === 429 || res.status >= 500)) {
    await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
    return getJson(url, attempt + 1);
  }
  throw new Error(`${res.status} ${res.statusText} for ${url}`);
}

// The API's links.next points at an internal http host, so page by offset ourselves.
async function fetchAll(endpoint, key) {
  const items = [];
  let total = Infinity;
  for (let offset = 0; offset < total; offset += PAGE_SIZE) {
    const page = await getJson(`${API}/${endpoint}?offset=${offset}&limit=${PAGE_SIZE}`);
    total = page.meta.count;
    items.push(...page[key]);
    process.stdout.write(`\r${endpoint}: ${items.length}/${total}`);
  }
  process.stdout.write('\n');
  if (items.length !== total) {
    throw new Error(`${endpoint}: expected ${total} items, got ${items.length}`);
  }
  return items;
}

await mkdir(RAW_DIR, { recursive: true });
const fetchedAt = new Date().toISOString();
for (const [endpoint, key] of [
  ['laureates', 'laureates'],
  ['nobelPrizes', 'nobelPrizes'],
]) {
  const items = await fetchAll(endpoint, key);
  await writeFile(rawPath(endpoint), JSON.stringify({ fetchedAt, source: `${API}/${endpoint}`, [key]: items }, null, 1));
}
console.log(`Saved raw data to ${RAW_DIR}`);
