/**
 * routePaths.js
 * Rutas internas del frontend. El prefijo /setrasa se aplica desde BrowserRouter.
 * Importar desde aqui para evitar strings magicos repartidos por la app.
 */

export const ROUTES = {
  base: '/',
  login: '/login',
  dashboard: '/dashboard',

  // Control del API (Confirmación de Vales)
  confirmacionVales: '/control-api/confirmacion-vales',

  // Seguridad
  usuarios: '/seguridad/usuarios',
  roles: '/seguridad/roles',
  usuarioRol: '/seguridad/usuario-rol',

  // Catalogos
  tipoCamion: '/catalogos/tipo-camion',
  tipoProducto: '/catalogos/tipo-producto',
  tipoAnticipoProvision: '/catalogos/tipo-anticipo-provision',
  ubicacionBomba: '/catalogos/ubicacion-bomba',
  productos: '/catalogos/productos',
  bombas: '/catalogos/bombas',
  tarifaEmbarque: '/catalogos/tarifa-embarque',

  // Configuracion
  empresas: '/configuracion/empresas',
  parametros: '/configuracion/parametros',

  // Mantenimientos
  transportistas: '/mantenimientos/transportistas',
  pilotos: '/mantenimientos/pilotos',
  camiones: '/mantenimientos/camiones',
  polizas: '/mantenimientos/polizas',
  facturasVales: '/mantenimientos/facturas-vales',

  // Procesos
  polizaDetalle: '/procesos/poliza-detalle',
  anticipoProvision: '/procesos/anticipo-provision',
  detalleFacturas: '/procesos/detalle-facturas',
  liquidaciones: '/procesos/liquidaciones',

  // Bitacoras
  bitacoras: '/bitacoras',
};

export default ROUTES;
