/**
 * PrivateLayout.jsx
 * Layout para las rutas privadas: envuelve el AppLayout (sidebar + header + contenido).
 * El contenido de cada página se renderiza vía <Outlet/> dentro de AppLayout.
 *
 * [v8] Guard por rol: si el usuario intenta entrar (por URL directa) a una ruta que
 * su rol no tiene permitida, se le redirige al Dashboard. La API además valida el
 * rol en el backend, así que esto es solo para la experiencia de navegación.
 */
import { Navigate, useLocation } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import useAuth from '../hooks/useAuth';
import { rutasPermitidas } from '../utils/roles';
import { ROUTES } from '../routes/routePaths';

export function PrivateLayout() {
  const { user } = useAuth();
  const location = useLocation();
  // Rutas que el rol puede abrir, según la matriz de permisos. El servidor
  // valida igual; esto solo evita mostrar una pantalla que daría 403.
  const permitidas = rutasPermitidas(user);
  const path = location.pathname;
  const ok = path === ROUTES.dashboard
    || permitidas.some((p) => path === p || path.startsWith(`${p}/`));

  if (!ok) return <Navigate to={ROUTES.dashboard} replace />;

  return <AppLayout />;
}

export default PrivateLayout;
