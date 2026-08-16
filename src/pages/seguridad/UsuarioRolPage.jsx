/**
 * UsuarioRolPage.jsx — Asignación de roles a usuarios (adm_usuario_rol).
 *
 * Un usuario puede tener VARIOS roles: sus permisos son la unión de todos.
 * La pantalla muestra un renglón por usuario y, al asignar, se marcan con
 * casillas todos los roles que le corresponden en una sola operación.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/common/Button';
import SearchBar from '../../components/common/SearchBar';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import realApi from '../../api/realApi';
import { OPERACIONES_POR_ROL } from '../../utils/permisos';

/** Qué hace cada rol, para que se entienda al asignarlo. */
const DESCRIPCION = {
  ADMIN: 'Acceso total al sistema, incluida la eliminación de registros.',
  OPERA_VIAJES: 'Registro de cartas de porte y viajes locales.',
  OPERA_VALES: 'Registro de vales de diesel y anticipos.',
  OPERA_LIQUIDACION: 'Liquidación de pólizas, sobregiros y sus reportes.',
  CONSULTAS: 'Solo consulta: no puede crear ni editar registros.',
};

export default function UsuarioRolPage() {
  const [filas, setFilas] = useState([]);
  const [roles, setRoles] = useState([]);
  const [term, setTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [editando, setEditando] = useState(null);   // usuario en edición
  const [seleccion, setSeleccion] = useState([]);   // ids de rol marcados

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [porUsuario, listaRoles] = await Promise.all([
        realApi.usuarioRolPorUsuario(),
        realApi.list('roles'),
      ]);
      setFilas(porUsuario);
      setRoles(listaRoles.filter((r) => String(r.estado).toUpperCase() === 'ACTIVO'));
    } catch (e) {
      setMessage({ type: 'error', text: e?.userMessage || 'No se pudieron cargar las asignaciones.' });
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const filtradas = useMemo(() => {
    const q = term.trim().toLowerCase();
    if (!q) return filas;
    return filas.filter((f) => [f.usuario, f.nombre_usuario, (f.roles || []).join(' ')]
      .some((c) => String(c ?? '').toLowerCase().includes(q)));
  }, [filas, term]);

  const abrir = (fila) => {
    setEditando(fila);
    // Se marcan los roles que el usuario ya tiene activos.
    const asignados = roles
      .filter((r) => (fila.roles || []).includes(r.tipo_rol))
      .map((r) => r.codigo);
    setSeleccion(asignados);
    setMessage(null);
  };

  const alternar = (idRol) => setSeleccion((prev) => (prev.includes(idRol)
    ? prev.filter((x) => x !== idRol)
    : [...prev, idRol]));

  const guardar = async () => {
    if (!editando || saving) return;
    setSaving(true); setMessage(null);
    try {
      const r = await realApi.usuarioRolAsignar(editando.id_usuario, seleccion);
      setMessage({
        type: 'success',
        text: r.roles?.length
          ? `${editando.usuario}: ${r.roles.join(', ')}.`
          : `${editando.usuario} quedó sin roles asignados.`,
      });
      setEditando(null);
      await cargar();
    } catch (e) {
      setMessage({ type: 'error', text: e?.userMessage || e?.response?.data?.message || 'No se pudieron guardar los roles.' });
    } finally { setSaving(false); }
  };

  return (
    <div>
      <PageHeader title="Usuario Rol"
        description="Asignación de roles a usuarios. Un usuario puede tener varios roles: sus permisos se suman." />
      {message && <div className={`alert alert-${message.type === 'error' ? 'error' : 'success'}`}>{message.text}</div>}

      <div className="toolbar" style={{ alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 300px', maxWidth: 420 }}>
          <SearchBar value={term} onChange={setTerm} placeholder="Buscar por usuario, nombre o rol..." />
        </div>
        <Button variant="secondary" icon="🔄" onClick={cargar} disabled={loading}>Actualizar</Button>
      </div>

      <div className="table-wrapper table-wrapper--cards"><div className="table-scroll">
        <table className="data-table">
          <thead><tr>
            <th>Usuario</th><th>Nombre</th><th>Roles asignados</th><th>Estado</th>
            <th className="col-actions">Acciones</th>
          </tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 36 }}>Cargando...</td></tr>
            ) : filtradas.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 36, color: '#6b7280' }}>
                {filas.length === 0 ? 'No hay usuarios.' : 'Sin resultados para la búsqueda.'}
              </td></tr>
            ) : filtradas.map((f) => (
              <tr key={f.id_usuario}>
                <td data-label="Usuario">{f.usuario}</td>
                <td data-label="Nombre">{f.nombre_usuario}</td>
                <td data-label="Roles asignados">
                  {(f.roles || []).length === 0
                    ? <span className="text-muted">Sin roles</span>
                    : (
                      <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {f.roles.map((r) => <span key={r} className="badge badge-activo">{r}</span>)}
                      </span>
                    )}
                </td>
                <td data-label="Estado"><Badge value={f.estado_usuario} /></td>
                <td className="col-actions">
                  <Button variant="secondary" size="sm" icon="🛡️" onClick={() => abrir(f)}>
                    Asignar roles
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div></div>

      <Modal
        isOpen={Boolean(editando)}
        onClose={() => setEditando(null)}
        size="md"
        title={editando ? `Roles de ${editando.usuario}` : 'Asignar roles'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditando(null)} disabled={saving}>Cancelar</Button>
            <Button variant="primary" icon="💾" onClick={guardar} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar roles'}
            </Button>
          </>
        }
      >
        {editando && (
          <>
            <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 14px' }}>
              Marque todos los roles que le corresponden a <b>{editando.nombre_usuario}</b>.
              Si asigna varios, los permisos se suman.
            </p>
            <div className="roles-lista">
              {roles.map((r) => {
                const marcado = seleccion.includes(r.codigo);
                const ops = OPERACIONES_POR_ROL[String(r.tipo_rol).toUpperCase()] || [];
                return (
                  <label key={r.codigo} className={`rol-item ${marcado ? 'activo' : ''}`}>
                    <input type="checkbox" checked={marcado} onChange={() => alternar(r.codigo)} />
                    <span>
                      <span className="rol-nombre">{r.tipo_rol}</span>
                      <span className="rol-desc">
                        {DESCRIPCION[String(r.tipo_rol).toUpperCase()] || r.descripcion || ''}
                      </span>
                      {ops.length > 0 && (
                        <span className="rol-ops">Puede: {ops.join(' · ').toLowerCase()}</span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
            {seleccion.length === 0 && (
              <div className="alert alert-error" style={{ marginTop: 14, marginBottom: 0 }}>
                Sin ningún rol marcado, el usuario no podrá entrar a ningún módulo.
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}
