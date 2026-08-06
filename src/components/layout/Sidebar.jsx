/**
 * Sidebar.jsx
 * Menú lateral agrupado por módulos. Resalta la ruta activa y navega con React Router.
 * [v7 §3] Cada grupo es desplegable: se contrae/expande al hacer clic en su título.
 * En móvil se muestra como drawer controlado por `open`.
 */
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { MENU } from '../../data/menuItems';
import { APP_NAME } from '../../utils/constants';
import useAuth from '../../hooks/useAuth';
import { gruposPermitidos } from '../../utils/roles';
import Logo from '../common/Logo';

const tituloBtn = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
  background: 'none', border: 'none', cursor: 'pointer', font: 'inherit', color: 'inherit', textAlign: 'left',
};

export function Sidebar({ open, onNavigate }) {
  const { user } = useAuth();
  const rol = String(user?.rol || '').toUpperCase();
  // [v8 §8] Grupos visibles según el rol (ADMIN ve todo).
  const permitidos = gruposPermitidos(user?.rol); // null => ADMIN / sin restricción
  const grupos = permitidos ? MENU.filter((g) => permitidos.includes(g.title)) : MENU;

  // Conjunto de grupos contraídos (por título). Por defecto todos expandidos.
  const [colapsados, setColapsados] = useState(() => new Set());

  const toggle = (title) => setColapsados((prev) => {
    const next = new Set(prev);
    if (next.has(title)) next.delete(title); else next.add(title);
    return next;
  });

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="sidebar-brand">
        <Logo height={38} />
        <div className="brand-text">
          SETRASA
          <span>{APP_NAME}</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {grupos.map((group) => {
          const items = group.items.filter((item) => !item.roles || item.roles.includes(rol));
          if (!items.length) return null;
          const colapsado = colapsados.has(group.title);
          return (
            <div key={group.title} className="nav-group">
              <button
                type="button"
                className="nav-group-title"
                style={tituloBtn}
                onClick={() => toggle(group.title)}
                aria-expanded={!colapsado}
                title={colapsado ? 'Desplegar' : 'Contraer'}
              >
                <span>{group.title}</span>
                <span style={{ fontSize: 10, transition: 'transform .15s', transform: colapsado ? 'rotate(-90deg)' : 'none' }}>▾</span>
              </button>
              {!colapsado && items.map((item) => (
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
          );
        })}
      </nav>
    </aside>
  );
}

export default Sidebar;
