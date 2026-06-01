/**
 * FacturasValesPage.jsx — man_facturas_vales. Selects de producto y bomba.
 */
import CrudPage from '../../components/common/CrudPage';
import FacturaValeForm from '../../components/forms/FacturaValeForm';
import Badge from '../../components/common/Badge';
import useRelated, { toOptions } from '../../hooks/useRelated';
import { lookup, formatDate, formatCurrency } from '../../utils/formatters';
import { validateForm, required, nonNegative } from '../../utils/validators';

export default function FacturasValesPage() {
  const { productos = [], bombas = [] } = useRelated({ productos: 'productos', bombas: 'bombas' });
  const productoOptions = toOptions(productos);
  const bombaOptions = toOptions(bombas);

  const columns = [
    { key: 'codigo', label: 'Código' },
    { key: 'factura', label: 'Factura' },
    { key: 'id_producto', label: 'Producto', render: (v) => lookup(productos, v) },
    { key: 'id_bomba', label: 'Bomba', render: (v) => lookup(bombas, v) },
    { key: 'fecha', label: 'Fecha', render: (v) => formatDate(v) },
    { key: 'saldo', label: 'Saldo', render: (v) => formatCurrency(v) },
    { key: 'estado', label: 'Estado', render: (v) => <Badge value={v} /> },
  ];

  return (
    <CrudPage
      title="Facturas / Vales"
      description="Mantenimiento de facturas y vales."
      newLabel="+ Nueva factura/vale"
      recurso="facturasVales"
      modalSize="lg"
      deleteMode="anular"
      anularEstado="ANULADA"
      columns={columns}
      searchFields={['factura', 'descripcion_compra']}
      emptyRecord={{ factura: '', id_producto: '', id_bomba: '', descripcion_compra: '', fecha: '', unidades: 0, precio: 0, saldo: 0, estado: 'PENDIENTE' }}
      validate={(v) =>
        validateForm(v, {
          factura: [required('La factura es obligatoria')],
          id_producto: [required('Seleccione un producto')],
          id_bomba: [required('Seleccione una bomba')],
          fecha: [required('La fecha es obligatoria')],
          unidades: [nonNegative('No puede ser negativo')],
          precio: [nonNegative('No puede ser negativo')],
        })
      }
      renderForm={(props) => <FacturaValeForm {...props} productoOptions={productoOptions} bombaOptions={bombaOptions} />}
    />
  );
}
