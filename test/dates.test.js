import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ageAt, parseApiDate } from '../scripts/lib/dates.js';

test('parseApiDate reads partial dates', () => {
  assert.deepEqual(parseApiDate('1948-00-00'), { year: 1948, month: null, day: null, precision: 'year' });
  assert.deepEqual(parseApiDate('1948-05-00'), { year: 1948, month: 5, day: null, precision: 'month' });
  assert.equal(parseApiDate('1948-05-03').precision, 'day');
  assert.equal(parseApiDate(undefined).precision, null);
});

test('ageAt subtracts a year when the birthday has not happened yet', () => {
  const awarded = parseApiDate('2014-10-10');
  assert.equal(ageAt(parseApiDate('1997-07-12'), awarded), 17);
  assert.equal(ageAt(parseApiDate('1997-10-10'), awarded), 17);
  assert.equal(ageAt(parseApiDate('1997-10-11'), awarded), 16);
});

test('ageAt falls back to the year difference for partial birth dates', () => {
  assert.equal(ageAt(parseApiDate('1948-00-00'), parseApiDate('2021-10-07')), 73);
  assert.equal(ageAt(parseApiDate(null), parseApiDate('2021-10-07')), null);
});
