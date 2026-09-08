/**
 * FacturasValesPage.jsx — man_facturas_vales. Selects de producto y bomba.
 */
import CrudPage from '../../components/common/CrudPage';
import FacturaValeForm from '../../components/forms/FacturaValeForm';
import Badge from '../../components/common/Badge';
import useRelated, { toOptions } from '../../hooks/useRelated';
import { lookup, formatDate, formatCurrency, formatNumber } from '../../utils/formatters';
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
    // El saldo son GALONES por despachar, no quetzales: se muestra como número
    // con su unidad, junto a las unidades compradas para poder compararlos.
    { key: 'unidades', label: 'Unidades', render: (v) => `${formatNumber(v)} gal` },
    { key: 'precio', label: 'Precio/gal', render: (v) => formatCurrency(v) },
    { key: 'saldo', label: 'Saldo (gal)', render: (v) => `${formatNumber(v)} gal` },
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
      searchFields={['codigo', 'factura', 'descripcion_compra', 'fecha', 'unidades', 'saldo', 'estado']}
      // Una factura debe quedar ACTIVA para poder emitirle vales; si la columna
      // de la base no admite ese valor, CrudPage lo ajusta al que sí tenga.
      emptyRecord={{ factura: '', id_producto: '', id_bomba: '', descripcion_compra: '', fecha: '', unidades: 0, precio: 0, saldo: 0, estado: 'ACTIVO' }}
      validate={(v) => {
        const e = validateForm(v, {
          factura: [required('La factura es obligatoria')],
          id_producto: [required('Seleccione un producto')],
          id_bomba: [required('Seleccione una bomba')],
          fecha: [required('La fecha es obligatoria')],
          unidades: [nonNegative('No puede ser negativo')],
          precio: [nonNegative('No puede ser negativo')],
        });
        // El saldo son galones por despachar: nunca puede pasar de lo comprado.
        // Es lo que delataba el saldo monetario (5,000 gal con saldo 62,229.33).
        if (!e.saldo && Number(v.saldo) > Number(v.unidades)) {
          e.saldo = `El saldo no puede pasar de las unidades compradas (${Number(v.unidades) || 0} gal).`;
        }
        return e;
      }}
      renderForm={(props) => (
        <FacturaValeForm {...props} productoOptions={productoOptions} bombaOptions={bombaOptions} />
      )}
    />
  );
}
