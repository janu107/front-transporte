/**
 * BarChart.jsx
 * [v6 §1] Gráfica de barras horizontales con apariencia 3D (extrusión isométrica),
 * en SVG puro (sin librerías). Cada barra se dibuja como un prisma: cara frontal
 * + cara superior (más clara) + cara lateral/tope (más oscura), dando volumen.
 * Una sola serie por categoría (magnitud): un solo tono de marca. Barras con
 * etiqueta de valor directa y tooltip nativo (title). Responsiva (viewBox).
 *
 * data: [{ label, value, tooltip? }]  — ya ordenado como se desee mostrar.
 */
const BAR_FRONT = '#c1121f';   // cara frontal (rojo de marca SETRASA)
const BAR_TOP = '#e6474f';     // cara superior (más clara, recibe la luz)
const BAR_SIDE = '#8a0d15';    // cara lateral/tope (más oscura, en sombra)
const BAR_HOVER = '#9d0e18';
const TRACK_COLOR = '#f1e4e5'; // pista tenue de referencia
const DEPTH = 9;               // profundidad del efecto 3D (px del viewBox)

export function BarChart({ data = [], valueLabel = (v) => String(v), height, emptyMessage = 'Sin datos para mostrar.' }) {
  if (!data.length) {
    return <div style={{ padding: '32px 12px', textAlign: 'center', color: '#6b7280', fontSize: 13 }}>{emptyMessage}</div>;
  }

  const max = Math.max(...data.map((d) => Number(d.value) || 0), 1);
  const rowH = 34;
  const gap = 12;
  const stride = rowH + gap;
  const barH = rowH - 10;
  const labelW = 150;                 // ancho reservado para el nombre de la categoría
  const W = 600;
  const trackW = W - labelW - 70;     // deja espacio para valor + profundidad a la derecha
  const chartH = (height || data.length * stride) + DEPTH + 6;

  return (
    <svg viewBox={`0 0 ${W} ${chartH}`} style={{ width: '100%', height: 'auto', display: 'block' }} role="img" aria-label="Gráfica de barras 3D">
      {data.map((d, i) => {
        const x = labelW;
        const y = DEPTH + 4 + i * stride;               // deja hueco arriba para la cara superior
        const w = Math.max(3, (Number(d.value) / max) * trackW);
        const front = `${BAR_FRONT}_${i}`;
        return (
          <g key={d.label} className="bar3d">
            <title>{d.tooltip || `${d.label}: ${valueLabel(d.value)}`}</title>
            {/* nombre de la categoría */}
            <text x={labelW - 12} y={y + barH / 2} textAnchor="end" dominantBaseline="middle" fontSize="11" fill="#374151">
              {d.label.length > 22 ? `${d.label.slice(0, 21)}…` : d.label}
            </text>
            {/* pista de referencia (plana) */}
            <rect x={x} y={y} width={trackW} height={barH} rx={2} fill={TRACK_COLOR} />
            {/* cara superior (paralelogramo, más claro) */}
            <polygon points={`${x},${y} ${x + DEPTH},${y - DEPTH} ${x + w + DEPTH},${y - DEPTH} ${x + w},${y}`} fill={BAR_TOP} />
            {/* cara lateral derecha / tope (más oscuro) */}
            <polygon points={`${x + w},${y} ${x + w + DEPTH},${y - DEPTH} ${x + w + DEPTH},${y - DEPTH + barH} ${x + w},${y + barH}`} fill={BAR_SIDE} />
            {/* cara frontal */}
            <rect x={x} y={y} width={w} height={barH} fill={BAR_FRONT} data-front={front}
              onMouseOver={(e) => e.currentTarget.setAttribute('fill', BAR_HOVER)}
              onMouseOut={(e) => e.currentTarget.setAttribute('fill', BAR_FRONT)} />
            {/* etiqueta de valor */}
            <text x={x + w + DEPTH + 8} y={y + barH / 2} dominantBaseline="middle" fontSize="11" fontWeight="700" fill="#1a1a1a">
              {valueLabel(d.value)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default BarChart;
