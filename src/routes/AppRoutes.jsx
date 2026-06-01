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
