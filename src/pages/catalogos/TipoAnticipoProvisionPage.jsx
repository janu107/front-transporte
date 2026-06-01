/**
 * TipoAnticipoProvisionPage.jsx — Catálogo cat_tipo_anticipo_provision (codigo, descripcion).
 */
import CrudPage from '../../components/common/CrudPage';
import CatalogoSimpleForm from '../../components/forms/CatalogoSimpleForm';
import { validateForm, required } from '../../utils/validators';

const columns = [
  { key: 'codigo', label: 'Código' },
  { key: 'descripcion', label: 'Descripción' },
];

export default function TipoAnticipoProvisionPage() {
  return (
    <CrudPage
      title="Tipo de Anticipo / Provisión"
      description="Catálogo de tipos de anticipo y provisión."
      newLabel="+ Nuevo tipo"
      recurso="tipoAnticipoProvision"
      columns={columns}
      searchFields={['descripcion']}
      emptyRecord={{ descripcion: '' }}
      validate={(v) => validateForm(v, { descripcion: [required('La descripción es obligatoria')] })}
      renderForm={(props) => <CatalogoSimpleForm {...props} />}
    />
  );
}
