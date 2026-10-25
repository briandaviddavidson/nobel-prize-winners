// Chart 6: arcs from each laureate's birthplace to where they did the prize-winning
// work (affiliation, else residence). Only rows with both locations can be drawn.
import { normalizeCountry } from './countries.js';

const EARLY_BEFORE = 1950;
const RECENT_FROM = 2000;
const round = (x) => Math.round(x * 1000) / 1000;
export const place = (city, country) => [city, normalizeCountry(country)].filter(Boolean).join(', ');

export function distanceKm(a, b) {
  const rad = (x) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

export function arcs(rows) {
  const drawable = rows.filter((r) => r.birthLat != null && r.workLat != null);
  const list = drawable.map((r) => ({
    key: `${r.id}:${r.awardYear}`,
    id: r.id,
    name: r.name,
    category: r.category,
    year: r.awardYear,
    decade: r.decade,
    from: [round(r.birthLng), round(r.birthLat)],
    to: [round(r.workLng), round(r.workLat)],
    born: place(r.birthCityNow, r.birthCountryNow),
    worked: r.workLocationSource === 'affiliation' && r.affiliationName
      ? `${r.affiliationName}, ${place(r.workCityNow, r.workCountryNow)}`
      : place(r.workCityNow, r.workCountryNow),
    // Country-level endpoints (mostly residences) are drawn fainter: only the country is known.
    approximate: r.workPrecision === 'country' || r.birthCoordSource === 'country-centroid',
    km: Math.round(distanceKm({ lat: r.birthLat, lng: r.birthLng }, { lat: r.workLat, lng: r.workLng })),
  }));

  const people = drawable.filter((r) => r.laureateType === 'person' && r.birthCountryNow && r.workCountryNow);
  const moved = people.filter((r) => normalizeCountry(r.birthCountryNow) !== normalizeCountry(r.workCountryNow));
  // City-level arcs only: a country centroid would distort the distance.
  const routeCounts = new Map();
  for (const r of moved) {
    const key = `${normalizeCountry(r.birthCountryNow)} → ${normalizeCountry(r.workCountryNow)}`;
    routeCounts.set(key, (routeCounts.get(key) ?? 0) + 1);
  }
  const routes = [...routeCounts].sort((a, b) => b[1] - a[1]).slice(0, 15).map(([route, count]) => ({ route, count }));
  const kmIn = (from, to) => median(list.filter((a) => !a.approximate && a.year >= from && a.year < to).map((a) => a.km));
  return {
    arcs: list,
    routes,
    notShown: rows.length - drawable.length,
    people: people.length,
    moved: moved.length,
    movedToUS: moved.filter((r) => normalizeCountry(r.workCountryNow) === 'USA').length,
    kmEarly: kmIn(0, EARLY_BEFORE),
    kmRecent: kmIn(RECENT_FROM, Infinity),
  };
}

export function mapCaption({ people, moved, movedToUS, kmEarly, kmRecent }) {
  const n = (x) => x.toLocaleString('en-US');
  return (
    `In ${n(moved)} of ${n(people)} awards (${Math.round((moved / people) * 100)}%), the laureate did the prize-winning work ` +
    `outside the country they were born in, and ${movedToUS} of those moves ended in the US. The typical distance from ` +
    `birthplace to place of work has grown from ${n(kmEarly)} km before ${EARLY_BEFORE} to ${n(kmRecent)} km since ${RECENT_FROM}.`
  );
}
