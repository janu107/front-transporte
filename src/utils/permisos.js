/**
 * permisos.js — Matriz de permisos por rol (espejo de la del backend).
 *
 * Sirve ÚNICAMENTE para la interfaz: ocultar del menú lo que el rol no puede
 * abrir y deshabilitar los botones de crear/editar/eliminar. La validación real
 * está en el servidor (back-transporte/src/config/permisos.js); si ambas se
 * desincronizan, manda el servidor y la pantalla mostrará un 403.
 *
 * Roles:
 *   ADMIN              consulta, crea, edita y elimina en todo el sistema
 *   OPERA_VIAJES       consulta, crea y edita (cartas de porte y viajes locales)
 *   OPERA_VALES        consulta, crea y edita (vales de diesel y anticipos)
 *   OPERA_LIQUIDACION  consulta, crea y edita (liquidación de pólizas)
 *   CONSULTAS          solo consulta
 *
 * Un usuario puede tener varios roles: los permisos se suman.
 */
import { ROUTES } from '../routes/routePaths';

export const OPERACIONES_POR_ROL = {
  ADMIN: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
  OPERA_VIAJES: ['SELECT', 'INSERT', 'UPDATE'],
  OPERA_VALES: ['SELECT', 'INSERT', 'UPDATE'],
  OPERA_LIQUIDACION: ['SELECT', 'INSERT', 'UPDATE'],
  CONSULTAS: ['SELECT'],
};

const TODOS = ['ADMIN', 'OPERA_VIAJES', 'OPERA_VALES', 'OPERA_LIQUIDACION', 'CONSULTAS'];

/** Roles con acceso a cada módulo (una entrada por submenú). */
export const MODULOS = {
  confirmacionApi: ['ADMIN', 'OPERA_VALES'],

  usuarios: ['ADMIN'],
  roles: ['ADMIN'],
  usuarioRol: ['ADMIN'],

  tipoCamion: ['ADMIN', 'OPERA_VIAJES', 'OPERA_VALES', 'CONSULTAS'],
  tipoProducto: ['ADMIN', 'OPERA_VIAJES', 'OPERA_VALES', 'CONSULTAS'],
  tipoAnticipo: ['ADMIN', 'OPERA_VIAJES', 'OPERA_VALES', 'CONSULTAS'],
  ubicacionBomba: ['ADMIN', 'OPERA_VIAJES', 'OPERA_VALES', 'CONSULTAS'],
  productos: ['ADMIN', 'OPERA_VIAJES', 'OPERA_VALES', 'CONSULTAS'],
  bombas: ['ADMIN', 'OPERA_VIAJES', 'OPERA_VALES', 'CONSULTAS'],
  // Todos leen las tarifas (el registro de viajes las necesita); solo ADMIN edita.
  tarifaEmbarque: TODOS,

  empresas: ['ADMIN'],
  parametros: ['ADMIN'],

  transportistas: TODOS,
  pilotos: ['ADMIN', 'OPERA_VIAJES', 'OPERA_VALES', 'CONSULTAS'],
  camiones: ['ADMIN', 'OPERA_VIAJES', 'OPERA_VALES', 'CONSULTAS'],
  polizas: TODOS,
  facturas: ['ADMIN', 'OPERA_LIQUIDACION'],

  detallePolizas: ['ADMIN', 'OPERA_VIAJES', 'OPERA_VALES', 'CONSULTAS'],
  // Corregir el peso de un envío (y recalcular su valor) es una operación
  // acotada: la tienen los roles que registran y liquidan viajes, aunque no
  // puedan editar el resto del envío.
  detallePolizasPeso: ['ADMIN', 'OPERA_VIAJES', 'OPERA_LIQUIDACION'],
  anticipos: ['ADMIN', 'OPERA_VIAJES', 'OPERA_VALES', 'CONSULTAS'],
  detalleFacturas: ['ADMIN', 'OPERA_VALES', 'CONSULTAS'],

  liquidacionGeneracion: ['ADMIN', 'OPERA_LIQUIDACION'],
  // La reversión de liquidaciones es exclusiva de ADMIN.
  liquidacionReversion: ['ADMIN'],
  liquidacionHistorial: ['ADMIN', 'OPERA_LIQUIDACION'],
  liquidacionSobregiros: ['ADMIN', 'OPERA_LIQUIDACION'],

  reporteLiquidacion: ['ADMIN', 'OPERA_LIQUIDACION'],
  reporteDiesel: ['ADMIN', 'OPERA_VALES', 'OPERA_LIQUIDACION', 'CONSULTAS'],
  arrastreDiesel: ['ADMIN', 'OPERA_VALES', 'OPERA_LIQUIDACION', 'CONSULTAS'],
  arrastrePolizas: TODOS,
  viajesPorPoliza: TODOS,
  polizasPendientes: TODOS,
  anticiposTransportistas: ['ADMIN', 'OPERA_VIAJES', 'OPERA_VALES', 'CONSULTAS'],

  bitacoras: ['ADMIN'],
  historial: ['ADMIN', 'CONSULTAS'],

  dashboard: TODOS,
};

