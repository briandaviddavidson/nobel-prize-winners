'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CATEGORIES } from '../../lib/categories.js';
import { readTheme } from '../usePlot.js';

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const SAME_PLACE_KM = 5;

const rgb = (hex, alpha = 255) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, alpha];
};

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Muted basemaps so the arcs carry the color. Raster styles apply only without a Map ID.
const mapStyles = (dark) => {
  const c = dark
    ? { land: '#232322', water: '#121212', border: '#3d3d3a', text: '#8a8984', halo: '#1a1a19' }
    : { land: '#f1f0ec', water: '#dde4ea', border: '#c9c7bf', text: '#7a7872', halo: '#fcfcfb' };
  return [
    { elementType: 'geometry', stylers: [{ color: c.land }] },
    { elementType: 'labels.text.fill', stylers: [{ color: c.text }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: c.halo }] },
    { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: c.water }] },
    { featureType: 'water', elementType: 'labels', stylers: [{ visibility: 'off' }] },
    { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: c.border }] },
    { featureType: 'administrative.province', stylers: [{ visibility: 'off' }] },
    { featureType: 'administrative.locality', stylers: [{ visibility: 'off' }] },
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
    { featureType: 'road', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  ];
};

const isDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;

function tooltip({ object }) {
  if (!object) return null;
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
  const [status, setStatus] = useState(API_KEY ? 'idle' : 'nokey');
  const [scheme, setScheme] = useState(0);
  const el = useRef(null);
  const lib = useRef(null);

  const shown = useMemo(
    () =>
      arcs.filter((a) => (category === 'all' || a.category === category) && (decade === 'all' || a.decade === Number(decade))),
    [arcs, category, decade],
  );

  // Load Google Maps and deck.gl only when the map scrolls near the viewport.
  useEffect(() => {
    if (!API_KEY || !el.current) return;
    let cancelled = false;
    const observer = new IntersectionObserver(
      async ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        setStatus('loading');
        // Google calls this global when it rejects the key (invalid, or not allowed on this domain).
        window.gm_authFailure = () => {
          lib.current?.overlay.setMap(null);
          if (!cancelled) setStatus('autherror');
        };
        try {
          const [{ setOptions, importLibrary }, { GoogleMapsOverlay }, { ArcLayer, ScatterplotLayer }] = await Promise.all([
            import('@googlemaps/js-api-loader'),
            import('@deck.gl/google-maps'),
            import('@deck.gl/layers'),
          ]);
          setOptions({ key: API_KEY, v: 'weekly' });
          const { Map } = await importLibrary('maps');
          if (cancelled) return;
          const map = new Map(el.current, {
            center: { lat: 35, lng: 0 },
            zoom: el.current.clientWidth < 600 ? 1 : 2,
            minZoom: 1,
            styles: mapStyles(isDark()),
            backgroundColor: readTheme().surface,
            disableDefaultUI: true,
            zoomControl: true,
            gestureHandling: 'cooperative',
          });
          const overlay = new GoogleMapsOverlay({ interleaved: false, layers: [], getTooltip: tooltip });
          overlay.setMap(map);
          lib.current = { map, overlay, ArcLayer, ScatterplotLayer };
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
      lib.current?.overlay.finalize();
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
    const { map, overlay, ArcLayer, ScatterplotLayer } = lib.current;
    const theme = readTheme();
    map.setOptions({ styles: mapStyles(isDark()), backgroundColor: theme.surface });
    const color = Object.fromEntries(CATEGORIES.map((c) => [c.name, theme.category(c.key)]));
    const moved = shown.filter((a) => a.km >= SAME_PLACE_KM);
    const stayed = shown.filter((a) => a.km < SAME_PLACE_KM);
    // Arcs fade in from the birthplace; country-level (approximate) arcs are fainter and thinner.
    const alpha = (a, end) => (a.approximate ? [25, 110] : [50, 230])[end];
    overlay.setProps({
      layers: [
        new ArcLayer({
          id: 'arcs',
          data: moved,
          getSourcePosition: (a) => a.from,
          getTargetPosition: (a) => a.to,
          getSourceColor: (a) => rgb(color[a.category], alpha(a, 0)),
          getTargetColor: (a) => rgb(color[a.category], alpha(a, 1)),
          getWidth: (a) => (a.approximate ? 1 : 1.5),
          widthUnits: 'pixels',
          pickable: true,
          autoHighlight: true,
          highlightColor: [255, 255, 255, 200],
          updateTriggers: { getSourceColor: scheme, getTargetColor: scheme },
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
          updateTriggers: { getFillColor: scheme },
        }),
      ],
    });
  }, [status, shown, scheme]);

  const decadeLabel = (d) => (d === lastDecade ? `${d}s*` : `${d}s`);

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
      <p className="map-count" aria-live="polite">
        Showing {shown.length.toLocaleString('en-US')} {shown.length === 1 ? 'award' : 'awards'}
      </p>
      <div className="map-frame">
        <div ref={el} className="map" />
        {status !== 'ready' && (
          <div className="map-status">
            {status === 'nokey' && 'Map unavailable: no Google Maps API key is configured.'}
            {status === 'error' && 'The map failed to load. The table below summarizes it.'}
            {status === 'autherror' && 'Google Maps rejected the API key for this site. The table below summarizes the map.'}
            {(status === 'idle' || status === 'loading') && 'Loading map…'}
          </div>
        )}
      </div>
    </>
  );
}
