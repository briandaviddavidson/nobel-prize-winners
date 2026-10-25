'use client';

import { useEffect, useRef } from 'react';

// Reads the chart tokens off :root so Plot gets real colors (SVG attributes can't
// take var()). Re-read on every render, so a theme change repaints correctly.
export function readTheme() {
  const css = getComputedStyle(document.documentElement);
  const v = (name) => css.getPropertyValue(name).trim();
  return {
    surface: v('--surface'),
    text: v('--text-primary'),
    textSecondary: v('--text-secondary'),
    muted: v('--text-muted'),
    grid: v('--grid'),
    axis: v('--axis'),
    highlight: v('--highlight'),
    share: (n) => v(`--share-${n}`),
    category: (key) => v(`--cat-${key}`),
  };
}

// Renders an Observable Plot figure into a div, and re-renders when the container
// resizes or the color scheme changes. `build(width, theme)` returns the plot.
export function usePlot(build, deps) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let lastWidth = 0;
    const render = () => {
      const width = Math.floor(el.clientWidth);
      if (!width) return;
      lastWidth = width;
      el.replaceChildren(build(width, readTheme()));
    };
    render();

    const resize = new ResizeObserver(() => {
      if (Math.floor(el.clientWidth) !== lastWidth) render();
    });
    resize.observe(el);
    const scheme = window.matchMedia('(prefers-color-scheme: dark)');
    scheme.addEventListener('change', render);
    return () => {
      resize.disconnect();
      scheme.removeEventListener('change', render);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}

// Shared Plot defaults: recessive axes and grid, text in text tokens.
export function baseOptions(width, theme) {
  return {
    width,
    style: { background: 'transparent', color: theme.textSecondary, fontSize: '12px', overflow: 'visible' },
    marginTop: 8,
  };
}

export function tipOptions(theme) {
  return { fill: theme.surface, stroke: theme.axis, textPadding: 8 };
}
