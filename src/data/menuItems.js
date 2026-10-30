/**
 * menuItems.js
 * Definición centralizada del menú lateral (sidebar). Cambiar el menú desde aquí.
 * Cada grupo tiene un título y una lista de items { label, path, icon }.
 */
import { ROUTES } from '../routes/routePaths';

export const MENU = [
  {
    title: 'Principal',
    items: [{ label: 'Dashboard', path: ROUTES.dashboard, icon: 'dashboard' }],
  },
  {
    title: 'Control API',
    items: [{ label: 'Confirmación de Vales', path: ROUTES.confirmacionVales, icon: 'fuel' }],
  },
  {
    title: 'Seguridad',
    items: [
      { label: 'Usuarios', path: ROUTES.usuarios, icon: 'people' },
      { label: 'Roles', path: ROUTES.roles, icon: 'shield' },
      { label: 'Usuario Rol', path: ROUTES.usuarioRol, icon: 'link' },
    ],
  },
  {
    title: 'Catálogos',
    items: [
      { label: 'Tipo Camión', path: ROUTES.tipoCamion, icon: 'truck' },
      { label: 'Tipo Producto', path: ROUTES.tipoProducto, icon: 'tag' },
      { label: 'Tipo Anticipo/Provisión', path: ROUTES.tipoAnticipoProvision, icon: 'exchange' },
      { label: 'Ubicación Bomba', path: ROUTES.ubicacionBomba, icon: 'location' },
      { label: 'Productos', path: ROUTES.productos, icon: 'inventory' },
      { label: 'Bombas', path: ROUTES.bombas, icon: 'fuel' },
      { label: 'Tarifa Embarque', path: ROUTES.tarifaEmbarque, icon: 'payments' },
    ],
  },
  {
    title: 'Configuración',
    items: [
      { label: 'Empresas', path: ROUTES.empresas, icon: 'business' },
      { label: 'Parámetros', path: ROUTES.parametros, icon: 'settings' },
    ],
  },
  {
    title: 'Mantenimientos',
    items: [
      { label: 'Transportistas', path: ROUTES.transportistas, icon: 'business' },
      { label: 'Pilotos', path: ROUTES.pilotos, icon: 'badge' },
      { label: 'Camiones', path: ROUTES.camiones, icon: 'truck' },
      { label: 'Pólizas', path: ROUTES.polizas, icon: 'document' },
      { label: 'Facturas / Vales', path: ROUTES.facturasVales, icon: 'receipt' },
    ],
  },
  {
    title: 'Procesos',
    items: [
      { label: 'Detalle de Póliza / Envíos', path: ROUTES.polizaDetalle, icon: 'document' },
      { label: 'Anticipos / Provisión', path: ROUTES.anticipoProvision, icon: 'wallet' },
      { label: 'Detalle de Facturas', path: ROUTES.detalleFacturas, icon: 'receipt' },
    ],
  },
  {
    title: 'Liquidaciones',
    items: [
      { label: 'Generación', path: ROUTES.liquidacionGenerar, icon: 'calculate' },
      { label: 'Reversión', path: ROUTES.liquidacionRevertir, icon: 'undo', roles: ['ADMIN'] },
      { label: 'Historial', path: ROUTES.liquidacionHistorialV2, icon: 'history' },
      { label: 'Sobregiros', path: ROUTES.liquidacionAbonos, icon: 'warning' },
      { label: 'Reporte', path: ROUTES.liquidacionReporteV2, icon: 'report' },
    ],
  },
  {
    title: 'Reportes',
    items: [
      { label: 'Reporte de Liquidación', path: ROUTES.liquidacionReporteDoc, icon: 'document' },
      { label: 'Reporte de Diesel', path: ROUTES.reporteDiesel, icon: 'fuel' },
      { label: 'Arrastre de Diesel', path: ROUTES.reporteArrastreDiesel, icon: 'fuel' },
      { label: 'Arrastre de Pólizas', path: ROUTES.reporteArrastrePolizas, icon: 'inventory' },
      { label: 'Viajes por Póliza', path: ROUTES.reporteViajesPoliza, icon: 'truck' },
      { label: 'Pólizas Pendientes', path: ROUTES.reportePolizasPendientes, icon: 'receipt' },
      { label: 'Anticipos a Transportistas', path: ROUTES.reporteAnticiposPoliza, icon: 'payments' },
      { label: 'Reporte por Transportista', path: ROUTES.reporteTransportista, icon: 'receipt' },
      { label: 'Detalles de transportistas', path: ROUTES.reporteLiquidacionPorPoliza, icon: 'document' },
      { label: 'Pólizas por Transportista', path: ROUTES.reportePolizasTransportistas, icon: 'folder' },
      // [v7 §2] Los reportes de catálogos/mantenimientos se ocultan del menú: cada
      // catálogo ya tiene su propio botón «Imprimir» (v6 §2). Las páginas y rutas
      // siguen existiendo por si se requieren en el futuro.
    ],
  },
  {
    title: 'Auditoría',
    items: [{ label: 'Bitácoras', path: ROUTES.bitacoras, icon: 'schedule' }],
  },
  {
    title: 'Historial',
    items: [{ label: 'Historial', path: ROUTES.historial, icon: 'history' }],
  },
];

export default MENU;

