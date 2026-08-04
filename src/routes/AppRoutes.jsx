/**
 * AppRoutes.jsx
 * Definicion de todas las rutas internas de la aplicacion.
 * Rutas publicas: login. Rutas privadas: el resto (protegidas por PrivateRoute).
 */
import { Routes, Route, Navigate } from 'react-router-dom';

import PrivateRoute from './PrivateRoute';
import PrivateLayout from '../layouts/PrivateLayout';
import { ROUTES } from './routePaths';

import LoginPage from '../pages/auth/LoginPage';
import DashboardPage from '../pages/dashboard/DashboardPage';

// Control del API
import ConfirmacionValesPage from '../pages/controlapi/ConfirmacionValesPage';

// Seguridad
import UsuariosPage from '../pages/seguridad/UsuariosPage';
import RolesPage from '../pages/seguridad/RolesPage';
import UsuarioRolPage from '../pages/seguridad/UsuarioRolPage';

// Catálogos
import TipoCamionPage from '../pages/catalogos/TipoCamionPage';
import TipoProductoPage from '../pages/catalogos/TipoProductoPage';
import TipoAnticipoProvisionPage from '../pages/catalogos/TipoAnticipoProvisionPage';
import UbicacionBombaPage from '../pages/catalogos/UbicacionBombaPage';
import ProductosPage from '../pages/catalogos/ProductosPage';
import BombasPage from '../pages/catalogos/BombasPage';
import TarifaEmbarquePage from '../pages/catalogos/TarifaEmbarquePage';

// Configuración
import EmpresasPage from '../pages/configuracion/EmpresasPage';
import ParametrosPage from '../pages/configuracion/ParametrosPage';

// Mantenimientos
import TransportistasPage from '../pages/mantenimientos/TransportistasPage';
import PilotosPage from '../pages/mantenimientos/PilotosPage';
import CamionesPage from '../pages/mantenimientos/CamionesPage';
import PolizasPage from '../pages/mantenimientos/PolizasPage';
import FacturasValesPage from '../pages/mantenimientos/FacturasValesPage';

// Procesos
import PolizaDetallePage from '../pages/procesos/PolizaDetallePage';
import AnticipoProvisionPage from '../pages/procesos/AnticipoProvisionPage';
import DetalleFacturasPage from '../pages/procesos/DetalleFacturasPage';
import LiquidacionesPage from '../pages/procesos/LiquidacionesPage';
import HistorialLiquidacionesPage from '../pages/procesos/HistorialLiquidacionesPage';

// Reportes
import ReporteDieselPage from '../pages/reportes/ReporteDieselPage';
import ReporteArrastreDieselPage from '../pages/reportes/ReporteArrastreDieselPage';
import ReportePolizasPendientesPage from '../pages/reportes/ReportePolizasPendientesPage';
import ReporteAnticiposPolizaPage from '../pages/reportes/ReporteAnticiposPolizaPage';
import ReporteTipoCamionPage from '../pages/reportes/ReporteTipoCamionPage';
import ReporteTipoProductoPage from '../pages/reportes/ReporteTipoProductoPage';
import ReporteTipoAnticipoPage from '../pages/reportes/ReporteTipoAnticipoPage';
import ReporteUbicacionBombaPage from '../pages/reportes/ReporteUbicacionBombaPage';
import ReporteProductosPage from '../pages/reportes/ReporteProductosPage';
import ReporteTarifaEmbarquePage from '../pages/reportes/ReporteTarifaEmbarquePage';
import ReporteTransportistasPage from '../pages/reportes/ReporteTransportistasPage';
import ReportePilotosPage from '../pages/reportes/ReportePilotosPage';
import ReporteCamionesPage from '../pages/reportes/ReporteCamionesPage';
import ReportePolizasPage from '../pages/reportes/ReportePolizasPage';
import ReporteFacturasPage from '../pages/reportes/ReporteFacturasPage';
import ReporteArrastrePolizasPage from '../pages/reportes/ReporteArrastrePolizasPage';
import ReporteViajesPolizaPage from '../pages/reportes/ReporteViajesPolizaPage';

// Historial (tablas his_*)
import HistorialPage from '../pages/historial/HistorialPage';

// Bitácoras y errores
import BitacorasPage from '../pages/bitacoras/BitacorasPage';
import NotFoundPage from '../pages/errores/NotFoundPage';

