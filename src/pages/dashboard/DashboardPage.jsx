/**
 * DashboardPage.jsx
 * Panel principal con tarjetas resumen (datos mock) y accesos rápidos.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/layout/PageHeader';
import mockApi from '../../api/mockApi';
import { ROUTES } from '../../routes/routePaths';

const STAT_DEFS = [
  { key: 'usuarios', label: 'Usuarios activos', icon: '👤', color: '#1d6fa5', filter: (i) => i.estado === 'ACTIVO' },
  { key: 'roles', label: 'Roles', icon: '🛡️', color: '#0f3d5c' },
  { key: 'transportistas', label: 'Transportistas', icon: '🧑‍✈️', color: '#0e9384' },
  { key: 'pilotos', label: 'Pilotos', icon: '🪪', color: '#14b8a6' },
  { key: 'camiones', label: 'Camiones', icon: '🚛', color: '#2563eb' },
  { key: 'polizas', label: 'Pólizas abiertas', icon: '📄', color: '#f59e0b', filter: (i) => i.estado === 'ABIERTA' },
  { key: 'anticipoProvision', label: 'Anticipos activos', icon: '💰', color: '#16a34a', filter: (i) => i.estado !== 'ANULADA' },
  { key: 'liquidaciones', label: 'Liquidaciones pendientes', icon: '✅', color: '#dc2626', filter: (i) => i.estado === 'PENDIENTE' },
];

const QUICK = [
  { label: 'Nueva póliza', icon: '📄', path: ROUTES.polizas },
  { label: 'Nuevo transportista', icon: '🧑‍✈️', path: ROUTES.transportistas },
  { label: 'Nuevo piloto', icon: '🪪', path: ROUTES.pilotos },
  { label: 'Nueva liquidación', icon: '✅', path: ROUTES.liquidaciones },
  { label: 'Catálogos', icon: '📦', path: ROUTES.productos },
  { label: 'Seguridad', icon: '🔐', path: ROUTES.usuarios },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({});

  useEffect(() => {
    (async () => {
      const entries = await Promise.all(
        STAT_DEFS.map(async (s) => {
          const list = await mockApi.list(s.key);
          const count = s.filter ? list.filter(s.filter).length : list.length;
          return [s.key, count];
        })
      );
      setStats(Object.fromEntries(entries));
    })();
  }, []);

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

      <h2 style={{ fontSize: 16, marginBottom: 12 }}>Accesos rápidos</h2>
      <div className="quick-grid">
        {QUICK.map((q) => (
          <div className="quick-card" key={q.label} onClick={() => navigate(q.path)}>
            <span className="q-icon">{q.icon}</span>
            <span>{q.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
