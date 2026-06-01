/**
 * TipoCamionPage.jsx — Catálogo cat_tipo_camion (codigo, descripcion).
 */
import CrudPage from '../../components/common/CrudPage';
import CatalogoSimpleForm from '../../components/forms/CatalogoSimpleForm';
import { validateForm, required } from '../../utils/validators';

const columns = [
  { key: 'codigo', label: 'Código' },
  { key: 'descripcion', label: 'Descripción' },
];

export default function TipoCamionPage() {
  return (
    <CrudPage
      title="Tipo de Camión"
      description="Catálogo de tipos de camión."
      newLabel="+ Nuevo tipo"
      recurso="tipoCamion"
      columns={columns}
      searchFields={['descripcion']}
      emptyRecord={{ descripcion: '' }}
      validate={(v) => validateForm(v, { descripcion: [required('La descripción es obligatoria')] })}
      renderForm={(props) => <CatalogoSimpleForm {...props} />}
    />
  );
}
