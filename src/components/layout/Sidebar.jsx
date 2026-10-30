/**
 * Sidebar.jsx
 * Menú lateral agrupado por módulos. Resalta la ruta activa y navega con React Router.
 * [v7 §3] Cada grupo es desplegable: se contrae/expande al hacer clic en su título.
 * En móvil se muestra como drawer controlado por `open`.
 */
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { menuPermitido } from '../../utils/roles';
import Logo from '../common/Logo';
import Icon from '../common/Icon';

export function Sidebar({ onNavigate, onClose }) {
  const { user } = useAuth();
  // Menú filtrado por la matriz de permisos: se ocultan los submenús que el rol
  // no puede abrir y los grupos que quedan sin opciones.
  const grupos = menuPermitido(user);

  // Conjunto de grupos contraídos (por título). Por defecto todos expandidos.
  const [colapsados, setColapsados] = useState(() => new Set());

  const toggle = (title) => setColapsados((prev) => {
    const next = new Set(prev);
    if (next.has(title)) next.delete(title); else next.add(title);
    return next;
  });

  return (
    <aside id="app-sidebar" className="sidebar" aria-label="Menú principal">
      <div className="sidebar-brand">
        <Logo className="sidebar-logo" />
        <div className="brand-text">
          SETRASA
          <span>Gestión de transporte</span>
        </div>
        {onClose && <button className="sidebar-close" type="button" onClick={onClose} aria-label="Cerrar menú"><Icon name="close" /></button>}
      </div>

      <nav className="sidebar-nav" aria-label="Módulos">
        {grupos.map((group, index) => {
          const items = group.items; // ya vienen filtrados por permisos
          const colapsado = colapsados.has(group.title);
          return (
            <div key={group.title} className="nav-group">
              <button
                type="button"
                className="nav-group-title"
                onClick={() => toggle(group.title)}
                aria-expanded={!colapsado}
                aria-controls={`nav-group-${index}`}
                title={colapsado ? 'Desplegar' : 'Contraer'}
              >
                <span>{group.title}</span>
                <Icon name="expand" size={16} className={colapsado ? 'group-chevron collapsed' : 'group-chevron'} />
              </button>
              <div id={`nav-group-${index}`} hidden={colapsado}>
              {items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  title={item.label}
                  onClick={onNavigate}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  <Icon className="nav-icon" name={item.icon} size={20} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

export default Sidebar;
