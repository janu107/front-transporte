/**
 * RolesPage.jsx — adm_roles (codigo, tipo_rol, descripcion, estado).
 */
import CrudPage from '../../components/common/CrudPage';
import RolForm from '../../components/forms/RolForm';
import Badge from '../../components/common/Badge';
import { validateForm, required } from '../../utils/validators';

const columns = [
  { key: 'codigo', label: 'Código' },
  { key: 'tipo_rol', label: 'Tipo de rol' },
  { key: 'descripcion', label: 'Descripción' },
  { key: 'estado', label: 'Estado', render: (v) => <Badge value={v} /> },
];

export default function RolesPage() {
  return (
    <CrudPage
      title="Roles"
      description="Gestión de roles del sistema."
      newLabel="+ Nuevo rol"
      recurso="roles"
      columns={columns}
      searchFields={['tipo_rol', 'descripcion']}
      emptyRecord={{ tipo_rol: '', descripcion: '', estado: 'ACTIVO' }}
      validate={(v) =>
        validateForm(v, {
          tipo_rol: [required('El tipo de rol es obligatorio')],
          estado: [required('Seleccione un estado')],
        })
      }
      renderForm={(props) => <RolForm {...props} />}
    />
  );
}
