/**
 * CrudPage.jsx
 * Página CRUD genérica reutilizable. Orquesta: PageHeader, buscador, DataTable,
 * Modal de crear/editar (con un formulario inyectado) y ConfirmDialog.
 *
 * Props principales:
 *  - title, description, newLabel
 *  - recurso: clave del recurso en mockApi/mockData
 *  - idField: 'codigo' | 'correlativo' | ...
 *  - columns: columnas para DataTable
 *  - searchFields: campos sobre los que busca el SearchBar
 *  - emptyRecord: objeto con valores por defecto al crear
 *  - validate(values): => { campo: error }
 *  - transform(values): => values normalizados antes de guardar (opcional)
 *  - renderForm({ values, setField, errors }): JSX del formulario
 *  - modalSize: tamaño del modal
 *  - deleteMode: 'delete' (eliminar) | 'anular' (cambiar estado a ANULADA/ANULADO)
 *  - anularEstado: estado a aplicar cuando deleteMode='anular' (default 'ANULADA')
 *  - canDelete(row): habilita/inhabilita borrado por fila (opcional)
 */
import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import PageHeader from '../layout/PageHeader';
import SearchBar from './SearchBar';
import DataTable from './DataTable';
import Modal from './Modal';
import Button from './Button';
import ConfirmDialog from './ConfirmDialog';
import RowActions from './RowActions';
import realApi from '../../api/realApi';
import useCrudMock from '../../hooks/useCrudMock';
import useSearch from '../../hooks/useSearch';
import useModal from '../../hooks/useModal';
import useAuth from '../../hooks/useAuth';
import { puedeCrearEn, puedeEditarEn, puedeEliminar } from '../../utils/roles';
import { imprimirReporteGenerico } from '../../utils/impresionDocs';
import { exportarExcel } from '../../utils/excel';

