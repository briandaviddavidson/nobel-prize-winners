'use client';

import * as Plot from '@observablehq/plot';
import { baseOptions, tipOptions, usePlot } from '../usePlot.js';

// Dumbbell: ring = born there, filled dot = worked there, net change at right.
export default function CountriesChart({ list }) {
  const ref = usePlot(
    (width, theme) => {
      const narrow = width < 560;
      const label = (c) => (narrow && c === 'United Kingdom' ? 'UK' : c);
      const signed = (n) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0');
      const points = list.flatMap((d) => [
        { ...d, kind: 'Born there', value: d.born },
        { ...d, kind: 'Worked there', value: d.worked },
      ]);
      const tip = (d) => `${d.worked} worked there, ${d.born} born there\n${d.country} (net ${signed(d.net)})`;

      return Plot.plot({
        ...baseOptions(width, theme),
        height: list.length * 30 + 40,
        marginLeft: narrow ? 84 : 110,
        marginRight: 44,
        marginTop: 4,
        x: { ticks: narrow ? 4 : 6, label: null, nice: true },
        y: { domain: list.map((d) => d.country), tickFormat: label, label: null, tickSize: 0 },
        marks: [
          Plot.gridX({ stroke: theme.grid, strokeOpacity: 1, ticks: narrow ? 4 : 6 }),
          Plot.ruleX([0], { stroke: theme.axis }),
          Plot.link(list, { x1: 'born', x2: 'worked', y1: 'country', y2: 'country', stroke: theme.axis, strokeWidth: 2 }),
          Plot.dot(list, { x: 'born', y: 'country', r: 5, stroke: theme.muted, strokeWidth: 2, fill: theme.surface }),
          // Smaller and on top, so equal values read as a bullseye instead of hiding the ring.
          Plot.dot(list, { x: 'worked', y: 'country', r: 3.5, fill: theme.highlight }),
          Plot.text(list, {
            y: 'country',
            text: (d) => signed(d.net),
            frameAnchor: 'right',
            dx: 40,
            textAnchor: 'end',
            fill: theme.textSecondary,
            fontVariant: 'tabular-nums',
          }),
          // Hovering anywhere on a row shows that country.
          Plot.tip(points, Plot.pointerY({ x: 'value', y: 'country', ...tipOptions(theme), title: tip })),
        ],
      });
    },
    [list],
  );

  return (
    <div
      ref={ref}
      className="plot plot-short"
      role="img"
      aria-label="Dot plot comparing awards by birthplace country and by country where the work was done"
    />
  );
}
