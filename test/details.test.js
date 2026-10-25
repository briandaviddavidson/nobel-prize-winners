import { test } from 'node:test';
import assert from 'node:assert/strict';
import rows from '../data/processed/laureate-prizes.json' with { type: 'json' };

test('every award has a unique panel key (id:year), including repeat winners', () => {
  const keys = rows.map((r) => `${r.id}:${r.awardYear}`);
  assert.equal(new Set(keys).size, rows.length);
});

test('every award links to Wikipedia', () => {
  assert.deepEqual(rows.filter((r) => !r.wikipediaUrl).map((r) => r.name), []);
});
