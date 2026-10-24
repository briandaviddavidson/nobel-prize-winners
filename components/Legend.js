import { CATEGORIES } from '../lib/categories.js';

// Legend: swatches carry the color; the label stays in text ink. Defaults to the
// categories; pass items of { key, label, color } for anything else.
const categoryItems = CATEGORIES.map((c) => ({ key: c.key, label: c.short, color: `var(--cat-${c.key})` }));

export default function Legend({ items = categoryItems, shape = 'rect' }) {
  return (
    <ul className="legend">
      {items.map((item) => (
        <li key={item.key}>
          <span className={`swatch ${shape === 'line' ? 'line' : ''}`} style={{ background: item.color }} />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
