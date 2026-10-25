// Turns a plain, serializable description of a group of laureates into a filter over
// the panel's detail rows. Table rows are rendered on the server, so they describe
// their group this way instead of passing a function. Every given field must match;
// `group` is a prize group from the sharing chart (e.g. 'sciences').
import { GROUPS } from './charts/sharing.js';

export function matcher(filter) {
  return (d) =>
    Object.entries(filter).every(([field, value]) =>
      field === 'group' ? GROUPS.find((g) => g.key === value).test(d.category) : d[field] === value,
    );
}
