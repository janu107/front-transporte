/**
 * roles.js — [v8] Reglas de visibilidad/acceso por rol (frontend).
 * Debe coincidir con la política del backend (index.routes.js):
 *   ADMIN     -> todo
 *   OPERADOR  -> Principal + Catálogos + Procesos
 *   CONSULTOR -> Principal + Catálogos (solo lectura)
 */
import { MENU } from '../data/menuItems';

export const GRUPOS_POR_ROL = {
  OPERADOR: ['Principal', 'Catálogos', 'Procesos'],
  CONSULTOR: ['Principal', 'Catálogos'],
};

/** Títulos de grupos de menú permitidos para el rol; null = todos (ADMIN). */
export function gruposPermitidos(rol) {
  const r = String(rol || '').toUpperCase();
  return GRUPOS_POR_ROL[r] || null;
}

/** Rutas (paths) permitidas para el rol; null = todas (ADMIN). */
export function rutasPermitidas(rol) {
  const permitidos = gruposPermitidos(rol);
  if (!permitidos) return null;
  const rutas = [];
  MENU.forEach((g) => {
    if (permitidos.includes(g.title)) g.items.forEach((it) => rutas.push(it.path));
  });
  return rutas;
}

/** True si el rol es de solo consulta (no puede crear/editar/eliminar). */
export function esSoloLectura(rol) {
  return String(rol || '').toUpperCase() === 'CONSULTOR';
}
