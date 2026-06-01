/**
 * PrivateLayout.jsx
 * Layout para las rutas privadas: envuelve el AppLayout (sidebar + header + contenido).
 * El contenido de cada página se renderiza vía <Outlet/> dentro de AppLayout.
 */
import AppLayout from '../components/layout/AppLayout';

export function PrivateLayout() {
  return <AppLayout />;
}

export default PrivateLayout;
