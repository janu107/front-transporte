/**
 * DetalleFacturasPage.jsx — pro_detalle_facturas (idField: correlativo).
 */
import CrudPage from '../../components/common/CrudPage';
import DetalleFacturaForm from '../../components/forms/DetalleFacturaForm';
import useRelated, { toOptions } from '../../hooks/useRelated';
import { lookup, formatDate, formatCurrency } from '../../utils/formatters';
import { validateForm, required, nonNegative } from '../../utils/validators';

export default function DetalleFacturasPage() {
  const { facturasVales = [], polizas = [], transportistas = [], camiones = [], pilotos = [] } = useRelated({
    facturasVales: 'facturasVales',
    polizas: 'polizas',
    transportistas: 'transportistas',
    camiones: 'camiones',
    pilotos: 'pilotos',
  });

  const facturaValeOptions = toOptions(facturasVales, { value: 'codigo', label: 'factura' });
  const polizaOptions = toOptions(polizas, { value: 'codigo', label: 'nombre_poliza' });
  const transportistaOptions = toOptions(transportistas, { value: 'codigo', label: 'nombre_comercial' });
  const camionOptions = toOptions(camiones, { value: 'codigo', label: 'placa' });
  const pilotoOptions = toOptions(pilotos, { value: 'codigo', labelFn: (p) => `${p.nombres} ${p.apellidos}` });

  const columns = [
    { key: 'correlativo', label: 'Corr.' },
    { key: 'num_vale', label: 'N° Vale' },
    { key: 'id_factura_vale', label: 'Factura/Vale', render: (v) => lookup(facturasVales, v, 'codigo', 'factura') },
    { key: 'id_poliza', label: 'Póliza', render: (v) => lookup(polizas, v, 'codigo', 'nombre_poliza') },
    { key: 'id_transportista', label: 'Transportista', render: (v) => lookup(transportistas, v, 'codigo', 'nombre_comercial') },
    { key: 'fecha', label: 'Fecha', render: (v) => formatDate(v) },
    { key: 'total', label: 'Total', render: (v) => formatCurrency(v) },
  ];

  return (
    <CrudPage
      title="Detalle de Facturas"
      description="Registro de detalle de facturas / vales."
      newLabel="+ Nuevo detalle"
      recurso="detalleFacturas"
      idField="correlativo"
      modalSize="lg"
      columns={columns}
      searchFields={['num_vale']}
      emptyRecord={{
        num_vale: '', id_factura_vale: '', id_poliza: '', id_transportista: '', id_camion: '',
        id_piloto: '', fecha: '', cantidad: 0, total: 0,
      }}
      validate={(v) =>
        validateForm(v, {
          num_vale: [required('El número de vale es obligatorio')],
          id_factura_vale: [required('Seleccione una factura/vale')],
          id_poliza: [required('Seleccione una póliza')],
          id_transportista: [required('Seleccione un transportista')],
          fecha: [required('La fecha es obligatoria')],
          cantidad: [nonNegative('No puede ser negativo')],
          total: [nonNegative('No puede ser negativo')],
        })
      }
      renderForm={(props) => (
        <DetalleFacturaForm
          {...props}
          facturaValeOptions={facturaValeOptions}
          polizaOptions={polizaOptions}
          transportistaOptions={transportistaOptions}
          camionOptions={camionOptions}
          pilotoOptions={pilotoOptions}
        />
      )}
    />
  );
}
