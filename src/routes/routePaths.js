/**
 * routePaths.js
 * Rutas centralizadas del frontend. Todas cuelgan del prefijo base /transporte.
 * Importar desde aquí para evitar strings mágicos repartidos por la app.
 */

export const BASE = '/transporte';

export const ROUTES = {
  base: BASE,
  login: `${BASE}/login`,
  dashboard: `${BASE}/dashboard`,

  // Seguridad
  usuarios: `${BASE}/seguridad/usuarios`,
  roles: `${BASE}/seguridad/roles`,
  usuarioRol: `${BASE}/seguridad/usuario-rol`,

  // Catálogos
  tipoCamion: `${BASE}/catalogos/tipo-camion`,
  tipoProducto: `${BASE}/catalogos/tipo-producto`,
  tipoAnticipoProvision: `${BASE}/catalogos/tipo-anticipo-provision`,
  ubicacionBomba: `${BASE}/catalogos/ubicacion-bomba`,
  productos: `${BASE}/catalogos/productos`,
  bombas: `${BASE}/catalogos/bombas`,
  tarifaEmbarque: `${BASE}/catalogos/tarifa-embarque`,

  // Configuración
  empresas: `${BASE}/configuracion/empresas`,
  parametros: `${BASE}/configuracion/parametros`,

  // Mantenimientos
  transportistas: `${BASE}/mantenimientos/transportistas`,
  pilotos: `${BASE}/mantenimientos/pilotos`,
  camiones: `${BASE}/mantenimientos/camiones`,
  polizas: `${BASE}/mantenimientos/polizas`,
  facturasVales: `${BASE}/mantenimientos/facturas-vales`,

  // Procesos
  polizaDetalle: `${BASE}/procesos/poliza-detalle`,
  anticipoProvision: `${BASE}/procesos/anticipo-provision`,
  detalleFacturas: `${BASE}/procesos/detalle-facturas`,
  liquidaciones: `${BASE}/procesos/liquidaciones`,

  // Bitácoras
  bitacoras: `${BASE}/bitacoras`,
};

export default ROUTES;
