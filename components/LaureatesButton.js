'use client';

import { useLaureatePanel } from './LaureatePanel.js';

// Opens the laureate panel for a table row. `request` is serializable: its sections
// carry a `filter` object (see lib/select.js) rather than a match function.
export default function LaureatesButton({ request, label, text }) {
  const openPanel = useLaureatePanel();
  return (
    <button type="button" className="text-button" onClick={() => openPanel(request)} aria-label={label}>
      {text}
    </button>
  );
}
