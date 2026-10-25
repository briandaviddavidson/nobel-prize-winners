import { CATEGORIES } from '../lib/categories.js';

// Legend: swatches carry the color; the label stays in text ink. Defaults to the
// categories; pass items of { key, label, color, shape? } for anything else.
const categoryItems = CATEGORIES.map((c) => ({ key: c.key, label: c.short, color: `var(--cat-${c.key})` }));

function Swatch({ shape, color }) {
  if (shape === 'ring') return <span className="swatch dot" style={{ border: `2px solid ${color}` }} />;
  return <span className={`swatch ${shape === 'rect' ? '' : shape}`} style={{ background: color }} />;
}

export default function Legend({ items = categoryItems, shape = 'rect' }) {
  return (
    <ul className="legend">
      {items.map((item) => (
        <li key={item.key}>
          <Swatch shape={item.shape ?? shape} color={item.color} />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
