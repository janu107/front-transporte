/**
 * mockData.js
 * Datos de ejemplo coherentes entre módulos para la fase visual del frontend.
 * Sirven de semilla para mockApi.js (que mantiene el estado en memoria).
 *
 * Las contraseñas NUNCA se incluyen aquí (no se muestran ni se simulan en tablas).
 */

// ============================ SEGURIDAD ============================
export const usuarios = [
  {
    codigo: 1,
    usuario: 'admin',
    nombre: 'Administrador',
    correo: 'admin@apptransporte.com',
    estado: 'ACTIVO',
    puesto: 'Administrador',
    fecha_inicio: '2024-01-15',
    debe_cambiar_pwd: false,
  },
  {
    codigo: 2,
    usuario: 'joperaciones',
    nombre: 'Jorge Ramírez',
    correo: 'jramirez@apptransporte.com',
    estado: 'ACTIVO',
    puesto: 'Operaciones',
    fecha_inicio: '2024-03-01',
    debe_cambiar_pwd: true,
  },
];

export const roles = [
  { codigo: 1, tipo_rol: 'ADMIN', descripcion: 'Administrador del sistema', estado: 'ACTIVO' },
  { codigo: 2, tipo_rol: 'OPERADOR', descripcion: 'Operador de procesos', estado: 'ACTIVO' },
];

export const usuarioRol = [
  { codigo: 1, id_usuario: 1, rol: 'ADMIN', usuario: 'admin', estado: 'ACTIVO' },
  { codigo: 2, id_usuario: 2, rol: 'OPERADOR', usuario: 'joperaciones', estado: 'ACTIVO' },
];

// ============================ CATÁLOGOS ============================
export const tipoCamion = [
  { codigo: 1, descripcion: 'Cisterna' },
  { codigo: 2, descripcion: 'Furgón' },
];

export const tipoProducto = [
  { codigo: 1, descripcion: 'Combustible' },
  { codigo: 2, descripcion: 'Carga general' },
];

export const tipoAnticipoProvision = [
  { codigo: 1, descripcion: 'Anticipo viático' },
  { codigo: 2, descripcion: 'Provisión combustible' },
];

export const ubicacionBomba = [
  { codigo: 1, descripcion: 'Estación Central', direccion: 'Km 12 Carretera al Atlántico', encargado: 'Carlos Pérez' },
  { codigo: 2, descripcion: 'Estación Sur', direccion: 'Zona 12, Ciudad', encargado: 'Ana López' },
];

export const productos = [
  { codigo: 1, descripcion: 'Diesel', id_tipo_producto: 1 },
  { codigo: 2, descripcion: 'Gasolina Súper', id_tipo_producto: 1 },
];

export const bombas = [
  { codigo: 1, id_ubicacion: 1, descripcion: 'Bomba 1 - Diesel', mangueras: 2, id_producto: 1 },
  { codigo: 2, id_ubicacion: 2, descripcion: 'Bomba 2 - Súper', mangueras: 3, id_producto: 2 },
];

export const tarifaEmbarque = [
  { codigo: 1, descripcion: 'Ciudad - Puerto', origen: 'Ciudad', destino: 'Puerto Quetzal', valor: 1500.0, estado: 'ACTIVO' },
  { codigo: 2, descripcion: 'Ciudad - Frontera', origen: 'Ciudad', destino: 'Tecún Umán', valor: 2200.0, estado: 'ACTIVO' },
];

// ========================== CONFIGURACIÓN ==========================
export const empresas = [
  {
    codigo: 1,
    nit: '1234567-8',
    nombre: 'Transportes del Norte S.A.',
    direccion: 'Zona 1, Ciudad',
    telefono: '2222-3333',
    correo: 'contacto@tnorte.com',
    estado: 'ACTIVO',
  },
  {
    codigo: 2,
    nit: '9090909-1',
    nombre: 'Distribuidora El Sur',
    direccion: 'Zona 12, Ciudad',
    telefono: '2444-5566',
    correo: 'ventas@elsur.com',
    estado: 'ACTIVO',
  },
];

export const parametros = {
  codigo: 1,
  nombre_empresa: 'APP Transporte',
  nit: '1234567-8',
  telefono: '2222-3333',
  correo: 'admin@apptransporte.com',
  iva: 12.0,
  porcentaje_pagos: 5.0,
  isr: 5.0,
  nombre_administrador: 'Administrador',
};

