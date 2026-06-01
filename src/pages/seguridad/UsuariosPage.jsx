/**
 * UsuariosPage.jsx — adm_usuarios.
 * CRUD de usuarios con acciones extra: activar/inactivar y cambiar contraseña.
 * No se muestran contraseñas en la tabla; el campo solo aparece al crear o al cambiar.
 */
import { useState } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import SearchBar from '../../components/common/SearchBar';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Input from '../../components/common/Input';
import UsuarioForm from '../../components/forms/UsuarioForm';
import useCrudMock from '../../hooks/useCrudMock';
import useSearch from '../../hooks/useSearch';
import useModal from '../../hooks/useModal';
import { formatDate } from '../../utils/formatters';
import { validateForm, required, email } from '../../utils/validators';

const EMPTY = { usuario: '', nombre: '', correo: '', puesto: '', fecha_inicio: '', estado: 'ACTIVO', contrasena: '' };

export default function UsuariosPage() {
  const { items, loading, message, create, update, patchEstado } = useCrudMock('usuarios');
  const { term, setTerm, filtered } = useSearch(items, ['usuario', 'nombre', 'correo', 'puesto']);
  const modal = useModal();
  const pwdModal = useModal();

  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [pwd, setPwd] = useState('');
  const [pwdError, setPwdError] = useState('');

  const isEdit = Boolean(modal.data);
  const setField = (name, value) => {
    setValues((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: undefined }));
  };

  const openNew = () => { setValues(EMPTY); setErrors({}); modal.open(null); };
  const openEdit = (row) => { setValues({ ...EMPTY, ...row, contrasena: '' }); setErrors({}); modal.open(row); };

  const handleSave = async () => {
    const rules = {
      usuario: [required('El usuario es obligatorio')],
      nombre: [required('El nombre es obligatorio')],
      correo: [email('Correo no válido')],
      estado: [required('Seleccione un estado')],
    };
    if (!isEdit) rules.contrasena = [required('La contraseña es obligatoria')];
    const errs = Object.fromEntries(Object.entries(validateForm(values, rules)).filter(([, v]) => v));
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    try {
      const payload = { ...values };
      // No persistimos la contraseña en el mock (no se muestra ni se guarda en tabla).
      delete payload.contrasena;
      if (isEdit) await update(modal.data.codigo, payload);
      else await create({ ...payload, debe_cambiar_pwd: true });
      modal.close();
    } finally {
      setSaving(false);
    }
  };

  const toggleEstado = (row) => {
    const nuevo = row.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    patchEstado(row.codigo, nuevo);
  };

  const openPwd = (row) => { setPwd(''); setPwdError(''); pwdModal.open(row); };
  const handlePwdSave = async () => {
    if (!pwd) { setPwdError('Ingrese la nueva contraseña'); return; }
    // En esta fase no se persiste la contraseña (solo confirmación visual).
    await update(pwdModal.data.codigo, { debe_cambiar_pwd: false });
    pwdModal.close();
  };

  const columns = [
    { key: 'codigo', label: 'Código' },
    { key: 'usuario', label: 'Usuario' },
    { key: 'nombre', label: 'Nombre' },
    { key: 'correo', label: 'Correo' },
    { key: 'puesto', label: 'Puesto' },
    { key: 'fecha_inicio', label: 'Fecha inicio', render: (v) => formatDate(v) },
    { key: 'estado', label: 'Estado', render: (v) => <Badge value={v} /> },
  ];

  return (
    <div>
      <PageHeader title="Usuarios" description="Gestión de usuarios del sistema." actionLabel="+ Nuevo usuario" onAction={openNew} />
      {message && <div className={`alert alert-${message.type === 'error' ? 'error' : 'success'}`}>{message.text}</div>}

      <div className="toolbar">
        <SearchBar value={term} onChange={setTerm} placeholder="Buscar por usuario, nombre o correo..." />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        renderActions={(row) => (
          <div className="row-actions">
            <button className="icon-btn edit" title="Editar" onClick={() => openEdit(row)}>✏️</button>
            <button className="icon-btn" title="Cambiar contraseña" onClick={() => openPwd(row)}>🔑</button>
            <button
              className="icon-btn"
              title={row.estado === 'ACTIVO' ? 'Inactivar' : 'Activar'}
              onClick={() => toggleEstado(row)}
            >
              {row.estado === 'ACTIVO' ? '⏸️' : '▶️'}
            </button>
          </div>
        )}
      />

      <Modal
        isOpen={modal.isOpen}
        onClose={modal.close}
        title={isEdit ? 'Editar usuario' : 'Nuevo usuario'}
        footer={
          <>
            <Button variant="secondary" onClick={modal.close} disabled={saving}>Cancelar</Button>
            <Button variant="primary" onClick={handleSave} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
          </>
        }
      >
        <UsuarioForm values={values} setField={setField} errors={errors} isEdit={isEdit} />
      </Modal>

      <Modal
        isOpen={pwdModal.isOpen}
        onClose={pwdModal.close}
        size="sm"
        title={`Cambiar contraseña — ${pwdModal.data?.usuario || ''}`}
        footer={
          <>
            <Button variant="secondary" onClick={pwdModal.close}>Cancelar</Button>
            <Button variant="primary" onClick={handlePwdSave}>Guardar</Button>
          </>
        }
      >
        <Input
          label="Nueva contraseña"
          name="pwd"
          type="password"
          value={pwd}
          onChange={(e) => { setPwd(e.target.value); setPwdError(''); }}
          required
          error={pwdError}
          placeholder="Ingrese la nueva contraseña"
        />
      </Modal>
    </div>
  );
}
