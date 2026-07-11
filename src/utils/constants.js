/**
 * constants.js
 * Constantes compartidas del frontend: estados permitidos y opciones de selects.
 */

export const ESTADOS = {
  ACTIVO: 'ACTIVO',
  INACTIVO: 'INACTIVO',
  BLOQUEADO: 'BLOQUEADO',
  ABIERTA: 'ABIERTA',
  LIQUIDADA: 'LIQUIDADA',
  ANULADA: 'ANULADA',
  PENDIENTE: 'PENDIENTE',
  PAGADA: 'PAGADA',
};

// Opciones reutilizables para selects de estado.
export const ESTADO_OPTIONS_BASICO = [
  { value: 'ACTIVO', label: 'ACTIVO' },
  { value: 'INACTIVO', label: 'INACTIVO' },
];

export const ESTADO_OPTIONS_USUARIO = [
  { value: 'ACTIVO', label: 'ACTIVO' },
  { value: 'INACTIVO', label: 'INACTIVO' },
  { value: 'BLOQUEADO', label: 'BLOQUEADO' },
];

export const ESTADO_OPTIONS_POLIZA = [
  { value: 'ABIERTA', label: 'ABIERTA' },
  { value: 'LIQUIDADA', label: 'LIQUIDADA' },
  { value: 'ANULADA', label: 'ANULADA' },
];

export const ESTADO_OPTIONS_PROCESO = [
  { value: 'PENDIENTE', label: 'PENDIENTE' },
  { value: 'LIQUIDADA', label: 'LIQUIDADA' },
  { value: 'ANULADA', label: 'ANULADA' },
];

export const ESTADO_OPTIONS_FACTURA = [
  { value: 'PENDIENTE', label: 'PENDIENTE' },
  { value: 'PAGADA', label: 'PAGADA' },
  { value: 'ANULADA', label: 'ANULADA' },
];

export const ESTADO_OPTIONS_LIQUIDACION = [
  { value: 'PENDIENTE', label: 'PENDIENTE' },
  { value: 'LIQUIDADA', label: 'LIQUIDADA' },
  { value: 'ANULADA', label: 'ANULADA' },
];

// Registro de Viajes (Detalle de Póliza / Envíos)
export const TIPO_VIAJE_OPTIONS = [
  { value: 'Viajes Locales', label: 'Viajes Locales' },
  { value: 'Carta de Porte', label: 'Carta de Porte' },
  { value: 'Exportacion', label: 'Exportación' },
];

// VALOR = PESO (kg) × COEFICIENTE_VALOR_VIAJE  (debe coincidir con el backend).
export const COEFICIENTE_VALOR_VIAJE = 0.0043;

export const TIPO_LICENCIA_OPTIONS = [
  { value: 'A', label: 'Tipo A' },
  { value: 'B', label: 'Tipo B' },
  { value: 'C', label: 'Tipo C' },
  { value: 'M', label: 'Tipo M' },
];

// Credenciales simuladas para el login (solo fase visual).
export const MOCK_CREDENTIALS = {
  usuario: 'admin',
  password: 'Admin123!',
};

export const APP_NAME = 'Sistema Administrativo de Transporte';
