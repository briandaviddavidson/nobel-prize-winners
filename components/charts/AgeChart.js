'use client';

import * as Plot from '@observablehq/plot';
import { CATEGORIES } from '../../lib/categories.js';
import { useLaureatePanel } from '../LaureatePanel.js';
import PlotHost from '../PlotHost.js';
import { baseOptions, tipOptions, usePlot } from '../usePlot.js';

// Small multiples: one panel per category, so six hues never share a scatter.
export default function AgeChart({ points, firstYear, lastYear }) {
  const openPanel = useLaureatePanel();
  const ref = usePlot(
    (width, theme) => {
      const columns = width < 560 ? 2 : 3;
      const rows = Math.ceil(CATEGORIES.length / columns);
      const cell = Object.fromEntries(
        CATEGORIES.map((c, i) => [c.name, { col: i % columns, row: Math.floor(i / columns), ...c }]),
      );
      const facet = { fx: (d) => cell[d.category].col, fy: (d) => cell[d.category].row };
      const color = (d) => theme.category(cell[d.category].key);
      const panelHeight = width < 560 ? 200 : 220;

      return Plot.plot({
        ...baseOptions(width, theme),
        height: rows * panelHeight + 30,
        marginLeft: 32,
        marginTop: 24,
        marginBottom: 28,
        x: { domain: [firstYear, lastYear], ticks: [1900, 1950, 2000], tickFormat: 'd', label: null },
        y: { domain: [10, 100], ticks: 5, label: null },
        fx: { axis: null, padding: 0.12 },
        fy: { axis: null, padding: 0.18 },
        marks: [
          Plot.gridY({ stroke: theme.grid, strokeOpacity: 1 }),
          Plot.text(CATEGORIES, {
            fx: (c) => cell[c.name].col,
            fy: (c) => cell[c.name].row,
            text: 'short',
            frameAnchor: 'top-left',
            dy: -20,
            fill: theme.text,
            fontWeight: 600,
            fontSize: 13,
          }),
          Plot.dot(points, {
            x: 'year',
            y: 'age',
            ...facet,
            r: 2.5,
            className: 'kbd-target',
            fill: color,
            fillOpacity: 0.55,
          }),
          Plot.linearRegressionY(points, {
            x: 'year',
            y: 'age',
            ...facet,
            z: 'category',
            stroke: color,
            fill: color,
            fillOpacity: 0.12,
            strokeWidth: 2,
          }),
          // Nearest-point hover, so a dense scatter doesn't need pixel-perfect aim.
          Plot.tip(
            points,
            Plot.pointer({
              x: 'year',
              y: 'age',
              ...facet,
              ...tipOptions(theme),
              title: (d) => `Age ${d.age}\n${d.name}, ${cell[d.category].short} ${d.year}`,
            }),
          ),
          Plot.dot(
            points,
            Plot.pointer({ x: 'year', y: 'age', ...facet, r: 4, fill: color, stroke: theme.surface, strokeWidth: 2 }),
          ),
        ],
      });
    },
    [points, firstYear, lastYear],
    (v) => openPanel({ key: v.key }),
  );

  return (
    <PlotHost
      hostRef={ref}
      label="Scatter plots of laureate age at award by year, one panel per category, each with a linear trend line"
      help="Use the left and right arrow keys to step through the years and the up and down arrow keys to move between laureates in the same year. Page Up and Page Down switch between category panels. Press Enter to see the laureate."
    />
  );
}
