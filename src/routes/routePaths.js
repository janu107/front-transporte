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
  historialLiquidaciones: '/procesos/historial-liquidaciones',
  descuentoAceite: '/procesos/descuento-aceite',
  descuentoAdministrativo: '/procesos/descuento-administrativo',

  // Módulo de Liquidaciones v2
  liquidacionGenerar: '/liquidaciones/generacion',
  liquidacionRevertir: '/liquidaciones/reversion',
  liquidacionHistorialV2: '/liquidaciones/historial',
  liquidacionAbonos: '/liquidaciones/abonos-sobregiros',
  liquidacionReporteV2: '/liquidaciones/reporte',

  // Reportes
  reporteDiesel: '/reportes/reporte-diesel',
  reporteArrastreDiesel: '/reportes/arrastre-diesel',
  reportePolizasPendientes: '/reportes/polizas-pendientes',
  reporteAnticiposPoliza: '/reportes/anticipos-poliza',
  reporteTipoCamion: '/reportes/tipo-camion',
  reporteTipoProducto: '/reportes/tipo-producto',
  reporteTipoAnticipo: '/reportes/tipo-anticipo',
  reporteUbicacionBomba: '/reportes/ubicacion-bomba',
  reporteProductos: '/reportes/productos',
  reporteTarifaEmbarque: '/reportes/tarifa-embarque',
  reporteTransportistas: '/reportes/transportistas',
  reportePilotos: '/reportes/pilotos',
  reporteCamiones: '/reportes/camiones',
  reportePolizas: '/reportes/polizas',
  reporteFacturas: '/reportes/facturas',
  reporteArrastrePolizas: '/reportes/arrastre-polizas',
  reporteViajesPoliza: '/reportes/viajes-poliza',

  // Historial (tablas his_*)
  historial: '/historial',

  // Bitacoras
  bitacoras: '/bitacoras',
};

export default ROUTES;
