/**
 * App.jsx
 * Componente raíz: provee el router y el contexto de autenticación.
 */
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename="/setrasa">
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
