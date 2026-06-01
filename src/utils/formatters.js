/**
 * formatters.js
 * Utilidades de formato para mostrar datos en tablas y formularios.
 */

/** Formatea un número como moneda (Quetzales por defecto). */
export function formatCurrency(value, currency = 'GTQ') {
  const n = Number(value);
  if (Number.isNaN(n)) return '-';
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(n);
}

/** Formatea un número con separador de miles. */
export function formatNumber(value, decimals = 2) {
  const n = Number(value);
  if (Number.isNaN(n)) return '-';
  return new Intl.NumberFormat('es-GT', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}

/** Devuelve una fecha en formato local (YYYY-MM-DD -> DD/MM/YYYY). */
export function formatDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('es-GT', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

/** Devuelve fecha y hora local. */
export function formatDateTime(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('es-GT', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Iniciales de un nombre, para avatares. */
export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

/** Resuelve la descripción de un registro relacionado por id. */
export function lookup(list, id, key = 'codigo', label = 'descripcion') {
  const found = (list || []).find((it) => String(it[key]) === String(id));
  return found ? found[label] : '-';
}
