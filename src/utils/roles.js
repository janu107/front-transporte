/**
 * roles.js — Visibilidad del menú y de las acciones según el rol.
 *
 * Delega en la matriz de permisos (utils/permisos.js), que es el espejo de la
 * política del servidor. Antes había una lista fija de grupos por rol; con los
 * roles nuevos (OPERA_VIAJES, OPERA_VALES, OPERA_LIQUIDACION, CONSULTAS) el
 * permiso se decide submenú por submenú.
 */
import { MENU } from '../data/menuItems';
import {
  puedeVerRuta, moduloDeRuta, rolesDe,
  esSoloLectura as soloLecturaModulo,
  puedeEliminar as puedeBorrarModulo,
  puedeCrear as puedeCrearModulo,
  puedeEditar as puedeEditarModulo,
} from './permisos';

/**
 * Grupos del menú con al menos un submenú visible para el usuario.
 * @returns {string[]} títulos de grupo
 */
export function gruposPermitidos(user) {
  return MENU
    .filter((g) => g.items.some((it) => puedeVerRuta(user, it.path)))
    .map((g) => g.title);
}

/** Menú filtrado: solo los grupos e ítems que el usuario puede abrir. */
export function menuPermitido(user) {
  return MENU
    .map((g) => ({ ...g, items: g.items.filter((it) => puedeVerRuta(user, it.path)) }))
    .filter((g) => g.items.length > 0);
}

/** Rutas que el usuario puede abrir (para el guard de navegación). */
export function rutasPermitidas(user) {
  const rutas = [];
  MENU.forEach((g) => g.items.forEach((it) => {
    if (puedeVerRuta(user, it.path)) rutas.push(it.path);
  }));
  return rutas;
}

/** ¿La ruta actual es accesible para el usuario? */
export function puedeAbrir(user, ruta) {
  const modulo = moduloDeRuta(ruta);
  return modulo ? puedeVerRuta(user, ruta) || puedeVerRuta(user, ruta.split('/').slice(0, 3).join('/')) : false;
}

/**
 * ¿El usuario solo puede consultar en el módulo de esta ruta?
 * Se usa para ocultar los botones de crear / editar / eliminar.
 */
export function esSoloLectura(user, ruta) {
  return soloLecturaModulo(user, ruta ? moduloDeRuta(ruta) : null);
}

/** ¿Puede dar de alta en el módulo de esta ruta? */
export function puedeCrearEn(user, ruta) {
  const modulo = ruta ? moduloDeRuta(ruta) : null;
  return modulo ? puedeCrearModulo(user, modulo) : false;
}

/** ¿Puede modificar lo ya registrado en el módulo de esta ruta? */
export function puedeEditarEn(user, ruta) {
  const modulo = ruta ? moduloDeRuta(ruta) : null;
  return modulo ? puedeEditarModulo(user, modulo) : false;
}

/** ¿Puede eliminar en el módulo de esta ruta? (solo ADMIN) */
export function puedeEliminar(user, ruta) {
  return puedeBorrarModulo(user, ruta ? moduloDeRuta(ruta) : null);
}

export { rolesDe };
export { esAdmin, puedeEditarPeso } from './permisos';
