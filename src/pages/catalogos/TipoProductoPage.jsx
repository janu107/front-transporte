/**
 * TipoProductoPage.jsx — Catálogo cat_tipo_producto (codigo, descripcion).
 */
import CrudPage from '../../components/common/CrudPage';
import CatalogoSimpleForm from '../../components/forms/CatalogoSimpleForm';
import { validateForm, required } from '../../utils/validators';

const columns = [
  { key: 'codigo', label: 'Código' },
  { key: 'descripcion', label: 'Descripción' },
];

export default function TipoProductoPage() {
  return (
    <CrudPage
      title="Tipo de Producto"
      description="Catálogo de tipos de producto."
      newLabel="+ Nuevo tipo"
      recurso="tipoProducto"
      columns={columns}
      searchFields={['descripcion']}
      emptyRecord={{ descripcion: '' }}
      validate={(v) => validateForm(v, { descripcion: [required('La descripción es obligatoria')] })}
      renderForm={(props) => <CatalogoSimpleForm {...props} />}
    />
  );
}
