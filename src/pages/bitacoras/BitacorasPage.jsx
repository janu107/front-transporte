/**
 * BitacorasPage.jsx
 * Visualización simulada de bitácoras / auditoría con filtros por módulo,
 * operación, usuario y rango de fechas.
 */
import { useEffect, useState, useCallback } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/common/DataTable';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import bitacorasService from '../../services/bitacoras.service';
import { formatDateTime } from '../../utils/formatters';

const OPERACION_OPTIONS = [
  { value: 'INSERT', label: 'INSERT' },
  { value: 'UPDATE', label: 'UPDATE' },
  { value: 'DELETE', label: 'DELETE' },
];

const OP_BADGE = { INSERT: 'activo', UPDATE: 'pendiente', DELETE: 'anulado' };

const EMPTY_FILTERS = { modulo: '', operacion: '', usuario: '', fechaInicio: '', fechaFin: '' };

export default function BitacorasPage() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const setField = (name, value) => setFilters((p) => ({ ...p, [name]: value }));

  const search = useCallback(async (f) => {
    setLoading(true);
    const data = await bitacorasService.list(f);
    setRows(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    search(EMPTY_FILTERS);
  }, [search]);

  const handleSearch = () => search(filters);
  const handleClear = () => { setFilters(EMPTY_FILTERS); search(EMPTY_FILTERS); };

  const columns = [
    { key: 'bitacora_id', label: 'ID' },
    { key: 'operacion', label: 'Operación', render: (v) => <span className={`badge badge-${OP_BADGE[v] || 'neutral'}`}>{v}</span> },
    { key: 'modulo', label: 'Módulo' },
    { key: 'codigo', label: 'Código/Correlativo' },
    { key: 'usuario_accion', label: 'Usuario acción' },
    { key: 'fecha_hora_accion', label: 'Fecha/hora acción', render: (v) => formatDateTime(v) },
  ];

  return (
    <div>
      <PageHeader title="Bitácoras" description="Auditoría de acciones del sistema (simulada)." />

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body">
          <div className="form-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <Input label="Tabla / Módulo" name="modulo" value={filters.modulo}
              onChange={(e) => setField('modulo', e.target.value)} placeholder="Ej. man_poliza" />
            <Select label="Operación" name="operacion" value={filters.operacion}
              onChange={(e) => setField('operacion', e.target.value)} options={OPERACION_OPTIONS} placeholder="Todas" />
            <Input label="Usuario acción" name="usuario" value={filters.usuario}
              onChange={(e) => setField('usuario', e.target.value)} placeholder="Ej. admin" />
            <Input label="Fecha inicio" name="fechaInicio" type="date" value={filters.fechaInicio}
              onChange={(e) => setField('fechaInicio', e.target.value)} />
            <Input label="Fecha fin" name="fechaFin" type="date" value={filters.fechaFin}
              onChange={(e) => setField('fechaFin', e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={handleClear}>Limpiar</Button>
            <Button variant="primary" icon="🔍" onClick={handleSearch}>Buscar</Button>
          </div>
        </div>
      </div>

      <DataTable columns={columns} data={rows} loading={loading} idField="bitacora_id"
        emptyTitle="Sin bitácoras" emptyMessage="No hay registros para los filtros aplicados." />
    </div>
  );
}
