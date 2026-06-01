/**
 * LoginPage.jsx
 * Pantalla de login visual con autenticación simulada (localStorage).
 * Credenciales: admin / Admin123!
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { ROUTES } from '../../routes/routePaths';
import { APP_NAME } from '../../utils/constants';
import { isEmpty } from '../../utils/validators';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [values, setValues] = useState({ usuario: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const setField = (name, value) => {
    setValues((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: undefined }));
    setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (isEmpty(values.usuario)) newErrors.usuario = 'El usuario es obligatorio';
    if (isEmpty(values.password)) newErrors.password = 'La contraseña es obligatoria';
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await login(values);
      navigate(ROUTES.dashboard, { replace: true });
    } catch (err) {
      setServerError(err.message || 'No se pudo iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-logo">
          <img src="/logo.svg" alt="Logo transporte" />
          <h1>{APP_NAME}</h1>
          <p>Ingrese sus credenciales para continuar</p>
        </div>

        {serverError && <div className="alert alert-error">{serverError}</div>}

        <Input
          label="Usuario"
          name="usuario"
          value={values.usuario}
          onChange={(e) => setField('usuario', e.target.value)}
          error={errors.usuario}
          placeholder="admin"
          autoFocus
        />
        <Input
          label="Contraseña"
          name="password"
          type="password"
          value={values.password}
          onChange={(e) => setField('password', e.target.value)}
          error={errors.password}
          placeholder="••••••••"
        />

        <Button type="submit" variant="primary" block disabled={loading}>
          {loading ? 'Ingresando...' : 'Ingresar'}
        </Button>

        <div className="login-hint">
          Credenciales de prueba: <strong>admin</strong> / <strong>Admin123!</strong>
        </div>
        <div className="login-footer">© {new Date().getFullYear()} APP Transporte</div>
      </form>
    </div>
  );
}
