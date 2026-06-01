/**
 * Sidebar.jsx
 * Menú lateral agrupado por módulos. Resalta la ruta activa y navega con React Router.
 * En móvil se muestra como drawer controlado por `open`.
 */
import { NavLink } from 'react-router-dom';
import { MENU } from '../../data/menuItems';
import { APP_NAME } from '../../utils/constants';

export function Sidebar({ open, onNavigate }) {
  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="sidebar-brand">
        <img src="/logo.svg" alt="Logo" />
        <div className="brand-text">
          APP Transporte
          <span>{APP_NAME}</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {MENU.map((group) => (
          <div key={group.title}>
            <div className="nav-group-title">{group.title}</div>
            {group.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onNavigate}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
