/**
 * excel.js — [V9 §1/§6] Lectura y exportación de archivos Excel.
 *
 * Usa SheetJS desde el paquete oficial parcheado (cdn.sheetjs.com), no la
 * versión de npm, que arrastra vulnerabilidades conocidas sin corregir.
 *
 * La librería se carga BAJO DEMANDA (import dinámico): pesa ~500 kB y solo hace
 * falta cuando alguien exporta un reporte o sube un archivo, así que no debe
 * entrar en el paquete inicial de la aplicación.
 */
let xlsxPromise;
function cargarXLSX() {
  if (!xlsxPromise) xlsxPromise = import('xlsx');
  return xlsxPromise;
}

/** Nombre de archivo seguro y con fecha: "reporte-de-diesel-2026-08-11.xlsx". */
function nombreArchivo(titulo, extension = 'xlsx') {
  const hoy = new Date();
  const fecha = new Date(hoy.getTime() - hoy.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const base = String(titulo || 'reporte')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')   // sin tildes
    .replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase();
  return `${base || 'reporte'}-${fecha}.${extension}`;
}

/**
 * exportarExcel — descarga una hoja de cálculo.
 *
 * @param {string} titulo   nombre del reporte (da nombre al archivo y a la hoja)
 * @param {Array<{label:string,get:(fila:any)=>any}>} columnas
 * @param {Array<object>} filas
 * @param {object} [opciones] { meta: [[etiqueta, valor], ...] } filas de
 *   encabezado que se escriben antes de la tabla (filtros aplicados, usuario…).
 */
export async function exportarExcel(titulo, columnas, filas, opciones = {}) {
  const cols = (columnas || []).filter(Boolean);
  if (!cols.length) return;
  const XLSX = await cargarXLSX();

  const cuerpo = (filas || []).map((f) => cols.map((c) => {
    const v = typeof c.get === 'function' ? c.get(f) : f[c.key];
    return v === null || v === undefined ? '' : v;
  }));

  const encabezado = [[titulo]];
  (opciones.meta || []).forEach(([etiqueta, valor]) => {
    if (valor !== undefined && valor !== null && valor !== '') encabezado.push([`${etiqueta}:`, String(valor)]);
  });
  encabezado.push([]); // línea en blanco antes de la tabla

  const datos = [...encabezado, cols.map((c) => c.label), ...cuerpo];
  const hoja = XLSX.utils.aoa_to_sheet(datos);

  // Ancho de columna aproximado al contenido más largo (con tope).
  hoja['!cols'] = cols.map((c, i) => {
    const largos = cuerpo.map((f) => String(f[i] ?? '').length);
    return { wch: Math.min(46, Math.max(12, c.label.length + 2, ...largos)) };
  });

  const libro = XLSX.utils.book_new();
  // El nombre de hoja de Excel admite 31 caracteres y no acepta : \ / ? * [ ]
  const nombreHoja = String(titulo).replace(/[:\\/?*[\]]/g, '').slice(0, 31) || 'Reporte';
  XLSX.utils.book_append_sheet(libro, hoja, nombreHoja);
  XLSX.writeFile(libro, nombreArchivo(titulo));
}

/**
 * leerExcel — lee la primera hoja de un archivo (.xlsx, .xls o .csv) y la
 * devuelve como matriz de filas. No interpreta encabezados: eso lo decide
 * quien la usa (la carga masiva trabaja por posición de columna).
 *
 * @param {File} archivo
 * @returns {Promise<Array<Array<any>>>}
 */
export async function leerExcel(archivo) {
  const XLSX = await cargarXLSX();
  const buffer = await archivo.arrayBuffer();
  const libro = XLSX.read(buffer, { type: 'array', cellDates: true });
  const hoja = libro.Sheets[libro.SheetNames[0]];
  if (!hoja) return [];
  return XLSX.utils.sheet_to_json(hoja, { header: 1, blankrows: false, defval: '' });
}

/** Descarga una plantilla de ejemplo para la carga masiva de viajes locales. */
export async function descargarPlantillaViajes() {
  const XLSX = await cargarXLSX();
  const datos = [
    ['LICENCIA', 'TIPCA', 'PLACA', 'PUNTO', 'PESO', 'FECHA', 'VALOR'],
    ['1234567890101', 'CABEZAL', 'P123ABC', 235, 12500.5, '31/07/2026', 1250.75],
  ];
  const hoja = XLSX.utils.aoa_to_sheet(datos);
  hoja['!cols'] = [{ wch: 18 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 12 }];
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, 'Viajes');
  XLSX.writeFile(libro, 'plantilla-carga-viajes-locales.xlsx');
}

export default { exportarExcel, leerExcel, descargarPlantillaViajes };
