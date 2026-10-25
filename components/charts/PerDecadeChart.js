'use client';

import * as Plot from '@observablehq/plot';
import { CATEGORIES, shortName } from '../../lib/categories.js';
import { useLaureatePanel } from '../LaureatePanel.js';
import PlotHost from '../PlotHost.js';
import { baseOptions, tipOptions, usePlot } from '../usePlot.js';

export default function PerDecadeChart({ counts, decades, lastDecade }) {
  const openPanel = useLaureatePanel();
  const ref = usePlot(
    (width, theme) => {
      const label = (d) => (d === lastDecade ? `${d}s*` : `${d}s`);
      // Cap bars at 24px; the rest of each band is air.
      const band = (width - 40) / decades.length;
      const inset = Math.max(1, (band - 24) / 2);
      return Plot.plot({
        ...baseOptions(width, theme),
        height: 340,
        marginLeft: 36,
        // On narrow screens, label every third decade (first and last included) so the ticks don't collide.
        x: {
          type: 'band',
          domain: decades,
          ticks: band < 44 ? decades.filter((_, i) => i % 3 === 0 || i === decades.length - 1) : decades,
          tickFormat: label,
          label: null,
          tickSize: 0,
        },
        y: { grid: true, label: null, ticks: 5 },
        color: { domain: CATEGORIES.map((c) => c.name), range: CATEGORIES.map((c) => theme.category(c.key)) },
        marks: [
          Plot.gridY({ stroke: theme.grid, strokeOpacity: 1 }),
          Plot.barY(counts, {
            className: 'kbd-target',
            x: 'decade',
            y: 'count',
            fill: 'category',
            order: CATEGORIES.map((c) => c.name),
            insetLeft: inset,
            insetRight: inset,
            // 1px inset top and bottom gives a 2px surface gap between stacked segments.
            insetTop: 1,
            insetBottom: 1,
            tip: tipOptions(theme),
            title: (d) => `${d.count} ${shortName(d.category)}\n${label(d.decade)}`,
          }),
          Plot.ruleY([0], { stroke: theme.axis }),
        ],
      });
    },
    [counts, decades, lastDecade],
    (v) =>
      openPanel({
        title: `${shortName(v.category)}, ${v.decade}s`,
        sections: [{ match: (d) => d.decade === v.decade && d.category === v.category }],
      }),
  );

  return (
    <PlotHost
      hostRef={ref}
      label="Stacked bar chart of Nobel laureates per decade by category"
      help="Use the left and right arrow keys to move between decades and the up and down arrow keys to move between categories. Press Enter to list the laureates."
    />
  );
}
