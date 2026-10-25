'use client';

import * as Plot from '@observablehq/plot';
import { useLaureatePanel } from '../LaureatePanel.js';
import PlotHost from '../PlotHost.js';
import { baseOptions, tipOptions, usePlot } from '../usePlot.js';

export default function GenderChart({ byDecade, lastDecade }) {
  const openPanel = useLaureatePanel();
  const ref = usePlot(
    (width, theme) => {
      const decades = byDecade.map((d) => d.decade);
      const label = (d) => (d === lastDecade ? `${d}s*` : `${d}s`);
      const band = (width - 40) / decades.length;
      const inset = Math.max(1, (band - 24) / 2);
      const pct = (x) => `${Math.round(x * 100)}%`;
      // Label the latest decade and any decade with no women at all.
      const labeled = byDecade.filter((d) => d.decade === byDecade.at(-1).decade || d.women === 0);

      return Plot.plot({
        ...baseOptions(width, theme),
        height: 280,
        marginLeft: 40,
        marginTop: 20,
        x: {
          type: 'band',
          domain: decades,
          ticks: band < 44 ? decades.filter((_, i) => i % 3 === 0 || i === decades.length - 1) : decades,
          tickFormat: label,
          label: null,
          tickSize: 0,
        },
        y: { domain: [0, Math.max(0.25, ...byDecade.map((d) => d.share))], ticks: 5, tickFormat: '.0%', label: null },
        marks: [
          Plot.gridY({ stroke: theme.grid, strokeOpacity: 1, ticks: 5 }),
          Plot.barY(byDecade, {
            className: 'kbd-target',
            x: 'decade',
            y: 'share',
            fill: theme.highlight,
            insetLeft: inset,
            insetRight: inset,
            rx1y1: 4,
            rx2y1: 4,
            tip: tipOptions(theme),
            title: (d) => `${pct(d.share)} women\n${d.women} of ${d.total}, ${label(d.decade)}`,
          }),
          Plot.text(labeled, {
            x: 'decade',
            y: 'share',
            text: (d) => pct(d.share),
            dy: -8,
            fill: theme.text,
            fontWeight: 600,
          }),
          Plot.ruleY([0], { stroke: theme.axis }),
        ],
      });
    },
    [byDecade, lastDecade],
    (v) =>
      openPanel({
        title: `Women laureates, ${v.decade}s`,
        sections: [{ match: (d) => d.type === 'person' && d.gender === 'female' && d.decade === v.decade }],
      }),
  );

  return (
    <PlotHost
      hostRef={ref}
      className="plot-short"
      label="Bar chart of the share of Nobel awards to women in each decade"
      help="Use the left and right arrow keys to move between decades. Press Enter to list the women who won that decade."
    />
  );
}
