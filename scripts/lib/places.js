// Helpers for the API's place objects ({ city, country, cityNow, countryNow, ... }).

const num = (v) => (v == null || v === '' ? null : Number(v));
const en = (field) => field?.en?.trim() || null;

// Flattens a place into prefixed fields. Coordinates come from cityNow when the API
// has them; geocode.js fills in the rest later and records where they came from.
export function flattenPlace(place, prefix) {
  const lat = num(place?.cityNow?.latitude);
  const lng = num(place?.cityNow?.longitude);
  return {
    [`${prefix}City`]: en(place?.city),
    [`${prefix}Country`]: en(place?.country),
    [`${prefix}CityNow`]: en(place?.cityNow),
    [`${prefix}CountryNow`]: en(place?.countryNow),
    [`${prefix}Continent`]: en(place?.continent),
    [`${prefix}Lat`]: lat,
    [`${prefix}Lng`]: lng,
    [`${prefix}CoordSource`]: lat != null ? 'api' : null,
  };
}

// Country centroid from the API, used as a last-resort coordinate.
export function countryCentroid(place) {
  const lat = num(place?.countryNow?.latitude);
  const lng = num(place?.countryNow?.longitude);
  return lat != null && lng != null ? { lat, lng } : null;
}

export const placeKey = (city, country) => [city, country].filter(Boolean).join(', ');
