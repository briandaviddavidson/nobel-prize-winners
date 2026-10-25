'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CATEGORIES } from '../../lib/categories.js';
import { useLaureatePanel } from '../LaureatePanel.js';
import { readTheme } from '../usePlot.js';

const SAME_PLACE_KM = 5;

// Start tilted, with the whole world in view, so the arcs are seen from the side.
const startView = (narrow) =>
  narrow
    ? { longitude: 15, latitude: 18, zoom: -0.45, pitch: 40, bearing: 0 }
    : { longitude: 15, latitude: 22, zoom: 0.8, pitch: 45, bearing: 0 };
const PITCH_3D = 45;

// Rings that cross the 180° meridian (Russia, Fiji) would draw a line across the whole
// world; shift their western-hemisphere points past 180° so each ring stays in one piece.
function unwrapAntimeridian(features) {
  const fixRing = (ring) => {
    const lngs = ring.map(([lng]) => lng);
    if (Math.max(...lngs) - Math.min(...lngs) <= 180) return ring;
    return ring.map(([lng, lat]) => [lng < 0 ? lng + 360 : lng, lat]);
  };
  return features.map((f) => {
    const g = f.geometry;
    if (!g) return f;
    const coordinates =
      g.type === 'Polygon' ? g.coordinates.map(fixRing) : g.type === 'MultiPolygon' ? g.coordinates.map((p) => p.map(fixRing)) : g.coordinates;
    return { ...f, geometry: { ...g, coordinates } };
  });
}

const rgb = (color, alpha = 255) => {
  const n = parseInt(color.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, alpha];
};

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function tooltip({ object }) {
  if (!object?.key) return null;
  const d = object;
  const where = d.km < SAME_PLACE_KM ? `Born and worked in ${escapeHtml(d.born)}` : `${escapeHtml(d.born)} → ${escapeHtml(d.worked)}`;
  return {
    html: `<strong>${escapeHtml(d.name)}</strong><br>${escapeHtml(d.category)}, ${d.year}<br>${where}`,
    className: 'map-tip',
  };
}

