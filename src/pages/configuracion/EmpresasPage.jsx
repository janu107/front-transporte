/**
 * EmpresasPage.jsx — con_empresas
 * (codigo, nit, nombre, direccion, telefono, correo, estado).
 */
import CrudPage from '../../components/common/CrudPage';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';
import { validateForm, required, email } from '../../utils/validators';
import { ESTADO_OPTIONS_BASICO } from '../../utils/constants';

const columns = [
  { key: 'codigo', label: 'Código' },
  { key: 'nit', label: 'NIT' },
  { key: 'nombre', label: 'Nombre' },
  { key: 'telefono', label: 'Teléfono' },
  { key: 'correo', label: 'Correo' },
  { key: 'estado', label: 'Estado', render: (v) => <Badge value={v} /> },
];

function renderForm({ values, setField, errors }) {
  return (
    <div className="form-grid">
      <Input label="Nombre" name="nombre" value={values.nombre}
        onChange={(e) => setField('nombre', e.target.value)} required error={errors.nombre} />
      <Input label="NIT" name="nit" value={values.nit}
        onChange={(e) => setField('nit', e.target.value)} error={errors.nit} />
      <Input label="Teléfono" name="telefono" value={values.telefono}
        onChange={(e) => setField('telefono', e.target.value)} error={errors.telefono} />
      <Input label="Correo" name="correo" type="email" value={values.correo}
        onChange={(e) => setField('correo', e.target.value)} error={errors.correo} />
      <Input className="col-span-2" label="Dirección" name="direccion" value={values.direccion}
        onChange={(e) => setField('direccion', e.target.value)} error={errors.direccion} />
      <Select className="col-span-2" label="Estado" name="estado" value={values.estado}
        onChange={(e) => setField('estado', e.target.value)} options={ESTADO_OPTIONS_BASICO} required error={errors.estado} />
    </div>
  );
}

export default function EmpresasPage() {
  return (
    <CrudPage
      title="Empresas"
      description="Configuración de empresas."
      newLabel="+ Nueva empresa"
      recurso="empresas"
      columns={columns}
      searchFields={['nombre', 'nit', 'correo']}
      emptyRecord={{ nombre: '', nit: '', telefono: '', correo: '', direccion: '', estado: 'ACTIVO' }}
      validate={(v) =>
        validateForm(v, {
          nombre: [required('El nombre es obligatorio')],
          correo: [email('Correo no válido')],
          estado: [required('Seleccione un estado')],
        })
      }
      renderForm={renderForm}
    />
  );
}
