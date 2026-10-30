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

/**
 * Devuelve una fecha en formato local (AAAA-MM-DD -> DD/MM/AAAA).
 *
 * Una fecha de documento (columna DATE) es un día del calendario, no un
 * instante. El servidor la manda como "2026-07-28" o "2026-07-28T00:00:00.000Z",
 * y al pasarla por new Date se vuelve un instante que, leído en hora de
 * Guatemala (UTC-6), retrocede al día anterior: el viaje del 28 se veía 27.
 *
 * Por eso, cuando el valor NO trae una hora propia (o trae medianoche UTC
 * exacta, que es como se serializa una columna DATE), se formatea con sus
 * propios componentes y ninguna zona horaria lo mueve. Los valores con hora de
 * verdad (fecha_hora_graba y demás) siguen convirtiéndose a hora local, que es
 * lo correcto para un instante.
 */
const DIA_DE_CALENDARIO = /^(\d{4})-(\d{2})-(\d{2})(?:[T ]00:00:00(?:\.000)?Z?)?$/;

export function formatDate(value) {
  if (!value) return '-';
  const m = typeof value === 'string' ? value.match(DIA_DE_CALENDARIO) : null;
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
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
