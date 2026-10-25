import ChartCard from '../components/ChartCard.js';
import Mark from '../components/Mark.js';
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
import { countries, countriesCaption, normalizeCountry } from '../lib/charts/countries.js';
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
  const laureateCount = new Set(rows.map((r) => r.id)).size;
  const birthCountries = new Set(rows.map((r) => normalizeCountry(r.birthCountryNow)).filter(Boolean)).size;
  const n = (x) => x.toLocaleString('en-US');
  const partialNote = `*${lastDecade}–${lastYear} only (${yearsInLastDecade} of 10 years).`;

  return (
    <LaureatePanelProvider>
      <header className="site-bar">
        <div className="wrap">
          <a className="site-name" href="#top">
            <Mark />
            Who Wins the Nobel
          </a>
          <a className="byline" href="https://briandaviddavidson.com/">
            Brian Davidson
          </a>
        </div>
      </header>

      <main className="wrap" id="top">
        <section className="hero" aria-labelledby="page-title">
          <p className="eyebrow">A data story · 1901–{lastYear}</p>
          <h1 id="page-title">Who Wins the Nobel</h1>
          <p className="deck">
            Every Nobel Prize since the first in 1901: who wins, how old they are, where they come from, and how all of that
            has changed in more than a century of awards.
          </p>
          <ul className="hero-stats">
            <li>
              <strong>{n(rows.length)}</strong>
              <span>awards</span>
            </li>
            <li>
              <strong>{n(laureateCount)}</strong>
              <span>laureates, people and organizations</span>
            </li>
            <li>
              <strong>{birthCountries}</strong>
              <span>countries of birth, today's borders</span>
            </li>
            <li>
              <strong>{lastYear - 1901 + 1}</strong>
              <span>years of prizes</span>
            </li>
          </ul>
        </section>

        <ChartCard
          id="per-decade"
          eyebrow="01 · Volume"
          title="Laureates per decade"
          subtitle="Each laureate-prize counted once; shared prizes count every winner"
          hint="Select a bar segment to see who won."
          takeaway={perDecadeCaption(decadeData, { lastDecade })}
          note={`${partialNote} Economic Sciences was first awarded in 1969.`}
          table={{
            columns: ['Decade', ...CATEGORIES.map((c) => c.short), 'Total'],
            rows: decadeData.decades.map((d) => {
              const cells = CATEGORIES.map((c) => decadeData.counts.find((x) => x.decade === d && x.category === c.name)?.count ?? 0);
              return {
                cells: [d === lastDecade ? `${d}s*` : `${d}s`, ...cells, cells.reduce((a, b) => a + b, 0)],
                label: `${d}s`,
                select: {
                  title: `${d}s`,
                  sections: CATEGORIES.map((c) => ({ title: c.short, filter: { decade: d, category: c.name } })),
                },
              };
            }),
          }}
        >
          <Legend />
          <PerDecadeChart counts={decadeData.counts} decades={decadeData.decades} lastDecade={lastDecade} />
        </ChartCard>

        <ChartCard
          id="age"
          eyebrow="02 · Age"
          title="Age at award"
          subtitle="Each dot is one laureate; the line is the linear trend with its 95% confidence band"
          hint="Select a dot to see the laureate."
          takeaway={ageCaption(ageData)}
          note={`People only (${ageData.points.length.toLocaleString('en-US')}); organizations have no age. For ${
            rows.filter((r) => r.birthDatePrecision === 'year').length
          } laureates only the birth year is known, so their age may be off by one.`}
          table={{
            columns: ['Category', 'Laureates', 'Median before 1950', 'Median since 2000', 'Trend (yrs/decade)', 'Youngest', 'Oldest'],
            rows: ageData.stats.map((s) => {
              const short = CATEGORIES.find((c) => c.name === s.category).short;
              return {
                cells: [
                  short,
                  s.count,
                  s.earlyMedian ?? '–',
                  s.recentMedian ?? '–',
                  signed(s.slope),
                  `${s.youngest.name} (${s.youngest.age}, ${s.youngest.year})`,
                  `${s.oldest.name} (${s.oldest.age}, ${s.oldest.year})`,
                ],
                label: short,
                select: { title: short, sections: [{ filter: { category: s.category, type: 'person' } }] },
              };
            }),
          }}
        >
          <AgeChart points={ageData.points} firstYear={1900} lastYear={lastYear} />
        </ChartCard>

        <ChartCard
          id="gender"
          eyebrow="03 · Gender"
          title="Women among laureates"
          subtitle="Share of awards to people that went to women, by decade"
          hint="Select a bar to see the women who won that decade."
          takeaway={genderCaption(genderData, { lastDecade })}
          note={`${partialNote} Organizations are excluded. Marie Curie counts twice (1903, 1911).`}
          table={{
            columns: ['Decade', 'Women', 'Men', 'Share women'],
            rows: genderData.byDecade.map((d) => ({
              cells: [
                d.decade === lastDecade ? `${d.decade}s*` : `${d.decade}s`,
                d.women,
                d.men,
                `${(d.share * 100).toFixed(1)}%`,
              ],
              label: `women, ${d.decade}s`,
              select: {
                title: `Women laureates, ${d.decade}s`,
                sections: [{ filter: { type: 'person', gender: 'female', decade: d.decade } }],
              },
            })),
          }}
        >
          <GenderChart byDecade={genderData.byDecade} lastDecade={lastDecade} />
        </ChartCard>

        <ChartCard
          id="sharing"
          eyebrow="04 · Teams"
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
                if (!total) return [];
                return [
                  {
                    cells: [g.label, d === lastDecade ? `${d}s*` : `${d}s`, ...cells, total],
                    label: `${g.label}, ${d}s`,
                    select: {
                      title: `${g.short ?? g.label}, ${d}s`,
                      sections: WINNERS.map((w) => ({ title: w.label, filter: { group: g.key, decade: d, laureateCount: w.n } })),
                    },
                  },
                ];
              }),
            ),
          }}
        >
          <Legend items={[...WINNERS].reverse().map((w) => ({ key: w.n, label: w.label, color: `var(--share-${w.n})` }))} />
          <SharingChart counts={sharingData.counts} decades={sharingData.decades} lastDecade={lastDecade} />
        </ChartCard>

        <ChartCard
          id="countries"
          eyebrow="05 · Geography"
          title="Where laureates are born vs. where they work"
          subtitle="Awards to people, by country of birth and by country of the prize-winning work (top 10 of each)"
          hint="Select a country to see who was born or worked there."
          takeaway={countriesCaption(countryData)}
          note={`Today's borders: someone born in Breslau, Germany, counts as Poland. Scotland and Northern Ireland count as the UK. Place of work is the affiliation at the time of the award, or the country of residence when there is none. Net = worked − born. Repeat winners count once per award. Not shown: ${countryData.missingBirth} with no recorded birthplace and ${countryData.missingWork} with no place of work.`}
          table={{
            columns: ['Country', 'Born there', 'Worked there', 'Net'],
            rows: countryData.list.map((d) => ({
              cells: [d.country, d.born, d.worked, d.net > 0 ? `+${d.net}` : d.net],
              label: d.country,
              select: {
                title: d.country,
                sections: [
                  { title: 'Worked there', filter: { type: 'person', workCountry: d.country } },
                  { title: 'Born there', filter: { type: 'person', birthCountry: d.country } },
                ],
              },
            })),
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
          eyebrow="06 · Movement"
          title="From birthplace to prize-winning work"
          subtitle="Each arc runs from where a laureate was born to where they did the work, brightest at the destination"
          hint="Click the map to explore it: drag to pan, scroll to zoom, right-drag (or Shift-drag, or two fingers) to tilt and rotate, and select an arc or dot to see the laureate."
          takeaway={mapCaption(mapData)}
          note={`Dots mark laureates who worked where they were born. Fainter arcs end at a country's center: no institution is recorded, only a country of residence. Not shown: ${mapData.notShown} awards (mostly organizations and Peace laureates) with no birthplace or place of work. Distances use city-level arcs only. Country outlines: Natural Earth.`}
          table={{
            columns: ['Most common moves', 'Awards'],
            rows: mapData.routes.map((r) => ({
              cells: [r.route, r.count],
              label: r.route,
              select: { title: r.route, sections: [{ filter: { type: 'person', birthCountry: r.from, workCountry: r.to } }] },
            })),
          }}
        >
          <ArcMap arcs={mapData.arcs} decades={decadeData.decades} lastDecade={lastDecade} />
        </ChartCard>

      </main>

      <footer className="site-footer">
        <div className="wrap">
          <Mark />
          <p>
            A data project by <a href="https://briandaviddavidson.com/">Brian Davidson</a>. Laureate and prize data from the{' '}
            <a href="https://www.nobelprize.org/about/developer-zone-2/">Nobel Prize API</a> (Nobel Prize Outreach),
            through {lastYear}.
          </p>
          <p>
            Missing coordinates geocoded with Nominatim, © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>{' '}
            contributors. Country outlines from <a href="https://www.naturalearthdata.com/">Natural Earth</a>. Portraits from{' '}
            <a href="https://commons.wikimedia.org/">Wikimedia Commons</a>, credited with each photo.
          </p>
          <p className="disclaimer">
            An independent project, not affiliated with or endorsed by the Nobel Foundation or Nobel Prize Outreach. Nobel
            Prize® is a registered trademark of the Nobel Foundation.
          </p>
        </div>
      </footer>
    </LaureatePanelProvider>
  );
}
