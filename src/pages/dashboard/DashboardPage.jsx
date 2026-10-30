import { useEffect, useState } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import BarChart from '../../components/common/BarChart';
import Icon from '../../components/common/Icon';
import realApi from '../../api/realApi';
import { formatNumber, formatCurrency } from '../../utils/formatters';

const STAT_DEFS = [
  { key: 'usuarios', label: 'Usuarios activos', icon: 'people', filter: (i) => i.estado === 'ACTIVO' },
  { key: 'roles', label: 'Roles', icon: 'shield' },
  { key: 'transportistas', label: 'Transportistas', icon: 'business' },
  { key: 'pilotos', label: 'Pilotos', icon: 'badge' },
  { key: 'camiones', label: 'Camiones', icon: 'truck' },
  { key: 'polizas', label: 'Pólizas abiertas', icon: 'document', filter: (i) => i.estado === 'ABIERTA' },
  { key: 'anticipoProvision', label: 'Anticipos activos', icon: 'wallet', filter: (i) => i.estado !== 'ANULADA' },
  { key: 'liquidaciones', label: 'Liquidaciones pendientes', icon: 'receipt', filter: (i) => i.estado === 'PENDIENTE' },
];
const FEATURED = ['transportistas', 'camiones', 'polizas', 'liquidaciones'];

function ChartStatus({ loading, error, children }) {
  if (loading) return <div className="chart-status" role="status"><span className="chart-loader" />Cargando información…</div>;
  if (error) return <div className="chart-status chart-status-error" role="status"><Icon name="warning" size={24} /><p>{error}</p></div>;
  return children;
}

