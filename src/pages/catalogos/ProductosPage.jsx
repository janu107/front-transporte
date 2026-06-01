/**
 * ProductosPage.jsx — Catálogo cat_productos (codigo, descripcion, id_tipo_producto).
 * El formulario incluye select de tipo de producto (cat_tipo_producto).
 */
import CrudPage from '../../components/common/CrudPage';
import CatalogoSimpleForm from '../../components/forms/CatalogoSimpleForm';
import useRelated, { toOptions } from '../../hooks/useRelated';
import { lookup } from '../../utils/formatters';
import { validateForm, required } from '../../utils/validators';

export default function ProductosPage() {
  const { tipoProducto = [] } = useRelated({ tipoProducto: 'tipoProducto' });
  const tipoOptions = toOptions(tipoProducto);

  const columns = [
    { key: 'codigo', label: 'Código' },
    { key: 'descripcion', label: 'Descripción' },
    {
      key: 'id_tipo_producto',
      label: 'Tipo de producto',
      render: (val) => lookup(tipoProducto, val),
    },
  ];

  const extraFields = [
    {
      name: 'id_tipo_producto',
      label: 'Tipo de producto',
      type: 'select',
      required: true,
      fullWidth: true,
      options: tipoOptions,
    },
  ];

  return (
    <CrudPage
      title="Productos"
      description="Catálogo de productos."
      newLabel="+ Nuevo producto"
      recurso="productos"
      columns={columns}
      searchFields={['descripcion']}
      emptyRecord={{ descripcion: '', id_tipo_producto: '' }}
      validate={(v) =>
        validateForm(v, {
          descripcion: [required('La descripción es obligatoria')],
          id_tipo_producto: [required('Seleccione un tipo de producto')],
        })
      }
      renderForm={(props) => <CatalogoSimpleForm {...props} extraFields={extraFields} />}
    />
  );
}
