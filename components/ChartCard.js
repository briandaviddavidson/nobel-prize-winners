import LaureatesButton from './LaureatesButton.js';

// Shared frame for every chart: title, subtitle, the chart, its computed takeaway,
// and a table view so no value depends on hovering. A table row is an array of cells,
// or { cells, select, label } to make its first cell a button that lists the row's
// laureates (first, so it stays visible when a wide table scrolls on a phone).
export default function ChartCard({ id, title, subtitle, hint, takeaway, note, table, children }) {
  return (
    <section className="chart" id={id} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`}>{title}</h2>
      {subtitle && <p className="subtitle">{subtitle}</p>}
      {hint && <p className="hint">{hint}</p>}
      {children}
      <p className="takeaway">{takeaway}</p>
      {note && <p className="note">{note}</p>}
      {table && (
        <details className="table-view">
          <summary>Show as table</summary>
          <div className="scroll">
            <table>
              <thead>
                <tr>
                  {table.columns.map((c) => (
                    <th key={c} scope="col">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, i) => (
                  <tr key={i}>
                    {(row.cells ?? row).map((cell, j) =>
                      j === 0 ? (
                        <th key={j} scope="row">
                          {row.select ? <LaureatesButton request={row.select} label={`${row.label}: show laureates`} text={cell} /> : cell}
                        </th>
                      ) : (
                        <td key={j}>{cell}</td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </section>
  );
}
