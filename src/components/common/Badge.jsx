/**
 * Badge.jsx
 * Muestra un estado con color según su valor.
 */
export function Badge({ value }) {
  if (!value) return <span className="text-muted">-</span>;
  const cls = `badge badge-${String(value).toLowerCase()}`;
  return <span className={cls}>{value}</span>;
}

export default Badge;
