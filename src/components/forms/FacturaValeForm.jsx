/**
 * FacturaValeForm.jsx
 * Formulario de factura/vale (man_facturas_vales). Selects de producto y bomba.
 *
 * El SALDO está en UNIDADES (galones), no en quetzales: es el combustible que
 * queda por despachar. Cada vale que se emite le resta sus galones.
 */
import { useEffect, useRef } from 'react';
import Input from '../common/Input';
import Select from '../common/Select';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { ESTADO_OPTIONS_FACTURA_VALE } from '../../utils/constants';

export function FacturaValeForm({
  values, setField, errors, isEdit = false,
  productoOptions = [], bombaOptions = [],
  // Los estados los decide la pantalla según lo que admita la columna; la
  // lista fija queda solo como respaldo.
  estadoOptions = ESTADO_OPTIONS_FACTURA_VALE,
}) {
  const unidades = Number(values.unidades) || 0;
  const precio = Number(values.precio) || 0;
  const saldo = Number(values.saldo) || 0;

  // Lo YA DESPACHADO lo calcula el servidor con la cuenta del área:
  //   SUM(cantidad) de los vales en estado ACTIVO de esta factura.
  const tieneCuenta = values.despachado !== undefined && values.despachado !== null;
  const despachado = Number(values.despachado) || 0;
  const saldoCuenta = tieneCuenta ? Number((unidades - despachado).toFixed(2)) : null;
  // Se despachó más de lo comprado: el saldo sale negativo. No es un error de
  // cálculo, es una inconsistencia de los datos que hay que ver.
  const sobregirada = tieneCuenta && despachado > unidades;

  // [2026-09] El SALDO se lleva en UNIDADES (galones por despachar), no en
  // quetzales. Antes se sugería unidades × precio, y por eso una factura de
  // 5,000 galones nacía con saldo 62,229.33: un monto, no galones.
  //
  // El campo SIEMPRE muestra el saldo que da la cuenta:
  //   al crear   → unidades (nada despachado todavía)
  //   al editar  → unidades − despachados
  // Antes, al editar se respetaba el guardado y había que pulsar un botón para
  // corregirlo; ahora se refleja de una vez en el campo, y el aviso de abajo
  // solo explica de dónde salió.
  const saldoPrevio = useRef(null);
  useEffect(() => {
    const calculado = isEdit ? saldoCuenta : Number(unidades.toFixed(2));
    if (calculado === null || calculado === undefined) return;
    if (Math.abs(saldo - calculado) < 0.01) return;
    // Se recuerda el guardado solo la primera vez, para poder decir de qué
    // valor se ajustó.
    if (saldoPrevio.current === null) saldoPrevio.current = saldo;
    setField('saldo', calculado);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unidades, despachado, isEdit, tieneCuenta]);

  // Hubo ajuste: el guardado no era el de la cuenta.
  const ajustado = isEdit && tieneCuenta && saldoPrevio.current !== null
    && Math.abs(saldoPrevio.current - saldoCuenta) >= 0.01;

  return (
    <div className="form-grid">
      <Input label="Factura" name="factura" value={values.factura}
        onChange={(e) => setField('factura', e.target.value)} required error={errors.factura} />
      <Select label="Producto" name="id_producto" value={values.id_producto}
        onChange={(e) => setField('id_producto', e.target.value)} options={productoOptions} required error={errors.id_producto} />
      <Select label="Bomba" name="id_bomba" value={values.id_bomba}
        onChange={(e) => setField('id_bomba', e.target.value)} options={bombaOptions} required error={errors.id_bomba} />
      <Input label="Fecha" name="fecha" type="date" value={values.fecha}
        onChange={(e) => setField('fecha', e.target.value)} required error={errors.fecha} />
      <Input label="Unidades compradas (galones)" name="unidades" type="number" min={0} step="0.01"
        value={values.unidades}
        onChange={(e) => setField('unidades', e.target.value)} error={errors.unidades} />
      <Input label="Precio por galón" name="precio" type="number" min={0} step="0.01" value={values.precio}
        onChange={(e) => setField('precio', e.target.value)} error={errors.precio}
        hint={unidades > 0 && precio > 0 ? `Compra: ${formatCurrency(unidades * precio)}` : undefined} />
      {/* El saldo que se ve es el de la cuenta: unidades − despachados. */}
      <Input label="Saldo (galones por despachar)" name="saldo" type="number" step="0.01"
        value={values.saldo}
        onChange={(e) => setField('saldo', e.target.value)} error={errors.saldo}
        hint={!isEdit ? 'Arranca igual a las unidades compradas'
          : tieneCuenta
            ? `${formatNumber(unidades)} compradas − ${formatNumber(despachado)} despachados`
            : `De ${formatNumber(unidades)} gal compradas`} />

      {/* Se explica de dónde salió el número que quedó en el campo. */}
      {ajustado && (
        <div className="col-span-2 alert alert-warning" style={{ margin: 0 }}>
          El saldo se ajustó de <b>{formatNumber(saldoPrevio.current)} gal</b> a{' '}
          <b>{formatNumber(saldoCuenta)} gal</b>, que es lo que da la cuenta:{' '}
          {formatNumber(unidades)} compradas − {formatNumber(despachado)} despachados.
          {Math.abs(saldoPrevio.current - unidades * precio) < 1
            && ' El anterior era unidades × precio, de cuando el saldo se llevaba en quetzales.'}
          {' '}Guarde para dejarlo así.
        </div>
      )}

      {/* Despachado de más: hay que revisarlo, no solo guardarlo. */}
      {sobregirada && (
        <div className="col-span-2 alert alert-error" style={{ margin: 0 }}>
          <b>Se despacharon más galones de los comprados.</b> Esta factura tiene{' '}
          {formatNumber(unidades)} gal, pero ya se despacharon{' '}
          {formatNumber(despachado)} gal, así que el saldo queda en{' '}
          {formatNumber(saldoCuenta)} gal. Revise si las unidades quedaron mal
          capturadas o si hay vales cobrados a esta factura que eran de otra.
        </div>
      )}
      <Select label="Estado" name="estado" value={values.estado}
        onChange={(e) => setField('estado', e.target.value)}
        options={estadoOptions} required error={errors.estado} />
      <Input className="col-span-2" label="Descripción de compra" name="descripcion_compra" value={values.descripcion_compra}
        onChange={(e) => setField('descripcion_compra', e.target.value)} error={errors.descripcion_compra} />
    </div>
  );
}

export default FacturaValeForm;
