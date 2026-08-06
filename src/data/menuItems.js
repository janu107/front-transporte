/**
 * menuItems.js
 * Definición centralizada del menú lateral (sidebar). Cambiar el menú desde aquí.
 * Cada grupo tiene un título y una lista de items { label, path, icon }.
 */
import { ROUTES } from '../routes/routePaths';

export const MENU = [
  {
    title: 'Principal',
    items: [{ label: 'Dashboard', path: ROUTES.dashboard, icon: '📊' }],
  },
  {
    title: 'Control API',
    items: [{ label: 'Confirmación de Vales', path: ROUTES.confirmacionVales, icon: '⛽' }],
  },
  {
    title: 'Seguridad',
    items: [
      { label: 'Usuarios', path: ROUTES.usuarios, icon: '👤' },
      { label: 'Roles', path: ROUTES.roles, icon: '🛡️' },
      { label: 'Usuario Rol', path: ROUTES.usuarioRol, icon: '🔗' },
    ],
  },
  {
    title: 'Catálogos',
    items: [
      { label: 'Tipo Camión', path: ROUTES.tipoCamion, icon: '🚚' },
      { label: 'Tipo Producto', path: ROUTES.tipoProducto, icon: '🏷️' },
      { label: 'Tipo Anticipo/Provisión', path: ROUTES.tipoAnticipoProvision, icon: '💱' },
      { label: 'Ubicación Bomba', path: ROUTES.ubicacionBomba, icon: '📍' },
      { label: 'Productos', path: ROUTES.productos, icon: '📦' },
      { label: 'Bombas', path: ROUTES.bombas, icon: '⛽' },
      { label: 'Tarifa Embarque', path: ROUTES.tarifaEmbarque, icon: '💲' },
    ],
  },
  {
    title: 'Configuración',
    items: [
      { label: 'Empresas', path: ROUTES.empresas, icon: '🏢' },
      { label: 'Parámetros', path: ROUTES.parametros, icon: '⚙️' },
    ],
  },
  {
    title: 'Mantenimientos',
    items: [
      { label: 'Transportistas', path: ROUTES.transportistas, icon: '🧑‍✈️' },
      { label: 'Pilotos', path: ROUTES.pilotos, icon: '🪪' },
      { label: 'Camiones', path: ROUTES.camiones, icon: '🚛' },
      { label: 'Pólizas', path: ROUTES.polizas, icon: '📄' },
      { label: 'Facturas / Vales', path: ROUTES.facturasVales, icon: '🧾' },
    ],
  },
  {
    title: 'Procesos',
    items: [
      { label: 'Detalle de Póliza / Envíos', path: ROUTES.polizaDetalle, icon: '📑' },
      { label: 'Anticipos / Provisión', path: ROUTES.anticipoProvision, icon: '💰' },
      { label: 'Detalle de Facturas', path: ROUTES.detalleFacturas, icon: '📋' },
    ],
  },
  {
    title: 'Liquidaciones',
    items: [
      { label: 'Generación', path: ROUTES.liquidacionGenerar, icon: '🧮' },
      { label: 'Reversión', path: ROUTES.liquidacionRevertir, icon: '↩️', roles: ['ADMIN'] },
      { label: 'Historial', path: ROUTES.liquidacionHistorialV2, icon: '📚' },
      { label: 'Abonos y Sobregiros', path: ROUTES.liquidacionAbonos, icon: '💳' },
      { label: 'Reporte', path: ROUTES.liquidacionReporteV2, icon: '📊' },
    ],
  },
  {
    title: 'Reportes',
    items: [
      { label: 'Reporte de Diesel', path: ROUTES.reporteDiesel, icon: '⛽' },
      { label: 'Arrastre de Diesel', path: ROUTES.reporteArrastreDiesel, icon: '🛢️' },
      { label: 'Arrastre de Pólizas', path: ROUTES.reporteArrastrePolizas, icon: '📦' },
      { label: 'Viajes por Póliza', path: ROUTES.reporteViajesPoliza, icon: '🚚' },
      { label: 'Pólizas Pendientes', path: ROUTES.reportePolizasPendientes, icon: '📋' },
      { label: 'Anticipos a Transportistas', path: ROUTES.reporteAnticiposPoliza, icon: '💵' },
      // [v7 §2] Los reportes de catálogos/mantenimientos se ocultan del menú: cada
      // catálogo ya tiene su propio botón «Imprimir» (v6 §2). Las páginas y rutas
      // siguen existiendo por si se requieren en el futuro.
    ],
  },
  {
    title: 'Auditoría',
    items: [{ label: 'Bitácoras', path: ROUTES.bitacoras, icon: '🕓' }],
  },
  {
    title: 'Historial',
    items: [{ label: 'Historial', path: ROUTES.historial, icon: '📜' }],
  },
];

export default MENU;
