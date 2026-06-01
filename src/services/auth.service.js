/**
 * auth.service.js
 * Servicio de autenticación SIMULADA para la fase visual.
 * Valida contra credenciales mock y persiste un token/usuario en localStorage.
 *
 * En la fase backend, este servicio llamará a axiosClient sobre ENDPOINTS.auth.*
 * (ver api/axiosClient.js y api/endpoints.js).
 */
import { MOCK_CREDENTIALS } from '../utils/constants';

const TOKEN_KEY = 'transporte_token';
const USER_KEY = 'transporte_user';

const MOCK_USER = {
  nombre: 'Administrador',
  usuario: 'admin',
  rol: 'ADMIN',
};

export const authService = {
  /** Inicia sesión validando credenciales simuladas. */
  async login({ usuario, password }) {
    await new Promise((r) => setTimeout(r, 300));
    if (usuario === MOCK_CREDENTIALS.usuario && password === MOCK_CREDENTIALS.password) {
      const token = `mock-token-${Date.now()}`;
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(MOCK_USER));
      return { token, user: MOCK_USER };
    }
    throw new Error('Usuario o contraseña incorrectos.');
  },

  /** Cierra la sesión simulada. */
  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  /** Indica si hay una sesión activa. */
  isAuthenticated() {
    return Boolean(localStorage.getItem(TOKEN_KEY));
  },

  /** Devuelve el usuario actual desde localStorage. */
  getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY));
    } catch {
      return null;
    }
  },

  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },
};

export default authService;
