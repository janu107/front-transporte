/**
 * LiquidacionTabs.jsx
 * Navegación por pestañas del módulo de Liquidaciones. Se muestra en la parte
 * superior de cada pantalla del módulo para moverse entre ellas sin volver al menú.
 */
import { NavLink } from 'react-router-dom';
import { ROUTES } from '../../routes/routePaths';
import Icon from '../common/Icon';

const TABS = [
  { to: ROUTES.liquidacionGenerar, icon: 'bolt', label: 'Generar' },
  { to: ROUTES.liquidacionHistorialV2, icon: 'receipt', label: 'Historial' },
  { to: ROUTES.liquidacionRevertir, icon: 'undo', label: 'Reversión' },
  { to: ROUTES.liquidacionAbonos, icon: 'warning', label: 'Sobregiros' },
  { to: ROUTES.liquidacionReporteV2, icon: 'report', label: 'Reporte' },
  { to: ROUTES.liquidacionReporteDoc, icon: 'document', label: 'Reporte de Liquidación' },
];

export default function LiquidacionTabs() {
  return (
    <nav className="liq-tabs" aria-label="Secciones de liquidaciones">
      {TABS.map((t) => (
        <NavLink key={t.to} to={t.to}
          className={({ isActive }) => `liq-tab ${isActive ? 'active' : ''}`}>
          <Icon name={t.icon} size={18} />
          <span>{t.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
