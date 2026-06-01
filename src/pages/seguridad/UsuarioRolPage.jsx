/**
 * UsuarioRolPage.jsx — adm_usuario_rol.
 * Asigna roles a usuarios y permite cambiar el estado de la asignación.
 */
import CrudPage from '../../components/common/CrudPage';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';
import useRelated, { toOptions } from '../../hooks/useRelated';
import { validateForm, required } from '../../utils/validators';
import { ESTADO_OPTIONS_BASICO } from '../../utils/constants';

export default function UsuarioRolPage() {
  const { usuarios = [], roles = [] } = useRelated({ usuarios: 'usuarios', roles: 'roles' });

  const usuarioOptions = toOptions(usuarios, { value: 'usuario', label: 'nombre' });
  const rolOptions = toOptions(roles, { value: 'tipo_rol', label: 'tipo_rol' });

  const columns = [
    { key: 'codigo', label: 'Código' },
    { key: 'usuario', label: 'Usuario' },
    { key: 'rol', label: 'Rol' },
    { key: 'estado', label: 'Estado', render: (v) => <Badge value={v} /> },
  ];

  const renderForm = ({ values, setField, errors }) => (
    <div className="form-grid">
      <Select label="Usuario" name="usuario" value={values.usuario}
        onChange={(e) => setField('usuario', e.target.value)} options={usuarioOptions} required error={errors.usuario} />
      <Select label="Rol" name="rol" value={values.rol}
        onChange={(e) => setField('rol', e.target.value)} options={rolOptions} required error={errors.rol} />
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
      searchFields={['usuario', 'rol']}
      emptyRecord={{ usuario: '', rol: '', estado: 'ACTIVO' }}
      validate={(v) =>
        validateForm(v, {
          usuario: [required('Seleccione un usuario')],
          rol: [required('Seleccione un rol')],
          estado: [required('Seleccione un estado')],
        })
      }
      renderForm={renderForm}
    />
  );
}
