import { test } from 'node:test';
import assert from 'node:assert/strict';
import { arcs, distanceKm, mapCaption } from '../lib/charts/map.js';

test('distanceKm matches a known great-circle distance', () => {
  // London to New York is about 5,570 km.
  const km = distanceKm({ lat: 51.5074, lng: -0.1278 }, { lat: 40.7128, lng: -74.006 });
  assert.ok(Math.abs(km - 5570) < 15, `got ${km}`);
});

const row = (o) => ({
  id: '1', name: 'x', category: 'Physics', laureateType: 'person', awardYear: 1930, decade: 1930,
  birthCityNow: 'A', birthCountryNow: 'Germany', birthLat: 50, birthLng: 10, birthCoordSource: 'api',
  workCityNow: 'B', workCountryNow: 'USA', workLat: 40, workLng: -75, workPrecision: 'city',
  workLocationSource: 'affiliation', affiliationName: 'Uni', ...o,
});

test('arcs keeps only drawable rows, flags approximate ends, and counts moves', () => {
  const data = arcs([
    row({}),
    row({ awardYear: 2010, birthCountryNow: 'USA', workCountryNow: 'USA', birthLat: 40, birthLng: -74 }),
    row({ awardYear: 2012, workPrecision: 'country' }),
    row({ laureateType: 'organization', birthLat: null }),
  ]);
  assert.equal(data.arcs.length, 3);
  assert.equal(data.notShown, 1);
  assert.deepEqual(data.arcs.map((a) => a.approximate), [false, false, true]);
  assert.equal(data.moved, 2);
  assert.equal(data.movedToUS, 2);
  assert.deepEqual(data.routes, [{ route: 'Germany → USA', from: 'Germany', to: 'USA', count: 2 }]);
  assert.equal(data.arcs[0].worked, 'Uni, B, USA');
  // The recent median skips the approximate arc.
  assert.equal(data.kmRecent, data.arcs[1].km);
  assert.match(mapCaption(data), /^In 2 of 3 awards \(67%\)/);
});
