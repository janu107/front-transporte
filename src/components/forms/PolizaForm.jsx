/**
 * PolizaForm.jsx
 * Formulario de póliza (man_poliza). Selects de empresa y producto.
 * peso_total se calcula visualmente a partir del peso en kilogramos (apoyo visual).
 * fecha_liquidacion solo es relevante cuando el estado es LIQUIDADA.
 */
import { useEffect } from 'react';
import Input from '../common/Input';
import Select from '../common/Select';
import { ESTADO_OPTIONS_POLIZA } from '../../utils/constants';

export function PolizaForm({ values, setField, errors, empresaOptions = [], productoOptions = [] }) {
  // Apoyo visual: peso_total = peso en kilogramos.
  useEffect(() => {
    const total = Number(values.peso_kilogramos) || 0;
    if (Number(values.peso_total) !== total) {
      setField('peso_total', total);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.peso_kilogramos]);

  return (
    <div className="form-grid">
      <Input className="col-span-2" label="Nombre de la póliza" name="nombre_poliza" value={values.nombre_poliza}
        onChange={(e) => setField('nombre_poliza', e.target.value)} required error={errors.nombre_poliza} />
      <Select label="Empresa" name="id_empresa" value={values.id_empresa}
        onChange={(e) => setField('id_empresa', e.target.value)} options={empresaOptions} required error={errors.id_empresa} />
      <Select label="Producto" name="id_producto" value={values.id_producto}
        onChange={(e) => setField('id_producto', e.target.value)} options={productoOptions} required error={errors.id_producto} />
      <Input label="Fecha" name="fecha" type="date" value={values.fecha}
        onChange={(e) => setField('fecha', e.target.value)} required error={errors.fecha} />
      <Input label="Fecha de liquidación" name="fecha_liquidacion" type="date" value={values.fecha_liquidacion}
        onChange={(e) => setField('fecha_liquidacion', e.target.value)} error={errors.fecha_liquidacion} />
      <Input label="Cantidad bultos" name="cantidad_bultos" type="number" min={0} value={values.cantidad_bultos}
        onChange={(e) => setField('cantidad_bultos', e.target.value)} error={errors.cantidad_bultos} />
      <Input label="Cantidad piezas" name="cantidad_piezas" type="number" min={0} value={values.cantidad_piezas}
        onChange={(e) => setField('cantidad_piezas', e.target.value)} error={errors.cantidad_piezas} />
      <Input label="Peso quintales" name="peso_quintales" type="number" min={0} value={values.peso_quintales}
        onChange={(e) => setField('peso_quintales', e.target.value)} error={errors.peso_quintales} />
      <Input label="Peso kilogramos" name="peso_kilogramos" type="number" min={0} value={values.peso_kilogramos}
        onChange={(e) => setField('peso_kilogramos', e.target.value)} error={errors.peso_kilogramos} />
      <Input label="Peso total (kg)" name="peso_total" type="number" value={values.peso_total} disabled
        onChange={() => {}} />
      <Select label="Estado" name="estado" value={values.estado}
        onChange={(e) => setField('estado', e.target.value)} options={ESTADO_OPTIONS_POLIZA} required error={errors.estado} />
      <Input className="col-span-2" label="Descripción" name="descripcion" value={values.descripcion}
        onChange={(e) => setField('descripcion', e.target.value)} error={errors.descripcion} />
    </div>
  );
}

export default PolizaForm;
