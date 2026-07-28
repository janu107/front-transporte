/**
 * DescuentoLiquidacionPage.jsx
 * CRUD genérico compartido por los 2 descuentos que se restan en la Liquidación
 * (pro_descuento_aceite / pro_descuento_administrativo). Reutiliza CrudPage.
 * Ver pantallas concretas: DescuentoAceitePage.jsx y DescuentoAdministrativoPage.jsx.
 */
import CrudPage from '../../components/common/CrudPage';
import DescuentoLiquidacionForm from '../../components/forms/DescuentoLiquidacionForm';
import Badge from '../../components/common/Badge';
import useRelated, { toOptions } from '../../hooks/useRelated';
import { lookup, formatDate, formatCurrency } from '../../utils/formatters';
import { validateForm, required, nonNegative } from '../../utils/validators';

export default function DescuentoLiquidacionPage({ recurso, title, description, newLabel }) {
  const { polizas = [], transportistas = [] } = useRelated({ polizas: 'polizas', transportistas: 'transportistas' });
  const polizaOptions = toOptions(
    polizas.filter((p) => String(p.estado).toUpperCase() === 'ABIERTA'),
    { value: 'codigo', label: 'nombre_poliza' }
  );
  const transportistaOptions = toOptions(transportistas, { value: 'codigo', label: 'nombre_comercial' });

  const columns = [
    { key: 'correlativo', label: 'Corr.' },
    { key: 'id_poliza', label: 'Póliza', render: (v) => lookup(polizas, v, 'codigo', 'nombre_poliza') },
    { key: 'id_transportista', label: 'Transportista', render: (v) => lookup(transportistas, v, 'codigo', 'nombre_comercial') },
    { key: 'fecha', label: 'Fecha', render: (v) => formatDate(v) },
    { key: 'valor', label: 'Valor', render: (v) => formatCurrency(v) },
    { key: 'descripcion', label: 'Descripción' },
    { key: 'estado', label: 'Estado', render: (v) => <Badge value={v} /> },
  ];

  return (
    <CrudPage
      title={title}
      description={description}
      newLabel={newLabel}
      recurso={recurso}
      idField="correlativo"
      modalSize="md"
      deleteMode="anular"
      anularEstado="ANULADO"
      columns={columns}
      searchFields={['descripcion',
        (r) => lookup(polizas, r.id_poliza, 'codigo', 'nombre_poliza'),
        (r) => lookup(transportistas, r.id_transportista, 'codigo', 'nombre_comercial')]}
      emptyRecord={{ id_poliza: '', id_transportista: '', fecha: '', valor: '', descripcion: '', estado: 'ACTIVO' }}
      validate={(v) =>
        validateForm(v, {
          id_poliza: [required('Seleccione una póliza')],
          id_transportista: [required('Seleccione un transportista')],
          fecha: [required('La fecha es obligatoria')],
          valor: [required('El valor es obligatorio'), nonNegative('No puede ser negativo')],
        })
      }
      renderForm={(props) => (
        <DescuentoLiquidacionForm {...props} polizaOptions={polizaOptions} transportistaOptions={transportistaOptions} />
      )}
    />
  );
}
