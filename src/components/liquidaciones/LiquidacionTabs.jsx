/**
 * LiquidacionTabs.jsx
 * Navegación por pestañas del módulo de Liquidaciones. Se muestra en la parte
 * superior de cada pantalla del módulo para moverse entre ellas sin volver al menú.
 */
import { NavLink } from 'react-router-dom';
import { ROUTES } from '../../routes/routePaths';

const TABS = [
  { to: ROUTES.liquidacionGenerar, icon: '⚡', label: 'Generar' },
  { to: ROUTES.liquidacionHistorialV2, icon: '📋', label: 'Historial' },
  { to: ROUTES.liquidacionRevertir, icon: '↩️', label: 'Reversión' },
  { to: ROUTES.liquidacionAbonos, icon: '⚠️', label: 'Sobregiros' },
  { to: ROUTES.liquidacionReporteV2, icon: '📊', label: 'Reporte' },
  { to: ROUTES.liquidacionReporteDoc, icon: '📄', label: 'Reporte de Liquidación' },
];

export default function LiquidacionTabs() {
  return (
    <nav className="liq-tabs" aria-label="Secciones de liquidaciones">
      {TABS.map((t) => (
        <NavLink key={t.to} to={t.to}
          className={({ isActive }) => `liq-tab ${isActive ? 'active' : ''}`}>
          <span aria-hidden="true">{t.icon}</span>
          <span>{t.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
