/**
 * auth.service.js
 * Servicio de autenticación real contra el backend (POST /api/auth/login).
 * Persiste token y usuario en localStorage; el token se adjunta en cada
 * petición vía axiosClient (interceptor).
 */
import axiosClient from '../api/axiosClient';
import { ENDPOINTS } from '../api/endpoints';

const TOKEN_KEY = 'transporte_token';
const USER_KEY = 'transporte_user';

export const authService = {
  /** Inicia sesión. Recibe { usuario, password } desde la pantalla de login. */
  async login({ usuario, password }) {
    const resp = await axiosClient.post(ENDPOINTS.auth.login, {
      usuario,
      contrasena: password,
    });
    const payload = resp.data?.data || {};
    const { token, user } = payload;
    if (!token) throw new Error('Respuesta de login inválida del servidor.');

    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return { token, user };
  },

  /** Cierra la sesión (borra credenciales locales; notifica al backend de forma opcional). */
  async logout() {
    try {
      await axiosClient.post(ENDPOINTS.auth.logout);
    } catch {
      /* logout es local con JWT sin estado */
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  isAuthenticated() {
    return Boolean(localStorage.getItem(TOKEN_KEY));
  },

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
