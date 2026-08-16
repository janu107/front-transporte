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
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import PageHeader from '../layout/PageHeader';
import SearchBar from './SearchBar';
import DataTable from './DataTable';
import Modal from './Modal';
import Button from './Button';
import ConfirmDialog from './ConfirmDialog';
import RowActions from './RowActions';
import useCrudMock from '../../hooks/useCrudMock';
import useSearch from '../../hooks/useSearch';
import useModal from '../../hooks/useModal';
import useAuth from '../../hooks/useAuth';
import { esSoloLectura, puedeEliminar } from '../../utils/roles';
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
  // Permisos del módulo de esta pantalla: quien solo consulta no ve los botones
  // de crear/editar, y solo ADMIN ve el de eliminar. Igual lo valida el servidor.
  const readonly = esSoloLectura(user, location.pathname);
  const conBorrado = puedeEliminar(user, location.pathname);
  const modal = useModal();
  const confirm = useModal();

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
    setValues(emptyRecord);
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
      await patchEstado(row[idField], anularEstado);
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
        actionLabel={readonly ? undefined : newLabel}
        onAction={readonly ? undefined : openNew}
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
        // La columna se muestra si el rol puede editar o si la pantalla aporta
        // acciones propias (p. ej. la carga masiva de Pólizas, permitida a todos).
        renderActions={(readonly && !extraActions) ? undefined : (row) => (
          <RowActions
            extra={extraActions ? extraActions(row) : undefined}
            onEdit={readonly ? undefined : () => openEdit(row)}
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
        {renderForm({ values, setField, errors, isEdit })}
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
