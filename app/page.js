import ChartCard from '../components/ChartCard.js';
import Legend from '../components/Legend.js';
import PerDecadeChart from '../components/charts/PerDecadeChart.js';
import { CATEGORIES } from '../lib/categories.js';
import { lastDecade, lastYear, prizes, rows, yearsInLastDecade } from '../lib/data.js';
import { perDecade, perDecadeCaption } from '../lib/charts/per-decade.js';

export default function Home() {
  const decadeData = perDecade(rows, prizes);
  const partialNote = `*${lastDecade}–${lastYear} only (${yearsInLastDecade} of 10 years).`;

  return (
    <main>
      <header>
        <h1>Who Wins the Nobel</h1>
        <p>
          {rows.length.toLocaleString('en-US')} awards to {new Set(rows.map((r) => r.id)).size.toLocaleString('en-US')} people
          and organizations, 1901–{lastYear}: who wins, how old they are, where they come from, and how that has changed.
        </p>
      </header>

      <ChartCard
        id="per-decade"
        title="Laureates per decade"
        subtitle="Each laureate-prize counted once; shared prizes count every winner"
        takeaway={perDecadeCaption(decadeData, { lastDecade })}
        note={`${partialNote} Economic Sciences was first awarded in 1969.`}
        table={{
          columns: ['Decade', ...CATEGORIES.map((c) => c.short), 'Total'],
          rows: decadeData.decades.map((d) => {
            const cells = CATEGORIES.map((c) => decadeData.counts.find((x) => x.decade === d && x.category === c.name)?.count ?? 0);
            return [d === lastDecade ? `${d}s*` : `${d}s`, ...cells, cells.reduce((a, b) => a + b, 0)];
          }),
        }}
      >
        <Legend />
        <PerDecadeChart counts={decadeData.counts} decades={decadeData.decades} lastDecade={lastDecade} />
      </ChartCard>

      <footer>
        Data: <a href="https://www.nobelprize.org/about/developer-zone-2/">Nobel Prize API</a> (Nobel Prize Outreach), through {lastYear}.
      </footer>
    </main>
  );
}
