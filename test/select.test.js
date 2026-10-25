import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matcher } from '../lib/select.js';

test('matcher requires every field, and resolves prize groups', () => {
  const d = { decade: 1930, category: 'Chemistry', laureateCount: 3, type: 'person' };
  assert.ok(matcher({ decade: 1930, category: 'Chemistry' })(d));
  assert.ok(!matcher({ decade: 1930, category: 'Physics' })(d));
  assert.ok(matcher({ group: 'sciences', laureateCount: 3 })(d));
  assert.ok(!matcher({ group: 'literature' })(d));
  assert.ok(matcher({})(d));
});
