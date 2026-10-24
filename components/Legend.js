import { CATEGORIES } from '../lib/categories.js';

// Category legend. Swatches carry the color; the label stays in text ink.
export default function Legend({ categories = CATEGORIES, shape = 'rect' }) {
  return (
    <ul className="legend">
      {categories.map((c) => (
        <li key={c.key}>
          <span className={`swatch ${shape === 'line' ? 'line' : ''}`} style={{ background: `var(--cat-${c.key})` }} />
          {c.short}
        </li>
      ))}
    </ul>
  );
}
