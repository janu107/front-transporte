/**
 * ReporteProductosPage.jsx — [v5 §4.1] Reporte de catálogo cat_productos.
 */
import { useCallback } from 'react';
import ReportPage from '../../components/common/ReportPage';
import useAuth from '../../hooks/useAuth';
import realApi from '../../api/realApi';
import { lookup } from '../../utils/formatters';

export default function ReporteProductosPage() {
  const { user } = useAuth();

  const enrich = useCallback(async (items) => {
    const tipos = await realApi.list('tipoProducto').catch(() => []);
    return items.map((r) => ({ ...r, _tipo: lookup(tipos, r.id_tipo_producto) }));
  }, []);

  const columns = [
    { key: 'codigo', label: 'Código' },
    { key: 'descripcion', label: 'Descripción' },
    { key: '_tipo', label: 'Tipo de producto' },
  ];

  return (
    <ReportPage
      title="Reporte de Productos"
      description="Catálogo de productos (combustibles) registrados en el sistema."
      recurso="productos"
      columns={columns}
      searchFields={['codigo', 'descripcion', '_tipo']}
      enrich={enrich}
      usuario={user?.nombre || user?.usuario || ''}
    />
  );
}
