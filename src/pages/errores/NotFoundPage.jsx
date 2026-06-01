/**
 * NotFoundPage.jsx
 * Página 404 para rutas no encontradas.
 */
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import { ROUTES } from '../../routes/routePaths';
import useAuth from '../../hooks/useAuth';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)' }}>
      <div style={{ textAlign: 'center', padding: 30 }}>
        <div style={{ fontSize: 72, fontWeight: 800, color: 'var(--color-azul-petroleo)' }}>404</div>
        <h2 style={{ marginBottom: 8 }}>Página no encontrada</h2>
        <p className="text-muted" style={{ marginBottom: 20 }}>
          La ruta que intentas abrir no existe o fue movida.
        </p>
        <Button
          variant="primary"
          onClick={() => navigate(isAuthenticated ? ROUTES.dashboard : ROUTES.login)}
        >
          {isAuthenticated ? 'Ir al Dashboard' : 'Ir al Login'}
        </Button>
      </div>
    </div>
  );
}