export function AppRoutes() {
  return (
    <Routes>
      {/* Redirecciones base */}
      <Route path="/" element={<Navigate to={ROUTES.dashboard} replace />} />
      {/* Pública */}
      <Route path={ROUTES.login} element={<LoginPage />} />

      {/* Privadas */}
      <Route element={<PrivateRoute />}>
        <Route element={<PrivateLayout />}>
          <Route path={ROUTES.dashboard} element={<DashboardPage />} />

          {/* Control del API */}
          <Route path={ROUTES.confirmacionVales} element={<ConfirmacionValesPage />} />

          {/* Seguridad */}
          <Route path={ROUTES.usuarios} element={<UsuariosPage />} />
          <Route path={ROUTES.roles} element={<RolesPage />} />
          <Route path={ROUTES.usuarioRol} element={<UsuarioRolPage />} />

          {/* Catálogos */}
          <Route path={ROUTES.tipoCamion} element={<TipoCamionPage />} />
          <Route path={ROUTES.tipoProducto} element={<TipoProductoPage />} />
          <Route path={ROUTES.tipoAnticipoProvision} element={<TipoAnticipoProvisionPage />} />
          <Route path={ROUTES.ubicacionBomba} element={<UbicacionBombaPage />} />
          <Route path={ROUTES.productos} element={<ProductosPage />} />
          <Route path={ROUTES.bombas} element={<BombasPage />} />
          <Route path={ROUTES.tarifaEmbarque} element={<TarifaEmbarquePage />} />

          {/* Configuración */}
          <Route path={ROUTES.empresas} element={<EmpresasPage />} />
          <Route path={ROUTES.parametros} element={<ParametrosPage />} />

          {/* Mantenimientos */}
          <Route path={ROUTES.transportistas} element={<TransportistasPage />} />
          <Route path={ROUTES.pilotos} element={<PilotosPage />} />
          <Route path={ROUTES.camiones} element={<CamionesPage />} />
          <Route path={ROUTES.polizas} element={<PolizasPage />} />
          <Route path={ROUTES.facturasVales} element={<FacturasValesPage />} />

          {/* Procesos */}
          <Route path={ROUTES.polizaDetalle} element={<PolizaDetallePage />} />
          <Route path={ROUTES.anticipoProvision} element={<AnticipoProvisionPage />} />
          <Route path={ROUTES.detalleFacturas} element={<DetalleFacturasPage />} />
          <Route path={ROUTES.liquidaciones} element={<LiquidacionesPage />} />
          <Route path={ROUTES.historialLiquidaciones} element={<HistorialLiquidacionesPage />} />

          {/* Reportes */}
          <Route path={ROUTES.reporteDiesel} element={<ReporteDieselPage />} />
          <Route path={ROUTES.reporteArrastreDiesel} element={<ReporteArrastreDieselPage />} />
          <Route path={ROUTES.reportePolizasPendientes} element={<ReportePolizasPendientesPage />} />
          <Route path={ROUTES.reporteAnticiposPoliza} element={<ReporteAnticiposPolizaPage />} />
          <Route path={ROUTES.reporteTipoCamion} element={<ReporteTipoCamionPage />} />
          <Route path={ROUTES.reporteTipoProducto} element={<ReporteTipoProductoPage />} />
          <Route path={ROUTES.reporteTipoAnticipo} element={<ReporteTipoAnticipoPage />} />
          <Route path={ROUTES.reporteUbicacionBomba} element={<ReporteUbicacionBombaPage />} />
          <Route path={ROUTES.reporteProductos} element={<ReporteProductosPage />} />
          <Route path={ROUTES.reporteTarifaEmbarque} element={<ReporteTarifaEmbarquePage />} />
          <Route path={ROUTES.reporteTransportistas} element={<ReporteTransportistasPage />} />
          <Route path={ROUTES.reportePilotos} element={<ReportePilotosPage />} />
          <Route path={ROUTES.reporteCamiones} element={<ReporteCamionesPage />} />
          <Route path={ROUTES.reportePolizas} element={<ReportePolizasPage />} />
          <Route path={ROUTES.reporteFacturas} element={<ReporteFacturasPage />} />
          <Route path={ROUTES.reporteArrastrePolizas} element={<ReporteArrastrePolizasPage />} />
          <Route path={ROUTES.reporteViajesPoliza} element={<ReporteViajesPolizaPage />} />

          {/* Historial (tablas his_*) */}
          <Route path={ROUTES.historial} element={<HistorialPage />} />

          {/* Auditoría */}
          <Route path={ROUTES.bitacoras} element={<BitacorasPage />} />
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default AppRoutes;
