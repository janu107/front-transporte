/**
 * validators.js
 * Validaciones visuales reutilizables para los formularios controlados.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isEmpty = (v) => v === undefined || v === null || String(v).trim() === '';

export const isEmail = (v) => EMAIL_REGEX.test(String(v).trim());

export const isNegative = (v) => Number(v) < 0;

/**
 * validateForm
 * Ejecuta un conjunto de reglas sobre un objeto de valores.
 * @param {object} values  valores del formulario
 * @param {object} rules   { campo: [reglas] } donde cada regla es { test, message }
 * @returns {object} errores { campo: mensaje }
 *
 * Helpers de regla disponibles: required, email, nonNegative.
 */
export function validateForm(values, rules) {
  const errors = {};
  Object.entries(rules).forEach(([field, fieldRules]) => {
    for (const rule of fieldRules) {
      if (!rule.test(values[field], values)) {
        errors[field] = rule.message;
        break;
      }
    }
  });
  return errors;
}

// Reglas predefinidas
export const required = (message = 'Este campo es obligatorio') => ({
  test: (v) => !isEmpty(v),
  message,
});

export const email = (message = 'Correo no válido') => ({
  test: (v) => isEmpty(v) || isEmail(v),
  message,
});

export const nonNegative = (message = 'No se permiten valores negativos') => ({
  test: (v) => isEmpty(v) || !isNegative(v),
  message,
});

export const minValue = (min, message) => ({
  test: (v) => isEmpty(v) || Number(v) >= min,
  message: message || `El valor mínimo es ${min}`,
});
