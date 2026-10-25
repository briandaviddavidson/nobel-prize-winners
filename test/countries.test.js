import { test } from 'node:test';
import assert from 'node:assert/strict';
import { countries, countriesCaption, normalizeCountry } from '../lib/charts/countries.js';

const r = (birthCountryNow, workCountryNow, laureateType = 'person') => ({ birthCountryNow, workCountryNow, laureateType });

test('normalizeCountry folds constituent parts into their country', () => {
  assert.equal(normalizeCountry('Scotland'), 'United Kingdom');
  assert.equal(normalizeCountry('the Netherlands'), 'Netherlands');
  assert.equal(normalizeCountry('USA'), 'USA');
  assert.equal(normalizeCountry(null), null);
});

test('countries tallies people by birth and work country, and the caption uses the computed counts', () => {
  const rows = [
    r('USA', 'USA'), r('USA', 'USA'), r('Poland', 'USA'), r('Poland', 'France'), r('Poland', 'Poland'),
    r('Scotland', 'United Kingdom'), r('France', null), r(null, null, 'organization'),
  ];
  const data = countries(rows);
  const usa = data.list.find((d) => d.country === 'USA');
  assert.deepEqual([usa.born, usa.worked, usa.net], [2, 3, 1]);
  assert.equal(data.list.find((d) => d.country === 'United Kingdom').born, 1);
  assert.equal(data.topBornAbroad, 1);
  assert.equal(data.missingWork, 1);
  assert.equal(
    countriesCaption(data),
    'The US is where Nobel work gets done: 3 awards went to people working there, against 2 to people born there, ' +
      'and 1 of those 3 went to people born abroad. The biggest net source is Poland: 3 awards went to people born ' +
      'in what is now Poland, but only 1 to people working there.',
  );
});
