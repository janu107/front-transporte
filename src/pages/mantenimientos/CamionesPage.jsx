/**
 * CamionesPage.jsx — man_camion. Selects de transportista y tipo de camión.
 */
import CrudPage from '../../components/common/CrudPage';
import CamionForm from '../../components/forms/CamionForm';
import useRelated, { toOptions } from '../../hooks/useRelated';
import { lookup } from '../../utils/formatters';
import { validateForm, required } from '../../utils/validators';

export default function CamionesPage() {
  const { transportistas = [], tipoCamion = [] } = useRelated({
    transportistas: 'transportistas',
    tipoCamion: 'tipoCamion',
  });
  const transportistaOptions = toOptions(transportistas, { value: 'codigo', label: 'nombre_comercial' });
  const tipoCamionOptions = toOptions(tipoCamion);

  const columns = [
    { key: 'codigo', label: 'Código' },
    { key: 'placa', label: 'Placa' },
    { key: 'id_transportista', label: 'Transportista', render: (v) => lookup(transportistas, v, 'codigo', 'nombre_comercial') },
    { key: 'id_tipo_camion', label: 'Tipo', render: (v) => lookup(tipoCamion, v) },
    { key: 'marca', label: 'Marca' },
    { key: 'color', label: 'Color' },
    { key: 'anio', label: 'Año' },
  ];

  return (
    <CrudPage
      title="Camiones"
      description="Mantenimiento de camiones."
      newLabel="+ Nuevo camión"
      recurso="camiones"
      columns={columns}
      searchFields={['placa', 'marca', 'color']}
      emptyRecord={{ placa: '', id_transportista: '', id_tipo_camion: '', marca: '', color: '', anio: '' }}
      validate={(v) =>
        validateForm(v, {
          placa: [required('La placa es obligatoria')],
          id_transportista: [required('Seleccione un transportista')],
          id_tipo_camion: [required('Seleccione un tipo de camión')],
        })
      }
      renderForm={(props) => (
        <CamionForm {...props} transportistaOptions={transportistaOptions} tipoCamionOptions={tipoCamionOptions} />
      )}
    />
  );
}
