/**
 * Logger del frontend. Conserva las últimas 300 entradas en
 * window.__TRANSPORTE_LOGS__ para facilitar el diagnóstico desde DevTools.
 */
const MAX_ENTRIES = 300;
const SENSITIVE_KEYS = /authorization|cookie|password|contrasena|token|secret/i;

function sanitize(value, seen = new WeakSet()) {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      code: value.code,
      stack: value.stack,
    };
  }
  if (Array.isArray(value)) return value.map((item) => sanitize(item, seen));
  if (!value || typeof value !== 'object') return value;
  if (seen.has(value)) return '[Circular]';

  seen.add(value);
  const clean = {};
  Object.entries(value).forEach(([key, item]) => {
    clean[key] = SENSITIVE_KEYS.test(key) ? '[REDACTED]' : sanitize(item, seen);
  });
  seen.delete(value);
  return clean;
}

function write(level, message, details) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    details: sanitize(details),
  };

  if (typeof window !== 'undefined') {
    window.__TRANSPORTE_LOGS__ = window.__TRANSPORTE_LOGS__ || [];
    window.__TRANSPORTE_LOGS__.push(entry);
    if (window.__TRANSPORTE_LOGS__.length > MAX_ENTRIES) {
      window.__TRANSPORTE_LOGS__.splice(0, window.__TRANSPORTE_LOGS__.length - MAX_ENTRIES);
    }
  }

  const method = level === 'error' ? 'error' : level === 'warn' ? 'warn' : level === 'debug' ? 'debug' : 'info';
  console[method](`[${entry.timestamp}] [${level.toUpperCase()}] ${message}`, entry.details || '');
}

const logger = {
  debug: (message, details) => {
    if (import.meta.env.DEV) write('debug', message, details);
  },
  info: (message, details) => write('info', message, details),
  warn: (message, details) => write('warn', message, details),
  error: (message, details) => write('error', message, details),
};

export default logger;
