/**
 * BarChart.jsx
 * [v5 §5] Gráfica de barras horizontales, en SVG puro (sin librerías).
 * Una sola serie por categoría (magnitud): un solo tono, sin leyenda.
 * Barras finas, extremos redondeados, etiqueta de valor directa, tooltip
 * nativo (title) con el detalle. Responsiva (viewBox escala al contenedor).
 *
 * data: [{ label, value, tooltip? }]  — ya ordenado como se desee mostrar.
 */
const BAR_COLOR = '#c1121f';   // rojo de marca SETRASA
const BAR_HOVER = '#9d0e18';
const TRACK_COLOR = '#f1e4e5'; // fondo tenue de la barra (superficie clara)

export function BarChart({ data = [], valueLabel = (v) => String(v), height, emptyMessage = 'Sin datos para mostrar.' }) {
  if (!data.length) {
    return <div style={{ padding: '32px 12px', textAlign: 'center', color: '#6b7280', fontSize: 13 }}>{emptyMessage}</div>;
  }

  const max = Math.max(...data.map((d) => Number(d.value) || 0), 1);
  const rowH = 30;
  const gap = 6;
  const chartH = height || data.length * (rowH + gap);
  const labelW = 150; // ancho reservado para el nombre de la categoría

  return (
    <svg viewBox={`0 0 600 ${chartH}`} style={{ width: '100%', height: 'auto', display: 'block' }} role="img" aria-label="Gráfica de barras">
      {data.map((d, i) => {
        const y = i * (rowH + gap);
        const trackW = 600 - labelW - 60; // deja espacio para la etiqueta de valor a la derecha
        const w = Math.max(2, (Number(d.value) / max) * trackW);
        return (
          <g key={d.label} className="bar-row">
            <title>{d.tooltip || `${d.label}: ${valueLabel(d.value)}`}</title>
            <text x={labelW - 8} y={y + rowH / 2} textAnchor="end" dominantBaseline="middle"
              fontSize="11" fill="#374151">
              {d.label.length > 22 ? `${d.label.slice(0, 21)}…` : d.label}
            </text>
            <rect x={labelW} y={y + 4} width={trackW} height={rowH - 8} rx={5} fill={TRACK_COLOR} />
            <rect x={labelW} y={y + 4} width={w} height={rowH - 8} rx={5} fill={BAR_COLOR}
              style={{ transition: 'width .2s' }}
              onMouseOver={(e) => { e.currentTarget.setAttribute('fill', BAR_HOVER); }}
              onMouseOut={(e) => { e.currentTarget.setAttribute('fill', BAR_COLOR); }} />
            <text x={labelW + w + 8} y={y + rowH / 2} dominantBaseline="middle" fontSize="11" fontWeight="700" fill="#1a1a1a">
              {valueLabel(d.value)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default BarChart;
