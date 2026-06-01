/**
 * PolizaDetallePage.jsx — pro_poliza_detalle (idField: correlativo).
 * Detalle de póliza / envíos. Selects de póliza, transportista, camión, piloto y tarifa.
 */
import CrudPage from '../../components/common/CrudPage';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';
import useRelated, { toOptions } from '../../hooks/useRelated';
import { lookup, formatDate, formatCurrency } from '../../utils/formatters';
import { validateForm, required, nonNegative } from '../../utils/validators';
import { ESTADO_OPTIONS_PROCESO } from '../../utils/constants';

export default function PolizaDetallePage() {
  const { polizas = [], transportistas = [], camiones = [], pilotos = [], tarifaEmbarque = [] } = useRelated({
    polizas: 'polizas',
    transportistas: 'transportistas',
    camiones: 'camiones',
    pilotos: 'pilotos',
    tarifaEmbarque: 'tarifaEmbarque',
  });

  const polizaOptions = toOptions(polizas, { value: 'codigo', label: 'nombre_poliza' });
  const transportistaOptions = toOptions(transportistas, { value: 'codigo', label: 'nombre_comercial' });
  const camionOptions = toOptions(camiones, { value: 'codigo', label: 'placa' });
  const pilotoOptions = toOptions(pilotos, { value: 'codigo', labelFn: (p) => `${p.nombres} ${p.apellidos}` });
  const tarifaOptions = toOptions(tarifaEmbarque);

  const columns = [
    { key: 'correlativo', label: 'Corr.' },
    { key: 'num_envio', label: 'N° Envío' },
    { key: 'id_poliza', label: 'Póliza', render: (v) => lookup(polizas, v, 'codigo', 'nombre_poliza') },
    { key: 'id_transportista', label: 'Transportista', render: (v) => lookup(transportistas, v, 'codigo', 'nombre_comercial') },
    { key: 'fecha', label: 'Fecha', render: (v) => formatDate(v) },
    { key: 'valor', label: 'Valor', render: (v) => formatCurrency(v) },
    { key: 'estado', label: 'Estado', render: (v) => <Badge value={v} /> },
  ];

  const renderForm = ({ values, setField, errors }) => (
    <div className="form-grid">
      <Input label="Número de envío" name="num_envio" value={values.num_envio}
        onChange={(e) => setField('num_envio', e.target.value)} required error={errors.num_envio} />
      <Select label="Póliza" name="id_poliza" value={values.id_poliza}
        onChange={(e) => setField('id_poliza', e.target.value)} options={polizaOptions} required error={errors.id_poliza} />
      <Select label="Transportista" name="id_transportista" value={values.id_transportista}
        onChange={(e) => setField('id_transportista', e.target.value)} options={transportistaOptions} required error={errors.id_transportista} />
      <Select label="Camión" name="id_camion" value={values.id_camion}
        onChange={(e) => setField('id_camion', e.target.value)} options={camionOptions} error={errors.id_camion} />
      <Select label="Piloto" name="id_piloto" value={values.id_piloto}
        onChange={(e) => setField('id_piloto', e.target.value)} options={pilotoOptions} error={errors.id_piloto} />
      <Select label="Tarifa de embarque" name="id_tarifa_embarque" value={values.id_tarifa_embarque}
        onChange={(e) => setField('id_tarifa_embarque', e.target.value)} options={tarifaOptions} error={errors.id_tarifa_embarque} />
      <Input label="Fecha" name="fecha" type="date" value={values.fecha}
        onChange={(e) => setField('fecha', e.target.value)} required error={errors.fecha} />
      <Input label="Tipo" name="tipo" value={values.tipo}
        onChange={(e) => setField('tipo', e.target.value)} error={errors.tipo} placeholder="ENVÍO" />
      <Input label="Cantidad bultos/piezas" name="cantidad_bultos_piezas" type="number" min={0} value={values.cantidad_bultos_piezas}
        onChange={(e) => setField('cantidad_bultos_piezas', e.target.value)} error={errors.cantidad_bultos_piezas} />
      <Input label="Peso" name="peso" type="number" min={0} step="0.01" value={values.peso}
        onChange={(e) => setField('peso', e.target.value)} error={errors.peso} />
      <Input label="Valor" name="valor" type="number" min={0} step="0.01" value={values.valor}
        onChange={(e) => setField('valor', e.target.value)} required error={errors.valor} />
      <Select label="Estado" name="estado" value={values.estado}
        onChange={(e) => setField('estado', e.target.value)} options={ESTADO_OPTIONS_PROCESO} required error={errors.estado} />
      <Input className="col-span-2" label="Observaciones" name="observaciones" value={values.observaciones}
        onChange={(e) => setField('observaciones', e.target.value)} error={errors.observaciones} />
    </div>
  );

  return (
    <CrudPage
      title="Detalle de Póliza / Envíos"
      description="Registro de envíos asociados a las pólizas."
      newLabel="+ Nuevo envío"
      recurso="polizaDetalle"
      idField="correlativo"
      modalSize="lg"
      deleteMode="anular"
      anularEstado="ANULADA"
      columns={columns}
      searchFields={['num_envio', 'tipo', 'observaciones']}
      emptyRecord={{
        num_envio: '', id_poliza: '', id_transportista: '', id_camion: '', id_piloto: '',
        id_tarifa_embarque: '', fecha: '', tipo: 'ENVÍO', cantidad_bultos_piezas: 0,
        peso: 0, valor: 0, estado: 'PENDIENTE', observaciones: '',
      }}
      validate={(v) =>
        validateForm(v, {
          num_envio: [required('El número de envío es obligatorio')],
          id_poliza: [required('Seleccione una póliza')],
          id_transportista: [required('Seleccione un transportista')],
          fecha: [required('La fecha es obligatoria')],
          valor: [required('El valor es obligatorio'), nonNegative('No puede ser negativo')],
        })
      }
      renderForm={renderForm}
    />
  );
}
