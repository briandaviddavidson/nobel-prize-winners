'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { BASE_PATH, DETAILS_FILE } from '../lib/site.js';
import { shortName } from '../lib/categories.js';
import { matcher } from '../lib/select.js';

// Charts call open({ key }) for one laureate, or open({ title, sections: [{ title, match }] })
// for a group (a bar segment, a country); a section may give a serializable `filter`
// (lib/select.js) instead of `match`. Details load on the first open.
const PanelContext = createContext(() => {});
export const useLaureatePanel = () => useContext(PanelContext);

let detailsPromise;
const loadDetails = () => {
  detailsPromise ??= fetch(`${BASE_PATH}/${DETAILS_FILE}`).then((res) => {
    if (!res.ok) throw new Error(`Failed to load laureate details (${res.status})`);
    return res.json();
  });
  return detailsPromise;
};

const initials = (name) =>
  name
    .replace(/^(Sir|Lord|Lady) /, '')
    .split(/\s+/)
    .filter((w) => /^[A-ZÀ-Ý]/.test(w))
    .map((w) => w[0])
    .filter((_, i, a) => i === 0 || i === a.length - 1)
    .join('');

function Portrait({ d, size }) {
  if (d.portrait) {
    return (
      <img
        className={`portrait portrait-${size}`}
        src={d.portrait.src}
        alt={size === 'large' ? `Portrait of ${d.name}` : ''}
        loading="lazy"
        decoding="async"
      />
    );
  }
  return (
    <span className={`portrait portrait-${size} placeholder`} aria-hidden="true">
      {initials(d.name)}
    </span>
  );
}

function Detail({ d }) {
  const shared = d.laureateCount > 1 ? `, shared by ${d.laureateCount}` : '';
  return (
    <article className="laureate-detail">
      <Portrait d={d} size="large" />
      <h3>{d.name}</h3>
      <p className="meta">
        {d.category} · {d.year}
        {shared}
        {d.age != null && ` · age ${d.age}`}
      </p>
      {d.motivation && <p className="motivation">“{d.motivation}”</p>}
      <dl>
        {d.born && (
          <>
            <dt>Born</dt>
            <dd>{d.born}</dd>
          </>
        )}
        {d.worked && (
          <>
            <dt>Prize-winning work</dt>
            <dd>{d.worked}</dd>
          </>
        )}
      </dl>
      {d.wikipedia && (
        <a className="wiki-link" href={d.wikipedia} target="_blank" rel="noopener noreferrer">
          Read on Wikipedia <span aria-hidden="true">↗</span>
        </a>
      )}
      {d.portrait && (
        <p className="credit">
          Photo:{' '}
          <a href={d.portrait.source} target="_blank" rel="noopener noreferrer">
            {d.portrait.artist ? truncate(d.portrait.artist, 90) : 'Wikimedia Commons'}
          </a>
          {d.portrait.license && (
            <>
              ,{' '}
              {d.portrait.licenseUrl ? (
                <a href={d.portrait.licenseUrl} target="_blank" rel="noopener noreferrer">
                  {d.portrait.license}
                </a>
              ) : (
                d.portrait.license
              )}
            </>
          )}
          , via Wikimedia Commons
        </p>
      )}
    </article>
  );
}

const truncate = (s, n) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

function List({ sections, onPick }) {
  if (!sections.length) return <p className="panel-status">No laureates in this group.</p>;
  return sections.map((s) => (
    <section key={s.title ?? 'all'} className="laureate-list">
      {s.title && (
        <h3>
          {s.title} <span className="count">{s.items.length}</span>
        </h3>
      )}
      <ul>
        {s.items.map((d) => (
          <li key={d.key}>
            <button type="button" onClick={() => onPick(d)}>
              <Portrait d={d} size="small" />
              <span>
                <span className="name">{d.name}</span>
                <span className="meta">
                  {shortName(d.category)} · {d.year}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  ));
}

export default function LaureatePanelProvider({ children }) {
  const dialog = useRef(null);
  const [view, setView] = useState(null); // { title, sections } and/or { detail }
  const [error, setError] = useState(null);

  const open = useCallback(async (request) => {
    setError(null);
    setView({ loading: true });
    if (!dialog.current.open) dialog.current.showModal();
    try {
      const all = await loadDetails();
      if (request.key) {
        const d = all.find((x) => x.key === request.key);
        setView(d ? { detail: d } : null);
        return;
      }
      const sections = request.sections
        .map((s) => ({ title: s.title, items: all.filter(s.match ?? matcher(s.filter)).sort((a, b) => a.year - b.year || a.name.localeCompare(b.name)) }))
        .filter((s) => s.items.length);
      setView({ title: request.title, sections });
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const close = () => dialog.current.close();

  // Clicking the backdrop (the dialog element itself, outside its content) closes it.
  useEffect(() => {
    const el = dialog.current;
    const onClick = (e) => e.target === el && el.close();
    const onClose = () => setView(null);
    el.addEventListener('click', onClick);
    el.addEventListener('close', onClose);
    return () => {
      el.removeEventListener('click', onClick);
      el.removeEventListener('close', onClose);
    };
  }, []);

  const showingDetailOfList = view?.detail && view.sections;
  const heading = view?.detail ? (showingDetailOfList ? view.title : 'Laureate') : view?.title;

  return (
    <PanelContext.Provider value={open}>
      {children}
      <dialog ref={dialog} className="laureate-panel" aria-labelledby="laureate-panel-title">
        <div className="panel-inner">
          <header>
            {showingDetailOfList ? (
              <button type="button" className="back" onClick={() => setView({ ...view, detail: null })}>
                <span aria-hidden="true">←</span> {view.title}
              </button>
            ) : (
              <h2 id="laureate-panel-title">{heading ?? ''}</h2>
            )}
            <button type="button" className="close" onClick={close} aria-label="Close">
              ×
            </button>
          </header>
          <div className="panel-body">
            {error && <p className="panel-status">{error}</p>}
            {!error && view?.loading && <p className="panel-status">Loading…</p>}
            {!error && view?.detail && <Detail d={view.detail} />}
            {!error && !view?.detail && view?.sections && (
              <List sections={view.sections} onPick={(d) => setView({ ...view, detail: d })} />
            )}
          </div>
        </div>
      </dialog>
    </PanelContext.Provider>
  );
}
