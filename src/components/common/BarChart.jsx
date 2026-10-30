import Icon from './Icon';

/** Barras planas con texto HTML: mantienen su legibilidad a cualquier ancho. */
export function BarChart({ data = [], valueLabel = String, height, label = 'Gráfica de barras', emptyMessage = 'Sin datos para mostrar.' }) {
  if (!data.length) {
    return <div className="chart-empty"><Icon name="report" size={30} /><p>{emptyMessage}</p></div>;
  }

  const values = data.map((item) => item.value == null ? NaN : Number(item.value));
  const max = Math.max(...values.filter(Number.isFinite).map((value) => Math.max(0, value)), 1);

  return (
    <ul className="bar-chart" aria-label={label} style={height ? { maxHeight: height, overflowY: 'auto' } : undefined}>
      {data.map((item, index) => {
        const value = values[index];
        const available = Number.isFinite(value);
        const width = available ? `${Math.max(0, value) / max * 100}%` : '0%';
        return (
          <li className="bar-chart-row" key={`${item.label}-${index}`} title={item.tooltip}>
            <div className="bar-chart-label">
              {item.icon && <Icon name={item.icon} size={18} />}
              <span>{item.label}</span>
            </div>
            <div className="bar-chart-track" aria-hidden="true">
              <span className="bar-chart-fill" style={{ width }} />
            </div>
            <span className="bar-chart-value" aria-label={available ? undefined : 'No disponible'}>
              {available ? valueLabel(value) : '—'}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export default BarChart;
