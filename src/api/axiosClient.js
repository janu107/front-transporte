/**
 * axiosClient.js
 * Cliente HTTP basado en Axios, preparado para conectarse al backend real
 * en la siguiente fase. Incluye interceptores para token e errores.
 *
 * En la fase actual NO se usa para los CRUD (se utiliza mockApi.js), pero queda
 * completamente configurado y listo para reemplazar al mock.
 */
import axios from 'axios';
import { API_BASE_URL } from './endpoints';

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Interceptor de petición: adjunta el token (mock o real) si existe.
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('transporte_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de respuesta: manejo centralizado de errores comunes.
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // TODO (Fase backend): redirigir a login / refrescar token.
      // localStorage.removeItem('transporte_token');
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
