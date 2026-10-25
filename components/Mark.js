// The site's mark: a ring with one arc rising from a small birthplace dot to a larger
// destination, after the map's birthplace-to-work arcs.
// An original drawing; deliberately not the Nobel medal or wordmark.
export default function Mark({ className = 'mark', title }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" role={title ? 'img' : undefined} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      <circle cx="16" cy="16" r="14.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 23C9.5 13 15.5 8.5 23.5 10.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="8" cy="23" r="1.6" fill="currentColor" />
      <circle cx="23.5" cy="10.5" r="2.8" fill="currentColor" />
    </svg>
  );
}
