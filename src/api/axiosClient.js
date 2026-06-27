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
import logger from '../utils/logger';

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

function requestId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function fullUrl(config) {
  const base = (config.baseURL || '').replace(/\/+$/, '');
  const path = config.url || '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${base}/${path.replace(/^\/+/, '')}`;
}

// Interceptor de petición: adjunta el token (mock o real) si existe.
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('transporte_token');
    const id = requestId();
    config.metadata = { requestId: id, startedAt: performance.now() };
    config.headers['X-Request-Id'] = id;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    logger.info('HTTP solicitud enviada', {
      requestId: id,
      method: config.method?.toUpperCase(),
      url: fullUrl(config),
      query: config.params,
      payloadKeys: config.data && typeof config.data === 'object'
        ? Object.keys(config.data)
        : undefined,
    });
    return config;
  },
  (error) => {
    logger.error('No se pudo preparar la solicitud HTTP', { error });
    return Promise.reject(error);
  }
);

// Interceptor de respuesta: manejo centralizado de errores comunes.
axiosClient.interceptors.response.use(
  (response) => {
    const startedAt = response.config.metadata?.startedAt;
    logger.info('HTTP respuesta recibida', {
      requestId: response.headers['x-request-id'] || response.config.metadata?.requestId,
      method: response.config.method?.toUpperCase(),
      url: fullUrl(response.config),
      status: response.status,
      durationMs: startedAt ? Number((performance.now() - startedAt).toFixed(2)) : undefined,
    });
    return response;
  },
  (error) => {
    const config = error.config || {};
    const startedAt = config.metadata?.startedAt;
    const status = error.response?.status;
    const isTimeout = error.code === 'ECONNABORTED';
    const isNetworkError = !error.response;
    let userMessage = error.response?.data?.message;

    if (!userMessage && isTimeout) {
      userMessage = `La API tardó más de ${axiosClient.defaults.timeout / 1000} segundos en responder.`;
    } else if (!userMessage && isNetworkError) {
      userMessage = `No se pudo conectar con la API en ${API_BASE_URL}. Verifica que el backend esté encendido.`;
    } else if (!userMessage) {
      userMessage = error.message || 'Error inesperado al consultar la API.';
    }

    error.userMessage = userMessage;
    error.message = userMessage;

    logger.error('HTTP solicitud fallida', {
      requestId: error.response?.headers?.['x-request-id'] || config.metadata?.requestId,
      method: config.method?.toUpperCase(),
      url: fullUrl(config),
      status,
      code: error.code,
      durationMs: startedAt ? Number((performance.now() - startedAt).toFixed(2)) : undefined,
      responseMessage: error.response?.data?.message,
      error,
    });

    if (status === 401) {
      logger.warn('La API rechazó la autenticación', {
        requestId: config.metadata?.requestId,
        url: fullUrl(config),
      });
      // TODO (Fase backend): redirigir a login / refrescar token.
      // localStorage.removeItem('transporte_token');
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
