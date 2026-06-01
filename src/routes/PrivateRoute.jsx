/**
 * PrivateRoute.jsx
 * Ruta protegida simulada: si no hay sesión activa redirige al login.
 */
import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { ROUTES } from './routePaths';

export function PrivateRoute() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.login} replace />;
  }
  return <Outlet />;
}

export default PrivateRoute;