export function CrudPage({
  title,
  description,
  newLabel = '+ Nuevo',
  recurso,
  idField = 'codigo',
  columns,
  searchFields,
  emptyRecord = {},
  validate = () => ({}),
  transform,
  renderForm,
  modalSize = 'md',
  deleteMode = 'delete',
  anularEstado = 'ANULADA',
  searchPlaceholder = 'Buscar...',
  printable = true,
  extraActions, // (row) => JSX: acciones adicionales por fila (antes de editar/eliminar)
}) {
  const { items, loading, message, create, update, remove, patchEstado, clearMessage } = useCrudMock(recurso);
  const { term, setTerm, filtered } = useSearch(items, searchFields);
  const { user } = useAuth();
  const location = useLocation();
  // Permisos del módulo de esta pantalla, separados a propósito: hay roles que
  // pueden dar de alta pero no modificar lo ya registrado (p. ej. OPERA_VIAJES en
  // Pólizas). Si se juntaran, se le mostraría un lápiz que el servidor rechaza.
  const conAlta = puedeCrearEn(user, location.pathname);
  const conEdicion = puedeEditarEn(user, location.pathname);
  const conBorrado = puedeEliminar(user, location.pathname);
  const modal = useModal();
  const confirm = useModal();

  // Estados que la columna admite DE VERDAD. Las tablas de producción no son
  // todas iguales (unas usan ENUM con su propia lista) y una lista fija en la
  // pantalla termina ofreciendo valores que la base rechaza al guardar.
  const [estadosBD, setEstadosBD] = useState(null);
  useEffect(() => {
    let vigente = true;
    (async () => {
      try {
        const r = await realApi.estadosPermitidos(recurso);
        if (vigente && r?.valores?.length) setEstadosBD(r.valores);
      } catch {
        // Si no se puede consultar, cada pantalla usa sus valores de siempre.
      }
    })();
    return () => { vigente = false; };
  }, [recurso]);

  const estadoOptions = useMemo(
    () => (estadosBD ? estadosBD.map((v) => ({ value: v, label: v })) : null),
    [estadosBD]
  );

  /** El estado con el que esta tabla "anula", según lo que tenga disponible. */
  const estadoAnular = useMemo(() => {
    if (!estadosBD) return anularEstado;
    const mayus = estadosBD.map((v) => v.toUpperCase());
    const preferido = ['ANULADA', 'ANULADO', 'INACTIVO', 'INACTIVA']
      .find((v) => mayus.includes(v));
    if (preferido) return estadosBD[mayus.indexOf(preferido)];
    // Sin ninguno de esos, sirve cualquiera que no sea el estado activo.
    return estadosBD.find((v) => v.toUpperCase() !== 'ACTIVO') || anularEstado;
  }, [estadosBD, anularEstado]);

  /** Ajusta el estado inicial de un registro nuevo a uno que la base acepte. */
  const conEstadoValido = (registro) => {
    if (!estadosBD || registro.estado === undefined) return registro;
    const mayus = estadosBD.map((v) => v.toUpperCase());
    if (mayus.includes(String(registro.estado).toUpperCase())) return registro;
    const activo = estadosBD[mayus.indexOf('ACTIVO')];
    return { ...registro, estado: activo || estadosBD[0] };
  };

  // [v6 §2] Imprime el listado actual (filtrado) con el formato de reporte estándar
  // (logo, usuario/terminal, fecha). Usa las columnas visibles de la tabla.
  const columnasSalida = () => (columns || []).map((c) => ({
    label: c.label,
    get: (row) => (c.print ? c.print(row) : (row[c.key] ?? '')),
  }));

  const imprimir = () => imprimirReporteGenerico(
    title, columnasSalida(), filtered, user?.nombre || user?.usuario || ''
  );

  // [V9 §6] Exporta el listado tal como se ve (con la búsqueda aplicada).
  const exportar = () => exportarExcel(title, columnasSalida(), filtered, {
    meta: [['Usuario', user?.nombre || user?.usuario || ''], ['Búsqueda', term || ''],
      ['Registros', filtered.length]],
  });

  const [values, setValues] = useState(emptyRecord);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const isEdit = Boolean(modal.data);

  const setField = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const openNew = () => {
    setValues(conEstadoValido(emptyRecord));
    setErrors({});
    clearMessage();
    modal.open(null);
  };

  const openEdit = (row) => {
    setValues({ ...emptyRecord, ...row });
    setErrors({});
    clearMessage();
    modal.open(row);
  };

  const handleSave = async () => {
    const validationErrors = validate(values);
    const clean = Object.fromEntries(Object.entries(validationErrors).filter(([, v]) => v));
    if (Object.keys(clean).length > 0) {
      setErrors(clean);
      return;
    }
    setSaving(true);
    try {
      const payload = transform ? transform(values) : values;
      if (isEdit) {
        await update(modal.data[idField], payload);
      } else {
        await create(payload);
      }
      modal.close();
    } catch {
      // useCrudMock ya muestra y registra el error; se evita una promesa rechazada sin manejar.
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    const row = confirm.data;
    if (deleteMode === 'anular') {
      await patchEstado(row[idField], estadoAnular);
    } else {
      await remove(row[idField]);
    }
    confirm.close();
  };

  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        actionLabel={conAlta ? newLabel : undefined}
        onAction={conAlta ? openNew : undefined}
      />

      {message && <div className={`alert alert-${message.type === 'error' ? 'error' : 'success'}`}>{message.text}</div>}

      <div className="toolbar" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <SearchBar value={term} onChange={setTerm} placeholder={searchPlaceholder} />
        </div>
        {printable && (
          <>
            <Button variant="secondary" icon="📊" onClick={exportar} disabled={loading || !filtered.length}>
              Excel
            </Button>
            <Button variant="secondary" icon="🖨️" onClick={imprimir} disabled={loading || !filtered.length}>
              Imprimir
            </Button>
          </>
        )}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        idField={idField}
        // La columna se muestra si el rol puede editar o borrar, o si la pantalla
        // aporta acciones propias (p. ej. la carga masiva de Pólizas).
        renderActions={(!conEdicion && !conBorrado && !extraActions) ? undefined : (row) => (
          <RowActions
            extra={extraActions ? extraActions(row) : undefined}
            onEdit={conEdicion ? () => openEdit(row) : undefined}
            // Eliminar/anular solo para quien tiene ese permiso (ADMIN).
            onDelete={conBorrado ? () => confirm.open(row) : undefined}
            deleteIcon={deleteMode === 'anular' ? '🚫' : '🗑️'}
            deleteTitle={deleteMode === 'anular' ? 'Anular' : 'Eliminar'}
          />
        )}
      />

      <Modal
        isOpen={modal.isOpen}
        onClose={modal.close}
        size={modalSize}
        title={isEdit ? `Editar ${title}` : `Nuevo ${title}`}
        footer={
          <>
            <Button variant="secondary" onClick={modal.close} disabled={saving}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </>
        }
      >
        {/* El error va DENTRO del modal: en la página quedaría detrás del
            diálogo y no se vería por qué no se guardó. */}
        {message?.type === 'error' && (
          <div className="alert alert-error" style={{ marginTop: 0 }}>{message.text}</div>
        )}
        {/* `estadoOptions` va solo si se pudo consultar: así el formulario
            conserva su lista por defecto cuando no se sabe. */}
        {renderForm({ values, setField, errors, isEdit, estadoOptions: estadoOptions || undefined })}
      </Modal>

      <ConfirmDialog
        isOpen={confirm.isOpen}
        onClose={confirm.close}
        onConfirm={handleConfirmDelete}
        title={deleteMode === 'anular' ? 'Anular registro' : 'Eliminar registro'}
        confirmText={deleteMode === 'anular' ? 'Anular' : 'Eliminar'}
        message={
          deleteMode === 'anular'
            ? '¿Está seguro de anular este registro? Cambiará su estado.'
            : '¿Está seguro de eliminar este registro? Esta acción no se puede deshacer.'
        }
      />
    </div>
  );
}

export default CrudPage;