/** Ruta del menú -> módulo de la matriz. */
export const MODULO_POR_RUTA = {
  [ROUTES.dashboard]: 'dashboard',
  [ROUTES.confirmacionVales]: 'confirmacionApi',

  [ROUTES.usuarios]: 'usuarios',
  [ROUTES.roles]: 'roles',
  [ROUTES.usuarioRol]: 'usuarioRol',

  [ROUTES.tipoCamion]: 'tipoCamion',
  [ROUTES.tipoProducto]: 'tipoProducto',
  [ROUTES.tipoAnticipoProvision]: 'tipoAnticipo',
  [ROUTES.ubicacionBomba]: 'ubicacionBomba',
  [ROUTES.productos]: 'productos',
  [ROUTES.bombas]: 'bombas',
  [ROUTES.tarifaEmbarque]: 'tarifaEmbarque',

  [ROUTES.empresas]: 'empresas',
  [ROUTES.parametros]: 'parametros',

  [ROUTES.transportistas]: 'transportistas',
  [ROUTES.pilotos]: 'pilotos',
  [ROUTES.camiones]: 'camiones',
  [ROUTES.polizas]: 'polizas',
  [ROUTES.facturasVales]: 'facturas',

  [ROUTES.polizaDetalle]: 'detallePolizas',
  [ROUTES.anticipoProvision]: 'anticipos',
  [ROUTES.detalleFacturas]: 'detalleFacturas',
  [ROUTES.liquidaciones]: 'liquidacionHistorial',
  [ROUTES.historialLiquidaciones]: 'liquidacionHistorial',
  [ROUTES.descuentoAceite]: 'liquidacionGeneracion',
  [ROUTES.descuentoAdministrativo]: 'liquidacionGeneracion',

  [ROUTES.liquidacionGenerar]: 'liquidacionGeneracion',
  [ROUTES.liquidacionRevertir]: 'liquidacionReversion',
  [ROUTES.liquidacionHistorialV2]: 'liquidacionHistorial',
  [ROUTES.liquidacionAbonos]: 'liquidacionSobregiros',
  [ROUTES.liquidacionReporteV2]: 'reporteLiquidacion',
  [ROUTES.liquidacionReporteDoc]: 'reporteLiquidacion',

  [ROUTES.reporteDiesel]: 'reporteDiesel',
  [ROUTES.reporteArrastreDiesel]: 'arrastreDiesel',
  [ROUTES.reporteArrastrePolizas]: 'arrastrePolizas',
  [ROUTES.reporteViajesPoliza]: 'viajesPorPoliza',
  [ROUTES.reportePolizasPendientes]: 'polizasPendientes',
  [ROUTES.reporteAnticiposPoliza]: 'anticiposTransportistas',

  [ROUTES.bitacoras]: 'bitacoras',
  [ROUTES.historial]: 'historial',
};

/**
 * Restricciones extra para los roles NO administradores (espejo del backend).
 *   registrar -> consultan y dan de alta, pero no modifican ni anulan: en la
 *                lista solo les queda «imprimir».
 *   consultar -> solo lectura, sin acciones sobre los registros.
 */
