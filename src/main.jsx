/**
 * main.jsx
 * Punto de entrada de la aplicación React. Monta <App/> y carga los estilos globales.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { API_BASE_URL } from './api/endpoints';
import logger from './utils/logger';

import './styles/global.css';
import './styles/layout.css';
import './styles/tables.css';
import './styles/forms.css';

window.addEventListener('error', (event) => {
  logger.error('Error global de JavaScript', {
    message: event.message,
    source: event.filename,
    line: event.lineno,
    column: event.colno,
    error: event.error,
  });
});

window.addEventListener('unhandledrejection', (event) => {
  logger.error('Promesa rechazada sin manejar', { error: event.reason });
});

logger.info('Frontend iniciado', {
  mode: import.meta.env.MODE,
  apiBaseUrl: API_BASE_URL,
  baseUrl: import.meta.env.BASE_URL,
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