// ========================= MANTENIMIENTOS =========================
export const transportistas = [
  {
    codigo: 1,
    nombre_comercial: 'Fletes Rápidos',
    nit: '7654321-0',
    nombres: 'Mario',
    apellidos: 'García',
    direccion: 'Zona 7, Ciudad',
    telefono: '5555-1111',
    correo: 'mario@fletes.com',
    impuesto: 12.0,
    estado: 'ACTIVO',
  },
  {
    codigo: 2,
    nombre_comercial: 'Cargas Express',
    nit: '9988776-5',
    nombres: 'Lucía',
    apellidos: 'Méndez',
    direccion: 'Zona 4, Ciudad',
    telefono: '5555-2222',
    correo: 'lucia@cargas.com',
    impuesto: 12.0,
    estado: 'ACTIVO',
  },
];

export const pilotos = [
  {
    codigo: 1,
    nombres: 'Pedro',
    apellidos: 'López',
    id_transportista: 1,
    licencia: 'A-123456',
    tipo_licencia: 'A',
    fecha_vigencia: '2026-08-30',
    direccion: 'Zona 6, Ciudad',
    telefono: '5555-3333',
    estado: 'ACTIVO',
  },
  {
    codigo: 2,
    nombres: 'Juan',
    apellidos: 'Castillo',
    id_transportista: 2,
    licencia: 'B-987654',
    tipo_licencia: 'B',
    fecha_vigencia: '2027-01-15',
    direccion: 'Zona 18, Ciudad',
    telefono: '5555-4444',
    estado: 'ACTIVO',
  },
];

export const camiones = [
  {
    codigo: 1,
    placa: 'C-123ABC',
    id_transportista: 1,
    id_tipo_camion: 1,
    marca: 'Volvo',
    color: 'Blanco',
    anio: 2020,
  },
  {
    codigo: 2,
    placa: 'C-456DEF',
    id_transportista: 2,
    id_tipo_camion: 2,
    marca: 'Hino',
    color: 'Azul',
    anio: 2021,
  },
];

export const polizas = [
  {
    codigo: 1,
    nombre_poliza: 'Póliza Combustible Q1',
    id_empresa: 1,
    id_producto: 1,
    fecha: '2025-01-10',
    fecha_liquidacion: null,
    descripcion: 'Transporte de diesel a puerto',
    cantidad_bultos: 0,
    cantidad_piezas: 0,
    peso_quintales: 200,
    peso_kilogramos: 9200,
    peso_total: 9200,
    estado: 'ABIERTA',
  },
  {
    codigo: 2,
    nombre_poliza: 'Póliza Carga General',
    id_empresa: 2,
    id_producto: 2,
    fecha: '2025-02-05',
    fecha_liquidacion: '2025-03-01',
    descripcion: 'Carga general zona sur',
    cantidad_bultos: 120,
    cantidad_piezas: 480,
    peso_quintales: 150,
    peso_kilogramos: 6900,
    peso_total: 6900,
    estado: 'LIQUIDADA',
  },
];

export const facturasVales = [
  {
    codigo: 1,
    factura: 'F-0001',
    id_producto: 1,
    id_bomba: 1,
    descripcion_compra: 'Carga de diesel',
    fecha: '2025-01-12',
    unidades: 100,
    precio: 35.5,
    saldo: 3550.0,
    estado: 'PENDIENTE',
  },
  {
    codigo: 2,
    factura: 'F-0002',
    id_producto: 2,
    id_bomba: 2,
    descripcion_compra: 'Carga de gasolina súper',
    fecha: '2025-02-08',
    unidades: 80,
    precio: 38.0,
    saldo: 0.0,
    estado: 'PAGADA',
  },
];

// ============================ PROCESOS ============================
export const polizaDetalle = [
  {
    correlativo: 1,
    num_envio: 'ENV-001',
    id_poliza: 1,
    id_transportista: 1,
    id_camion: 1,
    id_piloto: 1,
    id_tarifa_embarque: 1,
    fecha: '2025-01-15',
    tipo: 'ENVÍO',
    cantidad_bultos_piezas: 50,
    peso: 4600,
    valor: 1500.0,
    estado: 'PENDIENTE',
    observaciones: 'Primer envío de la póliza',
  },
  {
    correlativo: 2,
    num_envio: 'ENV-002',
    id_poliza: 2,
    id_transportista: 2,
    id_camion: 2,
    id_piloto: 2,
    id_tarifa_embarque: 2,
    fecha: '2025-02-10',
    tipo: 'ENVÍO',
    cantidad_bultos_piezas: 120,
    peso: 6900,
    valor: 2200.0,
    estado: 'LIQUIDADA',
    observaciones: '',
  },
];

