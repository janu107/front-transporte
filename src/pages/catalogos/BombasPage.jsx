/**
 * BombasPage.jsx — Catálogo cat_bombas
 * (codigo, id_ubicacion, descripcion, mangueras, id_producto).
 * Selects de ubicación de bomba y producto.
 */
import CrudPage from '../../components/common/CrudPage';
import CatalogoSimpleForm from '../../components/forms/CatalogoSimpleForm';
import useRelated, { toOptions } from '../../hooks/useRelated';
import { lookup } from '../../utils/formatters';
import { validateForm, required } from '../../utils/validators';

export default function BombasPage() {
  const { ubicacionBomba = [], productos = [] } = useRelated({
    ubicacionBomba: 'ubicacionBomba',
    productos: 'productos',
  });

  const columns = [
    { key: 'codigo', label: 'Código' },
    { key: 'descripcion', label: 'Descripción' },
    { key: 'id_ubicacion', label: 'Ubicación', render: (v) => lookup(ubicacionBomba, v) },
    { key: 'id_producto', label: 'Producto', render: (v) => lookup(productos, v) },
    { key: 'mangueras', label: 'Mangueras' },
  ];

  const extraFields = [
    { name: 'id_ubicacion', label: 'Ubicación de bomba', type: 'select', required: true, fullWidth: true, options: toOptions(ubicacionBomba) },
    { name: 'id_producto', label: 'Producto', type: 'select', required: true, fullWidth: true, options: toOptions(productos) },
    { name: 'mangueras', label: 'Mangueras', type: 'number' },
  ];

  return (
    <CrudPage
      title="Bombas"
      description="Catálogo de bombas de combustible."
      newLabel="+ Nueva bomba"
      recurso="bombas"
      columns={columns}
      searchFields={['descripcion']}
      emptyRecord={{ descripcion: '', id_ubicacion: '', id_producto: '', mangueras: 1 }}
      validate={(v) =>
        validateForm(v, {
          descripcion: [required('La descripción es obligatoria')],
          id_ubicacion: [required('Seleccione una ubicación')],
          id_producto: [required('Seleccione un producto')],
        })
      }
      renderForm={(props) => <CatalogoSimpleForm {...props} extraFields={extraFields} />}
    />
  );
}
