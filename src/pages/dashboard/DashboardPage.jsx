/**
 * DashboardPage.jsx
 * Panel principal con tarjetas resumen (datos reales) y accesos rápidos.
 */
import { useEffect, useState } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import BarChart from '../../components/common/BarChart';
import realApi from '../../api/realApi';
import { formatNumber, formatCurrency } from '../../utils/formatters';

// Paleta de marca SETRASA: rojos y negros/carbón
const STAT_DEFS = [
  { key: 'usuarios', label: 'Usuarios activos', icon: '👤', color: '#c1121f', filter: (i) => i.estado === 'ACTIVO' },
  { key: 'roles', label: 'Roles', icon: '🛡️', color: '#1a1a1a' },
  { key: 'transportistas', label: 'Transportistas', icon: '🧑‍✈️', color: '#9d0e18' },
  { key: 'pilotos', label: 'Pilotos', icon: '🪪', color: '#3a3a3a' },
  { key: 'camiones', label: 'Camiones', icon: '🚛', color: '#e8323f' },
  { key: 'polizas', label: 'Pólizas abiertas', icon: '📄', color: '#7f0d15', filter: (i) => i.estado === 'ABIERTA' },
  { key: 'anticipoProvision', label: 'Anticipos activos', icon: '💰', color: '#262626', filter: (i) => i.estado !== 'ANULADA' },
  { key: 'liquidaciones', label: 'Liquidaciones pendientes', icon: '✅', color: '#c1121f', filter: (i) => i.estado === 'PENDIENTE' },
];

export default function DashboardPage() {
  const [stats, setStats] = useState({});

  // [v5 §5] Gráficas: última factura activa de diesel + última póliza activa.
  const [diesel, setDiesel] = useState(null);
  const [dieselLoading, setDieselLoading] = useState(true);
  const [dieselError, setDieselError] = useState(null);
  const [polizaViajes, setPolizaViajes] = useState(null);
  const [polizaLoading, setPolizaLoading] = useState(true);
  const [polizaError, setPolizaError] = useState(null);

  useEffect(() => {
    (async () => {
      const entries = await Promise.all(
        STAT_DEFS.map(async (s) => {
          try {
            const list = await realApi.list(s.key);
            const count = s.filter ? list.filter(s.filter).length : list.length;
            return [s.key, count];
          } catch {
            return [s.key, '—'];
          }
        })
      );
      setStats(Object.fromEntries(entries));
    })();

    (async () => {
      setDieselLoading(true);
      try { setDiesel(await realApi.dashboardFacturaActivaDiesel()); }
      catch (e) { setDieselError(e?.userMessage || 'No se pudo cargar la gráfica de diesel.'); }
      finally { setDieselLoading(false); }
    })();

    (async () => {
      setPolizaLoading(true);
      try { setPolizaViajes(await realApi.dashboardPolizaActivaViajes()); }
      catch (e) { setPolizaError(e?.userMessage || 'No se pudo cargar la gráfica de viajes.'); }
      finally { setPolizaLoading(false); }
    })();
  }, []);

  const dieselBars = (diesel?.transportistas || []).map((t) => ({
    label: t.transportista, value: t.galones,
    tooltip: `${t.transportista}: ${formatNumber(t.galones)} gal · ${t.cantidad_vales} vale(s) · ${formatCurrency(t.valor)}`,
  }));
  const viajesBars = (polizaViajes?.transportistas || []).map((t) => ({
    label: t.transportista, value: t.cantidad_viajes,
    tooltip: `${t.transportista}: ${t.cantidad_viajes} viaje(s) · ${formatNumber(t.peso_total)} kg · ${formatCurrency(t.valor_total)}`,
  }));

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Resumen general del Sistema Administrativo de Transporte."
      />

      <div className="stats-grid">
        {STAT_DEFS.map((s) => (
          <div className="stat-card" key={s.key}>
            <div className="stat-icon" style={{ background: s.color }}>{s.icon}</div>
            <div>
              <div className="stat-value">{stats[s.key] ?? '—'}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* [v5 §5 / v6 §1] Gráficas: última factura activa de diesel + última póliza activa */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginTop: 24 }}>
        <div className="card">
          <div className="card-body">
            <h3 style={{ marginTop: 0, marginBottom: 4, fontSize: 14 }}>Despachos de diesel por transportista</h3>
            {diesel?.factura && (
              <p style={{ margin: '0 0 10px', fontSize: 11.5, color: '#6b7280' }}>
                Factura {diesel.factura.num_factura} · comprados {formatNumber(diesel.factura.galones_comprados)} gal ·
                saldo {formatNumber(diesel.factura.saldo)} gal · utilizados {formatNumber(diesel.factura.galones_utilizados)} gal
              </p>
            )}
            {dieselLoading ? (
              <p style={{ color: '#6b7280', fontSize: 13 }}>Cargando...</p>
            ) : dieselError ? (
              <p style={{ color: '#c1121f', fontSize: 13 }}>{dieselError}</p>
            ) : (
              <BarChart data={dieselBars} valueLabel={(v) => `${formatNumber(v)} gal`}
                emptyMessage={diesel?.mensaje || 'No existe una factura activa de combustible para mostrar'} />
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <h3 style={{ marginTop: 0, marginBottom: 4, fontSize: 14 }}>Viajes por transportista (última póliza activa)</h3>
            {polizaViajes?.poliza && (
              <p style={{ margin: '0 0 10px', fontSize: 11.5, color: '#6b7280' }}>
                Póliza {polizaViajes.poliza.nombre_poliza} · {polizaViajes.poliza.total_viajes} viaje(s) en total
              </p>
            )}
            {polizaLoading ? (
              <p style={{ color: '#6b7280', fontSize: 13 }}>Cargando...</p>
            ) : polizaError ? (
              <p style={{ color: '#c1121f', fontSize: 13 }}>{polizaError}</p>
            ) : (
              <BarChart data={viajesBars} valueLabel={(v) => `${v} viaje(s)`}
                emptyMessage={polizaViajes?.mensaje || 'No existe una póliza activa para mostrar'} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
