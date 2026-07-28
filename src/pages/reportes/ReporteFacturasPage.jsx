/**
 * ReporteFacturasPage.jsx — [v5 §4.2] Reporte de mantenimiento man_facturas_vales.
 */
import { useCallback } from 'react';
import ReportPage from '../../components/common/ReportPage';
import useAuth from '../../hooks/useAuth';
import Badge from '../../components/common/Badge';
import realApi from '../../api/realApi';
import { lookup, formatDate, formatCurrency, formatNumber } from '../../utils/formatters';

export default function ReporteFacturasPage() {
  const { user } = useAuth();

  const enrich = useCallback(async (items) => {
    const productos = await realApi.list('productos').catch(() => []);
    return items.map((r) => ({ ...r, _producto: lookup(productos, r.id_producto) }));
  }, []);

  const columns = [
    { key: 'codigo', label: 'Código' },
    { key: 'factura', label: 'N° Factura' },
    { key: '_producto', label: 'Producto' },
    { key: 'fecha', label: 'Fecha', render: (r) => formatDate(r.fecha), print: (r) => formatDate(r.fecha) },
    { key: 'unidades', label: 'Galones', render: (r) => formatNumber(r.unidades), print: (r) => formatNumber(r.unidades) },
    { key: 'precio', label: 'Precio', render: (r) => formatCurrency(r.precio), print: (r) => formatCurrency(r.precio) },
    { key: 'saldo', label: 'Saldo', render: (r) => formatNumber(r.saldo), print: (r) => formatNumber(r.saldo) },
    { key: 'estado', label: 'Estado', render: (r) => <Badge value={r.estado} />, print: (r) => r.estado },
  ];

  return (
    <ReportPage
      title="Reporte de Facturas"
      description="Listado de facturas de combustible registradas en el sistema."
      recurso="facturasVales"
      columns={columns}
      searchFields={['codigo', 'factura', '_producto']}
      enrich={enrich}
      hasEstado
      usuario={user?.nombre || user?.usuario || ''}
    />
  );
}
