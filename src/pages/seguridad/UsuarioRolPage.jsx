/**
 * UsuarioRolPage.jsx — adm_usuario_rol.
 * Asigna roles a usuarios (id_usuario, id_rol) y permite cambiar el estado.
 * La lista muestra el nombre del usuario y el tipo de rol (resueltos por el backend).
 */
import CrudPage from '../../components/common/CrudPage';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';
import useRelated, { toOptions } from '../../hooks/useRelated';
import { validateForm, required } from '../../utils/validators';
import { ESTADO_OPTIONS_BASICO } from '../../utils/constants';

export default function UsuarioRolPage() {
  const { usuarios = [], roles = [] } = useRelated({ usuarios: 'usuarios', roles: 'roles' });

  const usuarioOptions = toOptions(usuarios, { value: 'codigo', labelFn: (u) => `${u.usuario} — ${u.nombre}` });
  const rolOptions = toOptions(roles, { value: 'codigo', label: 'tipo_rol' });

  const columns = [
    { key: 'codigo', label: 'Código' },
    { key: 'usuario', label: 'Usuario' },
    { key: 'nombre_usuario', label: 'Nombre' },
    { key: 'rol', label: 'Rol' },
    { key: 'estado', label: 'Estado', render: (v) => <Badge value={v} /> },
  ];

  const renderForm = ({ values, setField, errors }) => (
    <div className="form-grid">
      <Select label="Usuario" name="id_usuario" value={values.id_usuario}
        onChange={(e) => setField('id_usuario', e.target.value)} options={usuarioOptions} required error={errors.id_usuario} />
      <Select label="Rol" name="id_rol" value={values.id_rol}
        onChange={(e) => setField('id_rol', e.target.value)} options={rolOptions} required error={errors.id_rol} />
      <Select className="col-span-2" label="Estado" name="estado" value={values.estado}
        onChange={(e) => setField('estado', e.target.value)} options={ESTADO_OPTIONS_BASICO} required error={errors.estado} />
    </div>
  );

  return (
    <CrudPage
      title="Usuario Rol"
      description="Asignación de roles a usuarios."
      newLabel="+ Asignar rol"
      recurso="usuarioRol"
      columns={columns}
      searchFields={['usuario', 'nombre_usuario', 'rol']}
      emptyRecord={{ id_usuario: '', id_rol: '', estado: 'ACTIVO' }}
      validate={(v) =>
        validateForm(v, {
          id_usuario: [required('Seleccione un usuario')],
          id_rol: [required('Seleccione un rol')],
          estado: [required('Seleccione un estado')],
        })
      }
      renderForm={renderForm}
    />
  );
}
