/**
 * PilotosPage.jsx — man_pilotos. Select de transportista.
 */
import CrudPage from '../../components/common/CrudPage';
import PilotoForm from '../../components/forms/PilotoForm';
import Badge from '../../components/common/Badge';
import useRelated, { toOptions } from '../../hooks/useRelated';
import { lookup, formatDate } from '../../utils/formatters';
import { validateForm, required } from '../../utils/validators';

export default function PilotosPage() {
  const { transportistas = [] } = useRelated({ transportistas: 'transportistas' });
  const transportistaOptions = toOptions(transportistas, { value: 'codigo', label: 'nombre_comercial' });

  const columns = [
    { key: 'codigo', label: 'Código' },
    { key: 'nombres', label: 'Nombres' },
    { key: 'apellidos', label: 'Apellidos' },
    { key: 'id_transportista', label: 'Transportista', render: (v) => lookup(transportistas, v, 'codigo', 'nombre_comercial') },
    { key: 'licencia', label: 'Licencia' },
    { key: 'fecha_vigencia', label: 'Vigencia', render: (v) => formatDate(v) },
    { key: 'estado', label: 'Estado', render: (v) => <Badge value={v} /> },
  ];

  return (
    <CrudPage
      title="Pilotos"
      description="Mantenimiento de pilotos."
      newLabel="+ Nuevo piloto"
      recurso="pilotos"
      modalSize="lg"
      columns={columns}
      searchFields={['nombres', 'apellidos', 'licencia']}
      emptyRecord={{ nombres: '', apellidos: '', id_transportista: '', licencia: '', tipo_licencia: '', fecha_vigencia: '', direccion: '', telefono: '', estado: 'ACTIVO' }}
      validate={(v) =>
        validateForm(v, {
          nombres: [required('Los nombres son obligatorios')],
          id_transportista: [required('Seleccione un transportista')],
          estado: [required('Seleccione un estado')],
        })
      }
      renderForm={(props) => <PilotoForm {...props} transportistaOptions={transportistaOptions} />}
    />
  );
}
