/**
 * FacturasValesPage.jsx — man_facturas_vales. Selects de producto y bomba.
 */
import { useEffect, useState } from 'react';
import CrudPage from '../../components/common/CrudPage';
import realApi from '../../api/realApi';
import { ESTADO_OPTIONS_FACTURA } from '../../utils/constants';
import FacturaValeForm from '../../components/forms/FacturaValeForm';
import Badge from '../../components/common/Badge';
import useRelated, { toOptions } from '../../hooks/useRelated';
import { lookup, formatDate, formatCurrency } from '../../utils/formatters';
import { validateForm, required, nonNegative } from '../../utils/validators';

export default function FacturasValesPage() {
  const { productos = [], bombas = [] } = useRelated({ productos: 'productos', bombas: 'bombas' });
  const productoOptions = toOptions(productos);
  const bombaOptions = toOptions(bombas);

  // El select de estado se arma con lo que la columna admite de verdad. En
  // producción no siempre es la misma lista, y al mandar un valor que la base
  // no acepta el error que devolvía MySQL no decía nada útil.
  const [estadoOptions, setEstadoOptions] = useState(ESTADO_OPTIONS_FACTURA);
  useEffect(() => {
    (async () => {
      try {
        const r = await realApi.estadosPermitidos('facturasVales');
        if (r?.valores?.length) {
          setEstadoOptions(r.valores.map((v) => ({ value: v, label: v })));
        }
      } catch {
        // Si no se puede consultar, se deja la lista de siempre.
      }
    })();
  }, []);

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
      searchFields={['codigo', 'factura', 'descripcion_compra', 'fecha', 'saldo', 'estado']}
      // El estado inicial es el primero que la base admita.
      emptyRecord={{ factura: '', id_producto: '', id_bomba: '', descripcion_compra: '', fecha: '', unidades: 0, precio: 0, saldo: 0, estado: estadoOptions[0]?.value || 'PENDIENTE' }}
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
      renderForm={(props) => (
        <FacturaValeForm {...props} productoOptions={productoOptions}
          bombaOptions={bombaOptions} estadoOptions={estadoOptions} />
      )}
    />
  );
}
