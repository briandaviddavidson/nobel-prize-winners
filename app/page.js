import ChartCard from '../components/ChartCard.js';
import LaureatePanelProvider from '../components/LaureatePanel.js';
import Legend from '../components/Legend.js';
import AgeChart from '../components/charts/AgeChart.js';
import GenderChart from '../components/charts/GenderChart.js';
import ArcMap from '../components/charts/ArcMap.js';
import CountriesChart from '../components/charts/CountriesChart.js';
import SharingChart from '../components/charts/SharingChart.js';
import PerDecadeChart from '../components/charts/PerDecadeChart.js';
import { CATEGORIES } from '../lib/categories.js';
import { lastDecade, lastYear, prizes, rows, yearsInLastDecade } from '../lib/data.js';
import { ageCaption, ages } from '../lib/charts/age.js';
import { genderByDecade, genderCaption } from '../lib/charts/gender.js';
import { GROUPS, WINNERS, sharing, sharingCaption } from '../lib/charts/sharing.js';
import { countries, countriesCaption } from '../lib/charts/countries.js';
import { arcs, mapCaption } from '../lib/charts/map.js';
import { perDecade, perDecadeCaption } from '../lib/charts/per-decade.js';

export default function Home() {
  const decadeData = perDecade(rows, prizes);
  const ageData = ages(rows);
  const genderData = genderByDecade(rows);
  const sharingData = sharing(prizes);
  const countryData = countries(rows);
  const mapData = arcs(rows);
  const signed = (n) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toFixed(1)}`;
  const partialNote = `*${lastDecade}–${lastYear} only (${yearsInLastDecade} of 10 years).`;

  return (
    <LaureatePanelProvider>
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
          hint="Select a bar segment to see who won."
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

        <ChartCard
          id="age"
          title="Age at award"
          subtitle="Each dot is one laureate; the line is the linear trend with its 95% confidence band"
          hint="Select a dot to see the laureate."
          takeaway={ageCaption(ageData)}
          note={`People only (${ageData.points.length.toLocaleString('en-US')}); organizations have no age. For ${
            rows.filter((r) => r.birthDatePrecision === 'year').length
          } laureates only the birth year is known, so their age may be off by one.`}
          table={{
            columns: ['Category', 'Laureates', 'Median before 1950', 'Median since 2000', 'Trend (yrs/decade)', 'Youngest', 'Oldest'],
            rows: ageData.stats.map((s) => [
              CATEGORIES.find((c) => c.name === s.category).short,
              s.count,
              s.earlyMedian ?? '–',
              s.recentMedian ?? '–',
              signed(s.slope),
              `${s.youngest.name} (${s.youngest.age}, ${s.youngest.year})`,
              `${s.oldest.name} (${s.oldest.age}, ${s.oldest.year})`,
            ]),
          }}
        >
          <AgeChart points={ageData.points} firstYear={1900} lastYear={lastYear} />
        </ChartCard>

        <ChartCard
          id="gender"
          title="Women among laureates"
          subtitle="Share of awards to people that went to women, by decade"
          hint="Select a bar to see the women who won that decade."
          takeaway={genderCaption(genderData, { lastDecade })}
          note={`${partialNote} Organizations are excluded. Marie Curie counts twice (1903, 1911).`}
          table={{
            columns: ['Decade', 'Women', 'Men', 'Share women'],
            rows: genderData.byDecade.map((d) => [
              d.decade === lastDecade ? `${d.decade}s*` : `${d.decade}s`,
              d.women,
              d.men,
              `${(d.share * 100).toFixed(1)}%`,
            ]),
          }}
        >
          <GenderChart byDecade={genderData.byDecade} lastDecade={lastDecade} />
        </ChartCard>

        <ChartCard
          id="sharing"
          title="Solo vs. shared prizes"
          subtitle="Share of each decade's prizes awarded to one, two or three winners"
          hint="Select a bar segment to see the laureates."
          takeaway={sharingCaption(sharingData)}
          note={`${partialNote} Counted per prize; years with no award are left out. Organizations count as one winner.`}
          table={{
            columns: ['Group', 'Decade', ...WINNERS.map((w) => w.label), 'Prizes'],
            rows: GROUPS.flatMap((g) =>
              sharingData.decades.flatMap((d) => {
                const cells = WINNERS.map(
                  (w) => sharingData.counts.find((c) => c.group === g.key && c.decade === d && c.winners === w.n)?.count ?? 0,
                );
                const total = cells.reduce((a, b) => a + b, 0);
                return total ? [[g.label, d === lastDecade ? `${d}s*` : `${d}s`, ...cells, total]] : [];
              }),
            ),
          }}
        >
          <Legend items={[...WINNERS].reverse().map((w) => ({ key: w.n, label: w.label, color: `var(--share-${w.n})` }))} />
          <SharingChart counts={sharingData.counts} decades={sharingData.decades} lastDecade={lastDecade} />
        </ChartCard>

        <ChartCard
          id="countries"
          title="Where laureates are born vs. where they work"
          subtitle="Awards to people, by country of birth and by country of the prize-winning work (top 10 of each)"
          hint="Select a country to see who was born or worked there."
          takeaway={countriesCaption(countryData)}
          note={`Today's borders: someone born in Breslau, Germany, counts as Poland. Scotland and Northern Ireland count as the UK. Place of work is the affiliation at the time of the award, or the country of residence when there is none. Net = worked − born. Repeat winners count once per award. Not shown: ${countryData.missingBirth} with no recorded birthplace and ${countryData.missingWork} with no place of work.`}
          table={{
            columns: ['Country', 'Born there', 'Worked there', 'Net'],
            rows: countryData.list.map((d) => [d.country, d.born, d.worked, d.net > 0 ? `+${d.net}` : d.net]),
          }}
        >
          <Legend
            items={[
              { key: 'born', label: 'Born there', color: 'var(--text-muted)', shape: 'ring' },
              { key: 'worked', label: 'Worked there', color: 'var(--highlight)', shape: 'dot' },
            ]}
          />
          <CountriesChart list={countryData.list} />
        </ChartCard>

        <ChartCard
          id="map"
          title="From birthplace to prize-winning work"
          subtitle="Each arc runs from where a laureate was born to where they did the work, brightest at the destination"
          hint="Select an arc or dot to see the laureate."
          takeaway={mapCaption(mapData)}
          note={`Dots mark laureates who worked where they were born. Fainter arcs end at a country's center: no institution is recorded, only a country of residence. Not shown: ${mapData.notShown} awards (mostly organizations and Peace laureates) with no birthplace or place of work. Distances use city-level arcs only.`}
          table={{
            columns: ['Most common moves', 'Awards'],
            rows: mapData.routes.map((r) => [r.route, r.count]),
          }}
        >
          <ArcMap arcs={mapData.arcs} decades={decadeData.decades} lastDecade={lastDecade} />
        </ChartCard>

        <footer>
          Data: <a href="https://www.nobelprize.org/about/developer-zone-2/">Nobel Prize API</a> (Nobel Prize Outreach), through {lastYear}.
        </footer>
      </main>
    </LaureatePanelProvider>
  );
}