export default function ArcMap({ arcs, decades, lastDecade }) {
  const [category, setCategory] = useState('all');
  const [decade, setDecade] = useState('all');
  const [status, setStatus] = useState('idle');
  const [scheme, setScheme] = useState(0);
  const [tilted, setTilted] = useState(true);
  const el = useRef(null);
  const lib = useRef(null);
  const view = useRef(null);
  const openPanel = useLaureatePanel();
  const openRef = useRef(openPanel);
  openRef.current = openPanel;

  const shown = useMemo(
    () =>
      arcs.filter((a) => (category === 'all' || a.category === category) && (decade === 'all' || a.decade === Number(decade))),
    [arcs, category, decade],
  );

  // Load deck.gl and the country outlines only when the map scrolls near the viewport.
  useEffect(() => {
    if (!el.current) return;
    let cancelled = false;
    const observer = new IntersectionObserver(
      async ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        setStatus('loading');
        try {
          const [{ Deck, MapView }, layers, { feature }, world] = await Promise.all([
            import('@deck.gl/core'),
            import('@deck.gl/layers'),
            import('topojson-client'),
            import('world-atlas/countries-110m.json'),
          ]);
          if (cancelled) return;
          const topology = world.default ?? world;
          const countries = unwrapAntimeridian(feature(topology, topology.objects.countries).features);
          view.current = startView(el.current.clientWidth < 600);
          const deck = new Deck({
            parent: el.current,
            views: new MapView({ repeat: false }),
            initialViewState: view.current,
            // Scroll zooms directly (no modifier key); right-drag or Shift-drag tilts and rotates.
            controller: { scrollZoom: true, dragRotate: true, touchRotate: true, keyboard: true, maxPitch: 60, minZoom: -1 },
            // On touch screens a vertical one-finger swipe still scrolls the page.
            touchAction: 'pan-y',
            onViewStateChange: ({ viewState }) => {
              view.current = viewState;
              setTilted(viewState.pitch > 1);
            },
            getTooltip: tooltip,
            getCursor: ({ isDragging, isHovering }) => (isDragging ? 'grabbing' : isHovering ? 'pointer' : 'grab'),
            onClick: ({ object }) => object?.key && openRef.current({ key: object.key }),
            layers: [],
          });
          lib.current = { deck, countries, ...layers };
          setStatus('ready');
        } catch (err) {
          console.error('Arc map failed to load', err);
          if (!cancelled) setStatus('error');
        }
      },
      { rootMargin: '300px' },
    );
    observer.observe(el.current);
    return () => {
      cancelled = true;
      observer.disconnect();
      lib.current?.deck.finalize();
      lib.current = null;
    };
  }, []);

  // Follow the OS color scheme.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setScheme((n) => n + 1);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (status !== 'ready') return;
    const { deck, countries, GeoJsonLayer, ArcLayer, ScatterplotLayer } = lib.current;
    const theme = readTheme();
    const css = getComputedStyle(document.documentElement);
    const token = (name) => css.getPropertyValue(name).trim();
    const color = Object.fromEntries(CATEGORIES.map((c) => [c.name, theme.category(c.key)]));
    const moved = shown.filter((a) => a.km >= SAME_PLACE_KM);
    const stayed = shown.filter((a) => a.km < SAME_PLACE_KM);
    // Arcs fade in from the birthplace; country-level (approximate) arcs are fainter and thinner.
    const alpha = (a, end) => (a.approximate ? [15, 80] : [30, 170])[end];
    // Data marks draw over the land without depth-fighting at their ground-level ends.
    const onTop = { depthCompare: 'always', depthWriteEnabled: false };
    deck.setProps({
      layers: [
        new GeoJsonLayer({
          id: 'land',
          data: countries,
          filled: true,
          stroked: true,
          getFillColor: rgb(token('--map-land')),
          getLineColor: rgb(token('--map-border')),
          lineWidthUnits: 'pixels',
          getLineWidth: 0.5,
          updateTriggers: { getFillColor: scheme, getLineColor: scheme },
        }),
        new ArcLayer({
          id: 'arcs',
          data: moved,
          getSourcePosition: (a) => a.from,
          getTargetPosition: (a) => a.to,
          getSourceColor: (a) => rgb(color[a.category], alpha(a, 0)),
          getTargetColor: (a) => rgb(color[a.category], alpha(a, 1)),
          getWidth: (a) => (a.approximate ? 1 : 1.5),
          // Upright arcs are seen side-on when the camera is tilted; from straight above they
          // would look like straight lines, so in flat (2D) view they lie on the map instead.
          getTilt: tilted ? 0 : 90,
          getHeight: tilted ? 0.3 : 0.2,
          widthUnits: 'pixels',
          pickable: true,
          autoHighlight: true,
          highlightColor: [255, 255, 255, 220],
          parameters: onTop,
          updateTriggers: { getSourceColor: scheme, getTargetColor: scheme, getTilt: tilted, getHeight: tilted },
        }),
        new ScatterplotLayer({
          id: 'stayed',
          data: stayed,
          getPosition: (a) => a.to,
          getFillColor: (a) => rgb(color[a.category], 220),
          radiusUnits: 'pixels',
          getRadius: 3,
          pickable: true,
          autoHighlight: true,
          parameters: onTop,
          updateTriggers: { getFillColor: scheme },
        }),
      ],
    });
  }, [status, shown, scheme, tilted]);

  // Camera buttons: the keyboard-reachable way to zoom, tilt and reset.
  const moveCamera = (change) => {
    const deck = lib.current?.deck;
    if (!deck || !view.current) return;
    const next = { ...view.current, ...change(view.current), transitionDuration: 400 };
    view.current = next;
    setTilted(next.pitch > 1);
    deck.setProps({ initialViewState: next });
  };
  const resetView = () => moveCamera(() => startView(el.current.clientWidth < 600));

  const decadeLabel = (d) => (d === lastDecade ? `${d}s*` : `${d}s`);

  const showList = () => {
    const keys = new Set(shown.map((a) => a.key));
    const what = category === 'all' ? 'All categories' : CATEGORIES.find((c) => c.name === category).short;
    const when = decade === 'all' ? 'all decades' : `${decade}s`;
    openPanel({ title: `${what}, ${when}`, sections: [{ match: (d) => keys.has(d.key) }] });
  };

  return (
    <>
      <div className="map-filters" role="group" aria-label="Filter the map">
        <div className="chips">
          {[{ name: 'all', short: 'All' }, ...CATEGORIES].map((c) => (
            <button
              key={c.name}
              type="button"
              className="chip"
              aria-pressed={category === c.name}
              onClick={() => setCategory(c.name)}
            >
              {c.key && <span className="swatch" style={{ background: `var(--cat-${c.key})` }} />}
              {c.short}
            </button>
          ))}
        </div>
        <label className="select">
          <span className="visually-hidden">Decade</span>
          <select value={decade} onChange={(e) => setDecade(e.target.value)}>
            <option value="all">All decades</option>
            {decades.map((d) => (
              <option key={d} value={d}>
                {decadeLabel(d)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="map-count">
        <p aria-live="polite">
          Showing {shown.length.toLocaleString('en-US')} {shown.length === 1 ? 'award' : 'awards'}
        </p>
        {/* The keyboard (and screen reader) route to the laureates the arcs stand for. */}
        <button type="button" className="text-button" onClick={showList} disabled={!shown.length}>
          Show these laureates
        </button>
      </div>
      <div className="map-frame">
        <div ref={el} className="map" />
        {status === 'ready' && (
          <div className="map-controls" role="group" aria-label="Map view">
            <button type="button" onClick={() => moveCamera((v) => ({ zoom: Math.min(v.zoom + 1, 8) }))} aria-label="Zoom in">
              +
            </button>
            <button type="button" onClick={() => moveCamera((v) => ({ zoom: Math.max(v.zoom - 1, -1) }))} aria-label="Zoom out">
              −
            </button>
            <button
              type="button"
              className="wide"
              aria-pressed={tilted}
              onClick={() => moveCamera((v) => (v.pitch > 1 ? { pitch: 0, bearing: 0 } : { pitch: PITCH_3D }))}
            >
              3D
            </button>
            <button type="button" className="wide" onClick={resetView}>
              Reset
            </button>
          </div>
        )}
        {status !== 'ready' && (
          <div className="map-status">
            {status === 'error' ? 'The map failed to load. The table below summarizes it.' : 'Loading map…'}
          </div>
        )}
      </div>
    </>
  );
}
