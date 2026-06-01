/**
 * AnticipoProvisionForm.jsx
 * Formulario de anticipo/provisión (pro_anticipo_provision).
 */
import Input from '../common/Input';
import Select from '../common/Select';
import { ESTADO_OPTIONS_FACTURA } from '../../utils/constants';

export function AnticipoProvisionForm({
  values, setField, errors,
  polizaOptions = [], transportistaOptions = [], camionOptions = [], pilotoOptions = [], tipoOptions = [],
}) {
  return (
    <div className="form-grid">
      <Input label="Número de anticipo" name="num_anticipo" value={values.num_anticipo}
        onChange={(e) => setField('num_anticipo', e.target.value)} required error={errors.num_anticipo} />
      <Select label="Póliza" name="id_poliza" value={values.id_poliza}
        onChange={(e) => setField('id_poliza', e.target.value)} options={polizaOptions} required error={errors.id_poliza} />
      <Select label="Transportista" name="id_transportista" value={values.id_transportista}
        onChange={(e) => setField('id_transportista', e.target.value)} options={transportistaOptions} required error={errors.id_transportista} />
      <Select label="Camión" name="id_camion" value={values.id_camion}
        onChange={(e) => setField('id_camion', e.target.value)} options={camionOptions} error={errors.id_camion} />
      <Select label="Piloto" name="id_piloto" value={values.id_piloto}
        onChange={(e) => setField('id_piloto', e.target.value)} options={pilotoOptions} error={errors.id_piloto} />
      <Select label="Tipo anticipo/provisión" name="id_tipo_anticipo_provision" value={values.id_tipo_anticipo_provision}
        onChange={(e) => setField('id_tipo_anticipo_provision', e.target.value)} options={tipoOptions} required error={errors.id_tipo_anticipo_provision} />
      <Input label="Fecha" name="fecha" type="date" value={values.fecha}
        onChange={(e) => setField('fecha', e.target.value)} required error={errors.fecha} />
      <Input label="Valor" name="valor" type="number" min={0} step="0.01" value={values.valor}
        onChange={(e) => setField('valor', e.target.value)} required error={errors.valor} />
      <Select label="Estado" name="estado" value={values.estado}
        onChange={(e) => setField('estado', e.target.value)} options={ESTADO_OPTIONS_FACTURA} required error={errors.estado} />
      <Input className="col-span-2" label="Descripción" name="descripcion" value={values.descripcion}
        onChange={(e) => setField('descripcion', e.target.value)} error={errors.descripcion} />
    </div>
  );
}

export default AnticipoProvisionForm;
