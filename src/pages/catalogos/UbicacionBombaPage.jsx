/**
 * UbicacionBombaPage.jsx — Catálogo cat_ubicacion_bomba
 * (codigo, descripcion, direccion, encargado).
 */
import CrudPage from '../../components/common/CrudPage';
import CatalogoSimpleForm from '../../components/forms/CatalogoSimpleForm';
import { validateForm, required } from '../../utils/validators';

const columns = [
  { key: 'codigo', label: 'Código' },
  { key: 'descripcion', label: 'Descripción' },
  { key: 'direccion', label: 'Dirección' },
  { key: 'encargado', label: 'Encargado' },
];

const extraFields = [
  { name: 'direccion', label: 'Dirección', type: 'text', fullWidth: true },
  { name: 'encargado', label: 'Encargado', type: 'text', fullWidth: true },
];

export default function UbicacionBombaPage() {
  return (
    <CrudPage
      title="Ubicación de Bomba"
      description="Catálogo de ubicaciones de bombas de combustible."
      newLabel="+ Nueva ubicación"
      recurso="ubicacionBomba"
      columns={columns}
      searchFields={['descripcion', 'direccion', 'encargado']}
      emptyRecord={{ descripcion: '', direccion: '', encargado: '' }}
      validate={(v) => validateForm(v, { descripcion: [required('La descripción es obligatoria')] })}
      renderForm={(props) => <CatalogoSimpleForm {...props} extraFields={extraFields} />}
    />
  );
}
