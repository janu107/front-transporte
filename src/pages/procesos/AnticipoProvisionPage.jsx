/**
 * AnticipoProvisionPage.jsx — pro_anticipo_provision (idField: correlativo).
 */
import CrudPage from '../../components/common/CrudPage';
import AnticipoProvisionForm from '../../components/forms/AnticipoProvisionForm';
import Badge from '../../components/common/Badge';
import useRelated, { toOptions } from '../../hooks/useRelated';
import { lookup, formatDate, formatCurrency } from '../../utils/formatters';
import { validateForm, required, nonNegative } from '../../utils/validators';

export default function AnticipoProvisionPage() {
  const { polizas = [], transportistas = [], camiones = [], pilotos = [], tipoAnticipoProvision = [] } = useRelated({
    polizas: 'polizas',
    transportistas: 'transportistas',
    camiones: 'camiones',
    pilotos: 'pilotos',
    tipoAnticipoProvision: 'tipoAnticipoProvision',
  });

  const polizaOptions = toOptions(polizas, { value: 'codigo', label: 'nombre_poliza' });
  const transportistaOptions = toOptions(transportistas, { value: 'codigo', label: 'nombre_comercial' });
  const camionOptions = toOptions(camiones, { value: 'codigo', label: 'placa' });
  const pilotoOptions = toOptions(pilotos, { value: 'codigo', labelFn: (p) => `${p.nombres} ${p.apellidos}` });
  const tipoOptions = toOptions(tipoAnticipoProvision);

  const columns = [
    { key: 'correlativo', label: 'Corr.' },
    { key: 'num_anticipo', label: 'N° Anticipo' },
    { key: 'id_poliza', label: 'Póliza', render: (v) => lookup(polizas, v, 'codigo', 'nombre_poliza') },
    { key: 'id_transportista', label: 'Transportista', render: (v) => lookup(transportistas, v, 'codigo', 'nombre_comercial') },
    { key: 'id_tipo_anticipo_provision', label: 'Tipo', render: (v) => lookup(tipoAnticipoProvision, v) },
    { key: 'fecha', label: 'Fecha', render: (v) => formatDate(v) },
    { key: 'valor', label: 'Valor', render: (v) => formatCurrency(v) },
    { key: 'estado', label: 'Estado', render: (v) => <Badge value={v} /> },
  ];

  return (
    <CrudPage
      title="Anticipos / Provisión"
      description="Registro de anticipos y provisiones."
      newLabel="+ Nuevo anticipo"
      recurso="anticipoProvision"
      idField="correlativo"
      modalSize="lg"
      deleteMode="anular"
      anularEstado="ANULADA"
      columns={columns}
      searchFields={['num_anticipo', 'descripcion']}
      emptyRecord={{
        num_anticipo: '', id_poliza: '', id_transportista: '', id_camion: '', id_piloto: '',
        id_tipo_anticipo_provision: '', fecha: '', valor: 0, estado: 'PENDIENTE', descripcion: '',
      }}
      validate={(v) =>
        validateForm(v, {
          num_anticipo: [required('El número de anticipo es obligatorio')],
          id_poliza: [required('Seleccione una póliza')],
          id_transportista: [required('Seleccione un transportista')],
          id_tipo_anticipo_provision: [required('Seleccione un tipo')],
          fecha: [required('La fecha es obligatoria')],
          valor: [required('El valor es obligatorio'), nonNegative('No puede ser negativo')],
        })
      }
      renderForm={(props) => (
        <AnticipoProvisionForm
          {...props}
          polizaOptions={polizaOptions}
          transportistaOptions={transportistaOptions}
          camionOptions={camionOptions}
          pilotoOptions={pilotoOptions}
          tipoOptions={tipoOptions}
        />
      )}
    />
  );
}