export const RESTRICCION_NO_ADMIN = {
  detallePolizas: 'registrar',
  anticipos: 'registrar',
  detalleFacturas: 'registrar',
  polizas: 'consultar',
  tarifaEmbarque: 'consultar',
};

const OPS_RESTRINGIDAS = {
  registrar: ['SELECT', 'INSERT'],
  consultar: ['SELECT'],
};

/** Operaciones efectivas de un rol dentro de un módulo. */
function operacionesEn(rol, modulo) {
  const base = OPERACIONES_POR_ROL[rol] || [];
  if (rol === 'ADMIN') return base;
  const restriccion = RESTRICCION_NO_ADMIN[modulo];
  if (!restriccion) return base;
  const permitidas = OPS_RESTRINGIDAS[restriccion] || [];
  return base.filter((op) => permitidas.includes(op));
}

/** Roles del usuario, en mayúsculas (acepta `roles` o el `rol` único). */
export function rolesDe(user) {
  if (!user) return [];
  const lista = Array.isArray(user.roles) && user.roles.length ? user.roles : [user.rol];
  return lista.filter(Boolean).map((r) => String(r).toUpperCase());
}

/** ¿Puede abrir el módulo? */
export function puedeVer(user, modulo) {
  const permitidos = MODULOS[modulo];
  if (!permitidos) return false;
  return rolesDe(user).some((r) => permitidos.includes(r));
}

/** ¿Puede ejecutar la operación en el módulo? (mismo rol debe cumplir ambas) */
export function puedeOperar(user, modulo, operacion) {
  const permitidos = MODULOS[modulo];
  if (!permitidos) return false;
  const op = String(operacion || 'SELECT').toUpperCase();
  return rolesDe(user).some(
    (r) => permitidos.includes(r) && operacionesEn(r, modulo).includes(op)
  );
}

/** ¿Es ADMIN? (control total: editar, anular y eliminar en cualquier módulo) */
export function esAdmin(user) {
  return rolesDe(user).includes('ADMIN');
}

/** ¿Puede abrir esta ruta del menú? */
export function puedeVerRuta(user, ruta) {
  const modulo = MODULO_POR_RUTA[ruta];
  if (!modulo) return false;
  return puedeVer(user, modulo);
}

/** Módulo al que pertenece una ruta (para saber qué permisos aplicar). */
export function moduloDeRuta(ruta) {
  if (MODULO_POR_RUTA[ruta]) return MODULO_POR_RUTA[ruta];
  // Rutas con parámetros: se busca el prefijo más largo que coincida.
  const claves = Object.keys(MODULO_POR_RUTA)
    .filter((p) => ruta === p || ruta.startsWith(`${p}/`))
    .sort((a, b) => b.length - a.length);
  return claves.length ? MODULO_POR_RUTA[claves[0]] : null;
}

/** ¿El usuario solo puede consultar en este módulo? (oculta crear/editar) */
export function esSoloLectura(user, modulo) {
  if (!modulo) return !puedeOperarAlgo(user, 'INSERT');
  return !puedeOperar(user, modulo, 'INSERT') && !puedeOperar(user, modulo, 'UPDATE');
}

/** ¿Puede corregir el peso de un envío? (ADMIN, OPERA_VIAJES y OPERA_LIQUIDACION) */
export function puedeEditarPeso(user) {
  return puedeOperar(user, 'detallePolizasPeso', 'UPDATE');
}

/** ¿Puede eliminar en el módulo? (solo ADMIN, según la matriz) */
export function puedeEliminar(user, modulo) {
  return puedeOperar(user, modulo, 'DELETE');
}

/** Auxiliar: ¿tiene la operación en algún módulo? */
function puedeOperarAlgo(user, operacion) {
  const op = String(operacion).toUpperCase();
  return rolesDe(user).some((r) => (OPERACIONES_POR_ROL[r] || []).includes(op));
}

export default { MODULOS, MODULO_POR_RUTA, puedeVer, puedeOperar, puedeVerRuta, esSoloLectura };
