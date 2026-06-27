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
}) {
  const { items, loading, message, create, update, remove, patchEstado } = useCrudMock(recurso);
  const { term, setTerm, filtered } = useSearch(items, searchFields);
  const modal = useModal();
  const confirm = useModal();

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
    modal.open(null);
  };

  const openEdit = (row) => {
    setValues({ ...emptyRecord, ...row });
    setErrors({});
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
      <PageHeader title={title} description={description} actionLabel={newLabel} onAction={openNew} />

      {message && <div className={`alert alert-${message.type === 'error' ? 'error' : 'success'}`}>{message.text}</div>}

      <div className="toolbar">
        <SearchBar value={term} onChange={setTerm} placeholder={searchPlaceholder} />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        idField={idField}
        renderActions={(row) => (
          <RowActions
            onEdit={() => openEdit(row)}
            onDelete={() => confirm.open(row)}
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
