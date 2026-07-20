/**
 * ParametrosPage.jsx — con_parametros (fila única codigo=1).
 * Pantalla tipo formulario de configuración general (no listado).
 */
import { useEffect, useState } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import configuracionService from '../../services/configuracion.service';
import { validateForm, required, email, nonNegative } from '../../utils/validators';

const EMPTY = {
  codigo: 1, nombre_empresa: '', nit: '', telefono: '', correo: '',
  iva: 0, porcentaje_pagos: 0, isr: 0, nombre_administrador: '',
};

export default function ParametrosPage() {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await configuracionService.getParametros();
        setValues({ ...EMPTY, ...(data || {}) });
      } catch (e) {
        // Sin esto, un fallo dejaba la pantalla colgada en "Cargando..." para siempre.
        setMessage({
          type: 'error',
          text: e?.userMessage || e?.response?.data?.message || 'No se pudieron cargar los parámetros. Revise su conexión o vuelva a intentar.',
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const setField = (name, value) => {
    setValues((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: undefined }));
  };

  const handleSave = async () => {
    const errs = Object.fromEntries(
      Object.entries(
        validateForm(values, {
          nombre_empresa: [required('El nombre de la empresa es obligatorio')],
          correo: [email('Correo no válido')],
          iva: [nonNegative('El IVA no puede ser negativo')],
          porcentaje_pagos: [nonNegative('No puede ser negativo')],
          isr: [nonNegative('El ISR no puede ser negativo')],
        })
      ).filter(([, v]) => v)
    );
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    try {
      await configuracionService.updateParametros(values);
      setMessage({ type: 'success', text: 'Parámetros guardados correctamente.' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Cargando parámetros...</div>;

  return (
    <div>
      <PageHeader title="Parámetros" description="Configuración general del sistema (única)." />
      {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

      <div className="card" style={{ maxWidth: 760 }}>
        <div className="card-body">
          <div className="config-section-title">Datos de la empresa</div>
          <div className="form-grid">
            <Input className="col-span-2" label="Nombre de la empresa" name="nombre_empresa" value={values.nombre_empresa}
              onChange={(e) => setField('nombre_empresa', e.target.value)} required error={errors.nombre_empresa} />
            <Input label="NIT" name="nit" value={values.nit}
              onChange={(e) => setField('nit', e.target.value)} error={errors.nit} />
            <Input label="Teléfono" name="telefono" value={values.telefono}
              onChange={(e) => setField('telefono', e.target.value)} error={errors.telefono} />
            <Input className="col-span-2" label="Correo" name="correo" type="email" value={values.correo}
              onChange={(e) => setField('correo', e.target.value)} error={errors.correo} />
          </div>

          <div className="config-section-title">Parámetros financieros</div>
          <div className="form-grid">
            <Input label="IVA (%)" name="iva" type="number" min={0} step="0.01" value={values.iva}
              onChange={(e) => setField('iva', e.target.value)} error={errors.iva} />
            <Input label="Porcentaje de pagos (%)" name="porcentaje_pagos" type="number" min={0} step="0.01" value={values.porcentaje_pagos}
              onChange={(e) => setField('porcentaje_pagos', e.target.value)} error={errors.porcentaje_pagos} />
            <Input label="ISR (%)" name="isr" type="number" min={0} step="0.01" value={values.isr}
              onChange={(e) => setField('isr', e.target.value)} error={errors.isr} />
            <Input label="Nombre del administrador" name="nombre_administrador" value={values.nombre_administrador}
              onChange={(e) => setField('nombre_administrador', e.target.value)} error={errors.nombre_administrador} />
          </div>

          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Button variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar parámetros'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