export default function DashboardPage() {
  const [stats, setStats] = useState({});
  const [statsLoading, setStatsLoading] = useState(true);
  const [diesel, setDiesel] = useState(null);
  const [dieselLoading, setDieselLoading] = useState(true);
  const [dieselError, setDieselError] = useState(null);
  const [polizaViajes, setPolizaViajes] = useState(null);
  const [polizaLoading, setPolizaLoading] = useState(true);
  const [polizaError, setPolizaError] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const entries = await Promise.all(STAT_DEFS.map(async (stat) => {
        try {
          const list = await realApi.list(stat.key);
          return [stat.key, stat.filter ? list.filter(stat.filter).length : list.length];
        } catch { return [stat.key, null]; }
      }));
      if (active) { setStats(Object.fromEntries(entries)); setStatsLoading(false); }
    })();
    (async () => {
      try { const result = await realApi.dashboardFacturaActivaDiesel(); if (active) setDiesel(result); }
      catch (error) { if (active) setDieselError(error?.userMessage || 'No se pudo cargar la información de diésel.'); }
      finally { if (active) setDieselLoading(false); }
    })();
    (async () => {
      try { const result = await realApi.dashboardPolizaActivaViajes(); if (active) setPolizaViajes(result); }
      catch (error) { if (active) setPolizaError(error?.userMessage || 'No se pudo cargar la información de viajes.'); }
      finally { if (active) setPolizaLoading(false); }
    })();
    return () => { active = false; };
  }, []);

  const dieselBars = (diesel?.transportistas || []).map((item) => ({
    label: item.transportista, value: item.galones,
    tooltip: `${item.transportista}: ${formatNumber(item.galones)} gal · ${item.cantidad_vales} vale(s) · ${formatCurrency(item.valor)}`,
  }));
  const viajesBars = (polizaViajes?.transportistas || []).map((item) => ({
    label: item.transportista, value: item.cantidad_viajes,
    tooltip: `${item.transportista}: ${item.cantidad_viajes} viaje(s) · ${formatNumber(item.peso_total)} kg · ${formatCurrency(item.valor_total)}`,
  }));
  const statsBars = STAT_DEFS.map((stat) => ({ label: stat.label, icon: stat.icon, value: stats[stat.key] }))
    .sort((a, b) => (b.value ?? -1) - (a.value ?? -1));
  const unavailable = !statsLoading && STAT_DEFS.some((stat) => stats[stat.key] == null);

  return (
    <div className="dashboard">
      <PageHeader title="Dashboard" description="Una vista clara del estado de tu operación." />
      <section className="stats-grid" aria-label="Indicadores principales" aria-busy={statsLoading}>
        {FEATURED.map((key) => {
          const stat = STAT_DEFS.find((item) => item.key === key);
          return (
            <article key={key} className="stat-card">
              <div className="stat-top"><span className="stat-label">{stat.label}</span><Icon name={stat.icon} size={21} /></div>
              <div className={`stat-value ${statsLoading ? 'stat-loading' : ''}`}>{statsLoading ? '—' : stats[key] == null ? '—' : formatNumber(stats[key], 0)}</div>
              <span className="stat-caption">{statsLoading ? 'Cargando…' : stats[key] == null ? 'No disponible' : 'Registros actuales'}</span>
            </article>
          );
        })}
      </section>

      <section className="card overview-card" aria-labelledby="overview-title">
        <div className="dashboard-card-header">
          <div><h2 id="overview-title">Resumen general</h2><p>Distribución de los registros del sistema</p></div>
          <span className="chart-legend"><span />Registros</span>
        </div>
        <div className="overview-chart">
          <ChartStatus loading={statsLoading}>
            <BarChart data={statsBars} label="Registros por módulo" valueLabel={(value) => formatNumber(value, 0)} />
          </ChartStatus>
          {unavailable && <p className="dashboard-note" role="status">Algunos indicadores no están disponibles. Se muestran con un guion.</p>}
        </div>
      </section>

      <div className="dashboard-grid">
        <section className="card dashboard-chart-card" aria-labelledby="diesel-title">
          <div className="dashboard-card-header">
            <div className="chart-heading"><span className="chart-heading-icon"><Icon name="fuel" /></span><div><h2 id="diesel-title">Despachos de diésel</h2><p>Por transportista · última factura activa</p></div></div>
            <span className="chart-unit">GALONES</span>
          </div>
          {diesel?.factura && <div className="chart-context"><span>Factura <strong>{diesel.factura.num_factura}</strong></span><span>Comprados <strong>{formatNumber(diesel.factura.galones_comprados)} gal</strong></span><span>Saldo <strong>{formatNumber(diesel.factura.saldo)} gal</strong></span><span>Utilizados <strong>{formatNumber(diesel.factura.galones_utilizados)} gal</strong></span></div>}
          <div className="dashboard-chart-body"><ChartStatus loading={dieselLoading} error={dieselError}>
            <BarChart data={dieselBars} label="Galones de diésel por transportista" height={320} valueLabel={(value) => `${formatNumber(value)} gal`} emptyMessage={diesel?.mensaje || 'No hay una factura activa de combustible para mostrar.'} />
          </ChartStatus></div>
        </section>

        <section className="card dashboard-chart-card" aria-labelledby="trips-title">
          <div className="dashboard-card-header">
            <div className="chart-heading"><span className="chart-heading-icon"><Icon name="truck" /></span><div><h2 id="trips-title">Viajes por transportista</h2><p>Última póliza activa</p></div></div>
            <span className="chart-unit">VIAJES</span>
          </div>
          {polizaViajes?.poliza && <div className="chart-context"><span>Póliza <strong>{polizaViajes.poliza.nombre_poliza}</strong></span><span>Total <strong>{formatNumber(polizaViajes.poliza.total_viajes, 0)} viajes</strong></span></div>}
          <div className="dashboard-chart-body"><ChartStatus loading={polizaLoading} error={polizaError}>
            <BarChart data={viajesBars} label="Viajes por transportista" height={320} valueLabel={(value) => `${formatNumber(value, 0)} viaje(s)`} emptyMessage={polizaViajes?.mensaje || 'No hay una póliza activa para mostrar.'} />
          </ChartStatus></div>
        </section>
      </div>
    </div>
  );
}
