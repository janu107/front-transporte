/**
 * LiquidacionesPage.jsx — pro_liquidaciones (idField: correlativo).
 * valor_liquidacion se calcula visualmente en el formulario.
 */
import CrudPage from '../../components/common/CrudPage';
import LiquidacionForm from '../../components/forms/LiquidacionForm';
import Badge from '../../components/common/Badge';
import useRelated, { toOptions } from '../../hooks/useRelated';
import { lookup, formatDate, formatCurrency } from '../../utils/formatters';
import { validateForm, required } from '../../utils/validators';

export default function LiquidacionesPage() {
  const { polizas = [], transportistas = [] } = useRelated({ polizas: 'polizas', transportistas: 'transportistas' });
  const polizaOptions = toOptions(polizas, { value: 'codigo', label: 'nombre_poliza' });
  const transportistaOptions = toOptions(transportistas, { value: 'codigo', label: 'nombre_comercial' });

  const columns = [
    { key: 'correlativo', label: 'Corr.' },
    { key: 'num_liquidacion', label: 'N° Liquidación' },
    { key: 'id_poliza', label: 'Póliza', render: (v) => lookup(polizas, v, 'codigo', 'nombre_poliza') },
    { key: 'id_transportista', label: 'Transportista', render: (v) => lookup(transportistas, v, 'codigo', 'nombre_comercial') },
    { key: 'valor_liquidacion', label: 'Valor liquidación', render: (v) => formatCurrency(v) },
    { key: 'fecha_liquidacion', label: 'Fecha', render: (v) => formatDate(v) },
    { key: 'estado', label: 'Estado', render: (v) => <Badge value={v} /> },
  ];

  return (
    <CrudPage
      title="Liquidaciones"
      description="Liquidaciones de pólizas por transportista."
      newLabel="+ Nueva liquidación"
      recurso="liquidaciones"
      idField="correlativo"
      modalSize="lg"
      deleteMode="anular"
      anularEstado="ANULADA"
      columns={columns}
      searchFields={['num_liquidacion']}
      emptyRecord={{
        num_liquidacion: '', id_poliza: '', id_transportista: '', cantidad_viajes: 0, valor_viajes: 0,
        cantidad_vale: 0, valor_vales: 0, cantidad_anticipos: 0, valor_anticipos: 0,
        valor_liquidacion: 0, estado: 'PENDIENTE', fecha_liquidacion: '',
      }}
      validate={(v) =>
        validateForm(v, {
          num_liquidacion: [required('El número de liquidación es obligatorio')],
          id_poliza: [required('Seleccione una póliza')],
          id_transportista: [required('Seleccione un transportista')],
        })
      }
      renderForm={(props) => (
        <LiquidacionForm {...props} polizaOptions={polizaOptions} transportistaOptions={transportistaOptions} />
      )}
    />
  );
}
