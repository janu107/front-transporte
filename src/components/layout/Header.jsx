/**
 * Header.jsx
 * Barra superior: botón hamburguesa (móvil), título de la sección actual,
 * breadcrumb, datos del usuario y botón de cerrar sesión.
 */
import { useLocation, useNavigate } from 'react-router-dom';
import { MENU } from '../../data/menuItems';
import useAuth from '../../hooks/useAuth';
import { ROUTES } from '../../routes/routePaths';
import { initials } from '../../utils/formatters';
import Icon from '../common/Icon';

function findSection(pathname) {
  for (const group of MENU) {
    const item = group.items.find((i) => i.path === pathname);
    if (item) return { group: group.title, label: item.label };
  }
  return { group: 'Principal', label: 'Inicio' };
}

export function Header({ sidebarOpen, onToggleSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const section = findSection(location.pathname);

  const handleLogout = () => {
    logout();
    navigate(ROUTES.login, { replace: true });
  };

  return (
    <header className="header">
      <div className="header-left">
        <button type="button" className="hamburger" onClick={onToggleSidebar} aria-label="Abrir menú" aria-expanded={sidebarOpen} aria-controls={sidebarOpen ? 'app-sidebar' : undefined}>
          <Icon name="menu" size={22} />
        </button>
        <div>
          <div className="header-title">{section.label}</div>
          <div className="header-breadcrumb">
            {section.group}<Icon name="chevron" size={14} />{section.label}
          </div>
        </div>
      </div>

      <div className="header-user">
        <div className="user-info">
          <div className="user-name">{user?.nombre || 'Usuario'}</div>
          <div className="user-role">{user?.rol || '-'}</div>
        </div>
        <div className="user-avatar">{initials(user?.nombre || 'U')}</div>
        <button type="button" className="btn btn-ghost btn-sm logout-button" onClick={handleLogout} title="Cerrar sesión" aria-label="Cerrar sesión">
          <Icon name="logout" size={18} /><span>Salir</span>
        </button>
      </div>
    </header>
  );
}

export default Header;