export const anticipoProvision = [
  {
    correlativo: 1,
    num_anticipo: 'ANT-001',
    id_poliza: 1,
    id_transportista: 1,
    id_camion: 1,
    id_piloto: 1,
    id_tipo_anticipo_provision: 1,
    fecha: '2025-01-14',
    valor: 500.0,
    estado: 'PENDIENTE',
    descripcion: 'Anticipo viático envío 1',
  },
  {
    correlativo: 2,
    num_anticipo: 'ANT-002',
    id_poliza: 2,
    id_transportista: 2,
    id_camion: 2,
    id_piloto: 2,
    id_tipo_anticipo_provision: 2,
    fecha: '2025-02-09',
    valor: 800.0,
    estado: 'PAGADA',
    descripcion: 'Provisión combustible',
  },
];

export const detalleFacturas = [
  {
    correlativo: 1,
    num_vale: 'VAL-001',
    id_factura_vale: 1,
    id_poliza: 1,
    id_transportista: 1,
    id_camion: 1,
    id_piloto: 1,
    fecha: '2025-01-16',
    cantidad: 50,
    total: 1775.0,
  },
  {
    correlativo: 2,
    num_vale: 'VAL-002',
    id_factura_vale: 2,
    id_poliza: 2,
    id_transportista: 2,
    id_camion: 2,
    id_piloto: 2,
    fecha: '2025-02-11',
    cantidad: 40,
    total: 1520.0,
  },
];

export const liquidaciones = [
  {
    correlativo: 1,
    num_liquidacion: 'LIQ-001',
    id_poliza: 2,
    id_transportista: 2,
    cantidad_viajes: 1,
    valor_viajes: 2200.0,
    cantidad_vale: 1,
    valor_vales: 1520.0,
    cantidad_anticipos: 1,
    valor_anticipos: 800.0,
    valor_liquidacion: 2920.0, // 2200 + 1520 - 800
    estado: 'LIQUIDADA',
    fecha_liquidacion: '2025-03-01',
  },
  {
    correlativo: 2,
    num_liquidacion: 'LIQ-002',
    id_poliza: 1,
    id_transportista: 1,
    cantidad_viajes: 1,
    valor_viajes: 1500.0,
    cantidad_vale: 1,
    valor_vales: 1775.0,
    cantidad_anticipos: 1,
    valor_anticipos: 500.0,
    valor_liquidacion: 2775.0, // 1500 + 1775 - 500
    estado: 'PENDIENTE',
    fecha_liquidacion: null,
  },
];

// ============================ BITÁCORAS ============================
export const bitacoras = [
  {
    bitacora_id: 1,
    operacion: 'INSERT',
    modulo: 'adm_usuarios',
    codigo: 2,
    usuario_accion: 'admin',
    fecha_hora_accion: '2025-03-01 09:12:00',
  },
  {
    bitacora_id: 2,
    operacion: 'UPDATE',
    modulo: 'man_poliza',
    codigo: 2,
    usuario_accion: 'admin',
    fecha_hora_accion: '2025-03-01 10:45:00',
  },
  {
    bitacora_id: 3,
    operacion: 'INSERT',
    modulo: 'pro_liquidaciones',
    codigo: 1,
    usuario_accion: 'joperaciones',
    fecha_hora_accion: '2025-03-01 11:05:00',
  },
  {
    bitacora_id: 4,
    operacion: 'DELETE',
    modulo: 'cat_bombas',
    codigo: 3,
    usuario_accion: 'admin',
    fecha_hora_accion: '2025-03-02 08:30:00',
  },
];

// Estado inicial consolidado por clave de recurso (usado por mockApi.js)
export const initialData = {
  usuarios,
  roles,
  usuarioRol,
  tipoCamion,
  tipoProducto,
  tipoAnticipoProvision,
  ubicacionBomba,
  productos,
  bombas,
  tarifaEmbarque,
  empresas,
  parametros,
  transportistas,
  pilotos,
  camiones,
  polizas,
  facturasVales,
  polizaDetalle,
  anticipoProvision,
  detalleFacturas,
  liquidaciones,
  bitacoras,
};

export default initialData;
