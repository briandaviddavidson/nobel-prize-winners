'use client';

import * as Plot from '@observablehq/plot';
import { GROUPS, WINNERS } from '../../lib/charts/sharing.js';
import { useLaureatePanel } from '../LaureatePanel.js';
import PlotHost from '../PlotHost.js';
import { baseOptions, tipOptions, usePlot } from '../usePlot.js';

// Small multiples, one panel per group: each bar is 100% of that decade's prizes,
// split by number of winners. Three-way splits sit on the baseline.
export default function SharingChart({ counts, decades, lastDecade }) {
  const openPanel = useLaureatePanel();
  const ref = usePlot(
    (width, theme) => {
      const columns = 2;
      const cell = Object.fromEntries(GROUPS.map((g, i) => [g.key, { col: i % columns, row: Math.floor(i / columns), ...g }]));
      const facet = { fx: (d) => cell[d.group].col, fy: (d) => cell[d.group].row };
      const label = (d) => (d === lastDecade ? `${d}s*` : `${d}s`);
      const panelWidth = width / columns;
      const narrow = panelWidth < 260;
      const ticks = decades.filter((d) => d % 50 === 0);
      const winnersLabel = Object.fromEntries(WINNERS.map((w) => [w.n, w.label]));
      const pct = (x) => `${Math.round(x * 100)}%`;

      return Plot.plot({
        ...baseOptions(width, theme),
        height: 2 * (width < 560 ? 170 : 200) + 40,
        marginLeft: 36,
        marginTop: 24,
        marginBottom: 24,
        x: { type: 'band', domain: decades, ticks, tickFormat: (d) => (narrow ? String(d) : `${d}s`), label: null, tickSize: 0, paddingInner: narrow ? 0.15 : 0.3 },
        y: { domain: [0, 1], ticks: [0, 0.5, 1], tickFormat: '.0%', label: null },
        color: { domain: WINNERS.map((w) => w.n), range: [theme.share(1), theme.share(2), theme.share(3)] },
        fx: { axis: null, padding: 0.1 },
        fy: { axis: null, padding: 0.22 },
        marks: [
          Plot.gridY({ stroke: theme.grid, strokeOpacity: 1, ticks: [0.5, 1] }),
          Plot.text(GROUPS, {
            fx: (g) => cell[g.key].col,
            fy: (g) => cell[g.key].row,
            text: (g) => (narrow && g.short) || g.label,
            frameAnchor: 'top-left',
            dy: -20,
            fill: theme.text,
            fontWeight: 600,
            fontSize: 13,
          }),
          Plot.barY(counts, {
            className: 'kbd-target',
            x: 'decade',
            y: 'count',
            fill: 'winners',
            ...facet,
            offset: 'normalize',
            order: [3, 2, 1],
            insetTop: 1,
            insetBottom: 1,
            tip: tipOptions(theme),
            title: (d) =>
              `${pct(d.count / d.total)} ${winnersLabel[d.winners].toLowerCase()}\n${d.count} of ${d.total} ${(cell[d.group].short ?? cell[d.group].label).toLowerCase()} prizes, ${label(d.decade)}`,
          }),
        ],
      });
    },
    [counts, decades, lastDecade],
    (v) => {
      const group = GROUPS.find((g) => g.key === v.group);
      const winners = WINNERS.find((w) => w.n === v.winners).label.toLowerCase();
      openPanel({
        title: `${group.short ?? group.label}, ${v.decade}s: ${winners}`,
        sections: [{ match: (d) => group.test(d.category) && d.decade === v.decade && d.laureateCount === v.winners }],
      });
    },
  );

  return (
    <PlotHost
      hostRef={ref}
      label="Stacked bar charts of the share of prizes with one, two or three winners per decade, by prize group"
      help="Use the left and right arrow keys to move between decades and the up and down arrow keys to move between one, two and three winners. Page Up and Page Down switch between panels. Press Enter to list the laureates."
    />
  );
}
