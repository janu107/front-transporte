/**
 * UsuarioForm.jsx
 * Formulario de usuario (adm_usuarios). La contraseña solo se muestra al crear.
 * Nunca se listan contraseñas en tablas.
 */
import Input from '../common/Input';
import Select from '../common/Select';
import { ESTADO_OPTIONS_USUARIO } from '../../utils/constants';

export function UsuarioForm({ values, setField, errors, isEdit }) {
  return (
    <div className="form-grid">
      <Input
        label="Usuario"
        name="usuario"
        value={values.usuario}
        onChange={(e) => setField('usuario', e.target.value)}
        required
        error={errors.usuario}
        disabled={isEdit}
      />
      <Input
        label="Nombre"
        name="nombre"
        value={values.nombre}
        onChange={(e) => setField('nombre', e.target.value)}
        required
        error={errors.nombre}
      />
      <Input
        label="Correo"
        name="correo"
        type="email"
        value={values.correo}
        onChange={(e) => setField('correo', e.target.value)}
        error={errors.correo}
      />
      <Input
        label="Puesto"
        name="puesto"
        value={values.puesto}
        onChange={(e) => setField('puesto', e.target.value)}
        error={errors.puesto}
      />
      <Input
        label="Fecha de inicio"
        name="fecha_inicio"
        type="date"
        value={values.fecha_inicio}
        onChange={(e) => setField('fecha_inicio', e.target.value)}
        error={errors.fecha_inicio}
      />
      <Select
        label="Estado"
        name="estado"
        value={values.estado}
        onChange={(e) => setField('estado', e.target.value)}
        options={ESTADO_OPTIONS_USUARIO}
        required
        error={errors.estado}
      />

      {/* La contraseña solo se solicita al crear. Para cambiarla en edición existe
          la acción "Cambiar contraseña" en la página de usuarios. */}
      {!isEdit && (
        <Input
          className="col-span-2"
          label="Contraseña"
          name="contrasena"
          type="password"
          value={values.contrasena}
          onChange={(e) => setField('contrasena', e.target.value)}
          required
          error={errors.contrasena}
          placeholder="Defina una contraseña inicial"
        />
      )}
    </div>
  );
}

export default UsuarioForm;
