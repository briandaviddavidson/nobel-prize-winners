// Looks up a portrait for each laureate (person) and saves it to data/portraits.json.
// Images come only from Wikidata's "image" property (P18), which points at Wikimedia
// Commons, so every one is freely licensed. We keep the author and license for the
// credit line, and the page hotlinks Commons thumbnails. Re-run only to refresh.
import { readFile, writeFile } from 'node:fs/promises';
import { PORTRAITS, rawPath } from './lib/paths.js';

const USER_AGENT = 'nobel-prize-winners-viz/0.1 (https://briandaviddavidson.com/nobel/)';
const BATCH = 50;
const THUMB_WIDTH = 330;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const chunks = (xs, n) => Array.from({ length: Math.ceil(xs.length / n) }, (_, i) => xs.slice(i * n, i * n + n));

async function api(base, params) {
  const url = `${base}?${new URLSearchParams({ format: 'json', formatversion: '2', ...params })}`;
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    const body = res.ok ? await res.json() : null;
    if (body && !body.error) return body;
    if (attempt >= 4) throw new Error(`${res.status} ${body?.error?.info ?? res.statusText} for ${url}`);
    await sleep(2000 * attempt);
  }
}

// Commons stores author credits as HTML; keep the text only.
const plainText = (html) =>
  (html ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    // Commons sometimes repeats the credit, e.g. "Unknown author Unknown author".
    .replace(/^(.+) \1$/, '$1');

const { laureates } = JSON.parse(await readFile(rawPath('laureates'), 'utf8'));
const people = laureates.filter((l) => !l.orgName && l.wikidata?.id);

// 1. Wikidata: laureate → Commons file name.
const fileByQid = new Map();
for (const [i, batch] of chunks(people.map((l) => l.wikidata.id), BATCH).entries()) {
  const body = await api('https://www.wikidata.org/w/api.php', { action: 'wbgetentities', ids: batch.join('|'), props: 'claims' });
  for (const [qid, entity] of Object.entries(body.entities)) {
    const file = entity.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
    if (file) fileByQid.set(qid, file);
  }
  process.stdout.write(`\rWikidata: ${Math.min((i + 1) * BATCH, people.length)}/${people.length}`);
  await sleep(200);
}
process.stdout.write('\n');

// 2. Commons: file → thumbnail URL, author and license.
const infoByFile = new Map();
const files = [...new Set(fileByQid.values())];
for (const [i, batch] of chunks(files, BATCH).entries()) {
  const body = await api('https://commons.wikimedia.org/w/api.php', {
    action: 'query',
    titles: batch.map((f) => `File:${f}`).join('|'),
    prop: 'imageinfo',
    iiprop: 'url|extmetadata',
    iiurlwidth: String(THUMB_WIDTH),
  });
  const fromTitle = new Map((body.query.normalized ?? []).map((n) => [n.to, n.from]));
  for (const page of body.query.pages) {
    const info = page.imageinfo?.[0];
    if (!info) continue;
    const meta = info.extmetadata ?? {};
    const requested = (fromTitle.get(page.title) ?? page.title).replace(/^File:/, '');
    infoByFile.set(requested, {
      file: page.title.replace(/^File:/, ''),
      thumb: info.thumburl?.replace(/\?utm_.*$/, ''),
      width: info.thumbwidth,
      height: info.thumbheight,
      source: info.descriptionurl,
      artist: plainText(meta.Artist?.value) || null,
      license: plainText(meta.LicenseShortName?.value) || null,
      licenseUrl: meta.LicenseUrl?.value ?? null,
    });
  }
  process.stdout.write(`\rCommons: ${Math.min((i + 1) * BATCH, files.length)}/${files.length}`);
  await sleep(200);
}
process.stdout.write('\n');

const portraits = {};
const missing = [];
for (const l of people) {
  const info = infoByFile.get(fileByQid.get(l.wikidata.id));
  if (info?.thumb) portraits[l.wikidata.id] = info;
  else missing.push({ id: l.id, name: l.knownName?.en, wikidataId: l.wikidata.id, reason: fileByQid.has(l.wikidata.id) ? 'commons lookup failed' : 'no image on Wikidata' });
}
const sorted = Object.fromEntries(Object.entries(portraits).sort(([a], [b]) => a.localeCompare(b)));
await writeFile(PORTRAITS, JSON.stringify({ fetchedAt: new Date().toISOString(), portraits: sorted, missing }, null, 1) + '\n');
console.log(`Portraits for ${Object.keys(portraits).length} of ${people.length} people; ${missing.length} missing (listed in ${PORTRAITS}).`);
