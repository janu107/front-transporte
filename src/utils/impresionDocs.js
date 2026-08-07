/**
 * impresionDocs.js
 * Generación e impresión de documentos (Carta de Porte y Vale de Anticipo) usando
 * una ventana nueva + CSS @page + window.print(). No requiere librerías externas.
 *
 * Nota: los campos que el esquema actual no modela (predio origen/destino, No. de
 * factura del vale) se dejan como marcadores para completar según la regla de negocio.
 */
import { logoAbsUrl } from '../components/common/Logo';

const MESES = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
  'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];

const esc = (v) => String(v ?? '').replace(/[&<>"]/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
));

function partesFecha(fecha) {
  const d = fecha ? new Date(fecha) : new Date();
  if (Number.isNaN(d.getTime())) return { dia: '--', mes: '--', anio: '----', mesNombre: '' };
  return { dia: String(d.getDate()).padStart(2, '0'), mes: String(d.getMonth() + 1).padStart(2, '0'), anio: d.getFullYear(), mesNombre: MESES[d.getMonth()] };
}
function fechaEnLetras(fecha, ciudad = 'ESCUINTLA') {
  const p = partesFecha(fecha);
  return `${ciudad}, ${p.dia} de ${p.mesNombre} del ${p.anio}`;
}
// Fecha y hora de impresión: DD/MM/YYYY HH:mm:ss
function fechaHoraImpresion() {
  const p = partesFecha(new Date());
  return `${p.dia}/${p.mes}/${p.anio} ${new Date().toLocaleTimeString('es-GT', { hour12: false })}`;
}
const q = (n) => `Q ${Number(n || 0).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatNum = (n) => Number(n || 0).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
// [v5] "Terminal" no existe como concepto en el sistema (es web); se muestra un
// texto fijo en el encabezado de los reportes, junto al usuario, como pidió el cliente.
const TERMINAL = 'WEB';

/** Arma el documento completo (HTML + estilos) de un reporte. */
function documentoHtml(titulo, estilos, cuerpo) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(titulo)}</title>
    <style>
      * { box-sizing: border-box; }
      body { font-family: Arial, Helvetica, sans-serif; color: #000; margin: 0; padding: 16px; background: #fff; }
      ${estilos}
      @media print { body { padding: 0; } .no-print { display: none !important; } }
    </style></head><body>${cuerpo}</body></html>`;
}

/**
 * Muestra el documento en una VISTA PREVIA (ventana emergente) antes de imprimir,
 * con las acciones Imprimir / Abrir en otra pestaña / Cerrar.
 *
 * Todas las funciones de impresión de este módulo terminan aquí, así que los
 * reportes del sistema comparten la misma vista previa sin duplicar código.
 * El documento se renderiza dentro de un <iframe> aislado para que sus estilos
 * (@page, tamaños de hoja) no afecten a la aplicación ni al revés.
 */
function imprimir(titulo, estilos, cuerpo) {
  const html = documentoHtml(titulo, estilos, cuerpo);

  // Evita superponer dos vistas previas.
  document.getElementById('preview-doc-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.id = 'preview-doc-overlay';
  overlay.className = 'preview-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', `Vista previa: ${titulo}`);

  overlay.innerHTML = `
    <div class="preview-modal">
      <div class="preview-header">
        <h3>Vista previa — ${esc(titulo)}</h3>
        <button type="button" class="preview-close" aria-label="Cerrar vista previa">&times;</button>
      </div>
      <div class="preview-body"><iframe class="preview-frame" title="${esc(titulo)}"></iframe></div>
      <div class="preview-footer">
        <button type="button" class="btn btn-secondary preview-tab">🡕 Abrir en otra pestaña</button>
        <button type="button" class="btn btn-secondary preview-cancel">Cerrar vista</button>
        <button type="button" class="btn btn-primary preview-print">🖨️ Imprimir</button>
      </div>
    </div>`;

  const frame = overlay.querySelector('.preview-frame');
  frame.srcdoc = html;

  const previo = document.activeElement;
  const cerrar = () => {
    document.removeEventListener('keydown', onKey);
    document.body.classList.remove('no-scroll');
    overlay.remove();
    if (previo && document.contains(previo)) previo.focus();
  };
  const onKey = (e) => { if (e.key === 'Escape') cerrar(); };

  overlay.querySelector('.preview-close').onclick = cerrar;
  overlay.querySelector('.preview-cancel').onclick = cerrar;
  overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) cerrar(); });

  overlay.querySelector('.preview-print').onclick = () => {
    const w = frame.contentWindow;
    if (!w) return;
    w.focus();
    w.print();
  };

  overlay.querySelector('.preview-tab').onclick = () => {
    const w = window.open('', '_blank');
    if (!w) {
      alert('El navegador bloqueó la ventana emergente. Permita las ventanas emergentes para abrir el reporte en otra pestaña.');
      return;
    }
    w.document.write(html);
    w.document.close();
  };

  document.addEventListener('keydown', onKey);
  document.body.classList.add('no-scroll');
  document.body.appendChild(overlay);
  overlay.querySelector('.preview-print').focus();
}

/* ============================ CARTA DE PORTE (P11) ============================ */
// datos: { numero, fecha, origen, destino, piloto, placa, cantidad, tc, contiene, poliza }
// [P11b] Tamaño carta: Original + Duplicado 1 en la página 1, Duplicado 2 en la página 2.
// [P11e/f] "Señor" y "Para ser transportado de" = ORIGEN;  [P11g] "A" = DESTINO.
export function imprimirCartaPorte(datos) {
  // [v8 §1] Cada copia con ALTURA FIJA = media hoja, para que 2 quepan por página y
  // se pueda cortar justo a la mitad sin que la de abajo se traslape.
  const estilos = `
    @page { size: 8.5in 11in; margin: 0.3in; }
    .carta { border: 2px solid #000; padding: 10px 16px; height: 4.9in; box-sizing: border-box; overflow: hidden; margin-bottom: 0.1in; }
    .carta.brk { page-break-after: always; margin-bottom: 0; }
    .cab { display: flex; justify-content: space-between; align-items: flex-start; }
    .predio { font-size: 10px; max-width: 300px; margin-top: 4px; }
    .titulo { text-align: right; }
    .titulo h1 { margin: 0; font-size: 20px; }
    .num { color: #c1121f; font-weight: 800; font-size: 18px; }
    table.dma { border-collapse: collapse; margin-top: 4px; margin-left: auto; }
    table.dma td, table.dma th { border: 1px solid #000; padding: 2px 12px; font-size: 11px; text-align: center; }
    .fila { display: flex; gap: 10px; margin-top: 9px; font-size: 12px; align-items: flex-end; }
    .campo { border-bottom: 1px solid #000; flex: 1; padding: 0 4px 2px; min-height: 18px; }
    .lbl { font-weight: 700; white-space: nowrap; }
    .pie { display: flex; justify-content: space-between; margin-top: 18px; font-size: 10px; text-align: center; gap: 14px; }
    .firma { border-top: 1px solid #000; padding-top: 3px; width: 30%; }
    .imp { border: 1px solid #000; padding: 4px 6px; font-size: 8px; width: 42%; }
    .copia { font-style: italic; font-weight: 700; font-size: 12px; margin-top: 6px; }
  `;
  const p = partesFecha(datos.fecha);
  const carta = (etiqueta, brk) => `
    <div class="carta ${brk ? 'brk' : ''}">
      <div class="cab">
        <div>
          <img src="${logoAbsUrl()}" alt="SETRASA" style="height:38px;width:auto" />
          <div class="predio"><b>PREDIO:</b> Km 60 antigua carretera Puerto San José, Escuintla<br/>PBX: 7963-9898 Fax: 7889-5199</div>
        </div>
        <div class="titulo">
          <h1>CARTA DE PORTE</h1>
          <div>No. <span class="num">${esc(datos.numero)}</span></div>
          <table class="dma"><tr><th>DIA</th><th>MES</th><th>AÑO</th></tr>
            <tr><td>${p.dia}</td><td>${p.mesNombre}</td><td>${p.anio}</td></tr></table>
        </div>
      </div>
      <div class="fila"><span class="lbl">Señor:</span><span class="campo">${esc(datos.origen)}</span></div>
      <div class="fila">
        <span class="lbl">Sírvase entregar al Piloto Señor:</span><span class="campo">${esc(datos.piloto)}</span>
        <span class="lbl">Vehículo Placas No.:</span><span class="campo">${esc(datos.placa)}</span>
      </div>
      <div class="fila">
        <span class="lbl">La Cantidad de:</span><span class="campo">${esc(datos.cantidad)}</span>
        <span class="lbl">TC:</span><span class="campo">${esc(datos.tc)}</span>
      </div>
      <div class="fila"><span class="lbl">Dice Contener:</span><span class="campo">${esc(datos.contiene)}</span></div>
      <div class="fila"><span class="lbl">Para ser transportado(as) de:</span><span class="campo">${esc(datos.origen)}</span></div>
      <div class="fila"><span class="lbl">A:</span><span class="campo">${esc(datos.destino)}</span></div>
      <div class="fila"><span class="lbl">Póliza o Guía No.:</span><span class="campo">${esc(datos.poliza)}</span></div>
      <div class="pie">
        <div class="firma">SETRASA<br/>Por Oficina T.C.</div>
        <div class="firma">Recibí conforme: Piloto</div>
        <div class="firma">Recibí conforme: Bodega</div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:flex-end">
        <div class="copia">${etiqueta}</div>
        <div class="imp"><b>IMPORTANTE:</b> Todas las mercaderías viajan por su cuenta y riesgo, por lo que sugerimos asegurarlas con la Aseguradora de su confianza.</div>
      </div>
    </div>`;
  // Página 1: ORIGINAL + DUPLICADO 1 (con salto tras el 2do). Página 2: DUPLICADO 2.
  const cuerpo = carta('ORIGINAL', false) + carta('DUPLICADO 1', true) + carta('DUPLICADO 2', false);
  imprimir(`Carta de Porte ${datos.numero || ''}`, estilos, cuerpo);
}

/* ============================ VALE DE ANTICIPO (P13) ============================ */
// datos: { numero, fecha, poliza, placa, transportista, piloto, tipo, descripcion, factura, total }
// [P13b] En el cuadro del total: tipo de anticipo + descripción + total.
// [P13f] Impreso: DD/MM/YYYY HH:mm:ss.  [P13g] Nombre/Firma = piloto.
export function imprimirValeAnticipo(datos) {
  // [v8 §3] Cada copia con ALTURA FIJA (media hoja apaisada) para que las 3 copias
  // no se traslapen: 2 arriba y 1 abajo, cada una recortable.
  const estilos = `
    @page { size: 11in 8.5in; margin: 0.35in; }
    .hoja { display: flex; flex-wrap: wrap; gap: 0; }
    .vale { width: 50%; height: 3.85in; box-sizing: border-box; overflow: hidden; padding: 10px 16px; border-right: 1px dashed #555; border-bottom: 1px dashed #555; font-size: 11px; }
    .vale .cab { display: flex; justify-content: space-between; align-items: flex-start; }
    .valeno { text-align: right; }
    .valeno .n { font-size: 16px; font-weight: 800; }
    .row { display: flex; justify-content: space-between; margin-top: 8px; }
    .lnk { margin-top: 6px; }
    .caja { border: 1px solid #000; margin-top: 8px; padding: 8px; min-height: 58px; }
    .caja .tipo { font-weight: 700; }
    .caja .desc { margin-top: 4px; }
    .total { text-align: right; font-weight: 800; margin-top: 8px; font-size: 13px; }
    .firma { border-top: 1px solid #000; margin-top: 18px; padding-top: 3px; text-align: center; width: 70%; }
    .copia { font-size: 9px; color: #444; margin-top: 6px; }
  `;
  const copias = ['ORIGINAL CLIENTE', 'CONTABILIDAD', 'COPIA'];
  const impreso = fechaHoraImpresion();
  const vale = (etiqueta) => `
    <div class="vale">
      <div class="cab">
        <img src="${logoAbsUrl()}" alt="SETRASA" style="height:34px;width:auto" />
        <div class="valeno">VALE NO. <span class="n">${esc(datos.numero)}</span><br/>
          <span style="font-size:8px">Impreso: ${impreso}</span></div>
      </div>
      <div class="row"><span><b>Póliza:</b> ${esc(datos.poliza)}</span><span><b>Placa:</b> ${esc(datos.placa)}</span></div>
      <div class="lnk"><b>Transporte:</b> ${esc(datos.transportista)}</div>
      <div class="caja">
        <div class="tipo">${esc(datos.tipo || 'ABONO DE FLETES')}</div>
        <div class="desc">${esc(datos.descripcion || '')}</div>
        ${datos.factura ? `<div>FACTURA No. ${esc(datos.factura)}</div>` : ''}
        <div class="total">TOTAL Q: ${q(datos.total)}</div>
      </div>
      <div style="margin-top:10px">${esc(fechaEnLetras(datos.fecha))}</div>
      <div style="margin-top:4px">SETRASA</div>
      <div class="firma">${esc(datos.piloto || '')}<br/>NOMBRE / FIRMA</div>
      <div class="copia">${etiqueta}</div>
    </div>`;
  imprimir(`Vale de Anticipo ${datos.numero || ''}`, estilos, `<div class="hoja">${copias.map(vale).join('')}</div>`);
}

/* ================= REPORTE GENÉRICO DE CATÁLOGO/MANTENIMIENTO (v5 §4) ================= */
// columnas: [{ label, get: (row) => texto }]; filas: array de objetos reales.
export function imprimirReporteGenerico(titulo, columnas, filas, usuario = '') {
  const estilos = `
    @page { size: 8.5in 11in; margin: 0.6in; }
    .cab { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1f3d5c; padding-bottom: 6px; }
    .tit { color: #1f3d5c; font-weight: 800; font-size: 15px; }
    .meta { font-size: 9px; text-align: right; color: #333; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10px; }
    th { background: #1f3d5c; color: #fff; padding: 4px 6px; text-align: left; }
    td { padding: 3px 6px; border-bottom: 1px solid #ccc; }
    thead { display: table-header-group; }
    tr { page-break-inside: avoid; }
    tfoot td { font-weight: 700; padding-top: 8px; border: none; }
  `;
  const filasHtml = (filas || []).map((r) => `<tr>${columnas.map((c) => `<td>${esc(c.get(r))}</td>`).join('')}</tr>`).join('');
  const cuerpo = `
    <div class="cab">
      <div style="display:flex;gap:8px;align-items:center">
        <img src="${logoAbsUrl()}" style="height:36px"/>
        <div class="tit">SETRASA S.A.<br/><span style="font-size:11px">${esc(titulo)}</span></div>
      </div>
      <div class="meta">Usuario: ${esc(usuario)} · Terminal: ${TERMINAL}<br/>Impreso: ${fechaHoraImpresion()}</div>
    </div>
    <table>
      <thead><tr>${columnas.map((c) => `<th>${esc(c.label)}</th>`).join('')}</tr></thead>
      <tbody>${filasHtml || `<tr><td colspan="${columnas.length}" style="text-align:center;padding:20px">Sin registros.</td></tr>`}</tbody>
      <tfoot><tr><td colspan="${columnas.length}">Total de registros: ${(filas || []).length}</td></tr></tfoot>
    </table>`;
  imprimir(titulo, estilos, cuerpo);
}

/* ================= REPORTE DE LIQUIDACIONES V2 ================= */
export function imprimirReporteLiquidacionesV2(datos, filtros = {}, usuario = '') {
  const estilos = `
    @page { size: 11in 8.5in; margin: 0.45in; }
    .cab { display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #1f3d5c;padding-bottom:6px; }
    .tit { color:#1f3d5c;font-weight:800;font-size:15px; }
    .meta { font-size:9px;text-align:right;color:#333; }
    .filtros { font-size:9px;color:#444;margin-top:7px; }
    table { width:100%;border-collapse:collapse;margin-top:10px;font-size:8.5px; }
    th { background:#1f3d5c;color:#fff;padding:4px;text-align:left; }
    td { padding:3px 4px;border-bottom:1px solid #d1d5db; }
    .num { text-align:right;white-space:nowrap; }
    .revertida { color:#777;text-decoration:line-through; }
    tfoot td { font-weight:700;border:0;padding-top:6px; }
  `;
  const fecha = (value) => {
    if (!value) return '';
    const iso = String(value).slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
      const [anio, mes, dia] = iso.split('-');
      return `${dia}/${mes}/${anio}`;
    }
    const p = partesFecha(value);
    return `${p.dia}/${p.mes}/${p.anio}`;
  };
  const filas = (datos?.items || []).map((r) => `<tr class="${Number(r.revertida) ? 'revertida' : ''}">
    <td>${esc(r.num_liquidacion)}</td><td>${esc(fecha(r.fecha_liquidacion))}</td>
    <td>${esc(r.nombre_comercial)}</td><td>${esc(r.nombre_poliza)}</td>
    <td class="num">${esc(r.cantidad_viajes)}</td><td class="num">${esc(q(r.valor_diesel))}</td>
    <td class="num">${esc(q(r.valor_anticipos))}</td><td class="num">${esc(q(r.valor_impuesto))}</td>
    <td class="num">${esc(q(r.valor_liquidacion))}</td>
    <td>${Number(r.revertida) ? 'REVERTIDA' : 'LIQUIDADO'}</td>
  </tr>`).join('');
  const rango = filtros.fecha_inicio || filtros.fecha_fin
    ? `${filtros.fecha_inicio || 'inicio'} a ${filtros.fecha_fin || 'hoy'}` : 'Todas las fechas';
  const cuerpo = `
    <div class="cab"><div style="display:flex;gap:8px;align-items:center">
      <img src="${logoAbsUrl()}" style="height:36px"/>
      <div class="tit">SETRASA S.A.<br/><span style="font-size:11px">Reporte de Liquidaciones</span></div>
    </div><div class="meta">Usuario: ${esc(usuario)} · Terminal: ${TERMINAL}<br/>Impreso: ${fechaHoraImpresion()}</div></div>
    <div class="filtros">Período: ${esc(rango)} · Estado: ${esc(filtros.estado || 'Todos')}</div>
    <table><thead><tr><th>Liquidación</th><th>Fecha</th><th>Transportista</th><th>Póliza</th>
      <th>Viajes</th><th>Diesel</th><th>Anticipos</th><th>Impuesto</th><th>Total a pagar</th><th>Estado</th></tr></thead>
      <tbody>${filas || '<tr><td colspan="10" style="text-align:center;padding:20px">Sin registros.</td></tr>'}</tbody>
      <tfoot><tr><td colspan="8" class="num">Total efectivo:</td><td class="num">${esc(q(datos?.totales?.total_pagar))}</td><td></td></tr>
        <tr><td colspan="8" class="num">Sobregiros generados:</td><td class="num">${esc(q(datos?.totales?.sobregiros_generados))}</td><td></td></tr></tfoot>
    </table>`;
  imprimir('Reporte de Liquidaciones', estilos, cuerpo);
}

/* ================= ARRASTRE DE PÓLIZAS Y PUNTO DE EMBARQUE (v5 §6) ================= */
// data: resultado de GET /reportes/arrastre-polizas; filtros: {fecha_inicio,fecha_fin}
export function imprimirReporteArrastre(data, filtros = {}, usuario = '') {
  const estilos = `
    @page { size: 8.5in 11in; margin: 0.6in; }
    .cab { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1f3d5c; padding-bottom: 6px; }
    .tit { color: #1f3d5c; font-weight: 800; font-size: 15px; }
    .meta { font-size: 9px; text-align: right; color: #333; }
    .resumen { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; margin: 10px 0; font-size: 10px; }
    .resumen div { border: 1px solid #ccc; border-radius: 4px; padding: 5px 8px; }
    .grp-tit { background: #6b7a8c; color: #fff; padding: 3px 6px; font-size: 10px; margin-top: 10px; }
    table { width: 100%; border-collapse: collapse; font-size: 9px; }
    th { background: #e5e7eb; padding: 3px 5px; text-align: left; }
    td { padding: 2px 5px; border-bottom: 1px solid #ddd; }
    .n { text-align: right; }
    thead { display: table-header-group; }
    tr { page-break-inside: avoid; }
    tfoot td { font-weight: 700; }
  `;
  const r = data.resumen || {};
  const gruposHtml = (data.grupos || []).map((g) => `
    <div class="grp-tit">${esc(g.descripcion)}</div>
    <table>
      <thead><tr><th>C. Porte</th><th>Fecha</th><th>Piloto</th><th>Placa</th>
        <th class="n">Bultos</th><th class="n">Saldo bultos</th>
        <th class="n">Peso qq</th><th class="n">Peso kg</th><th class="n">Saldo kg</th></tr></thead>
      <tbody>${g.filas.map((f) => `<tr>
          <td>${esc(f.num_envio)}</td><td>${esc(f.fecha ? String(f.fecha).slice(0, 10) : '')}</td>
          <td>${esc(f.piloto)}</td><td>${esc(f.placa)}</td>
          <td class="n">${f.piezas}</td><td class="n">${formatNum(f.saldo_bultos)}</td>
          <td class="n">${f.peso_qq}</td><td class="n">${formatNum(f.peso_kg)}</td><td class="n">${formatNum(f.saldo_kg)}</td></tr>`).join('')}</tbody>
      <tfoot><tr><td colspan="4">Total del punto</td><td class="n">${g.total_piezas}</td><td></td>
        <td class="n">${g.total_peso_qq}</td><td class="n">${formatNum(g.total_peso_kg)}</td><td></td></tr></tfoot>
    </table>`).join('') || '<p style="padding:16px;text-align:center">Sin viajes en el rango consultado.</p>';
  const cuerpo = `
    <div class="cab">
      <div style="display:flex;gap:8px;align-items:center">
        <img src="${logoAbsUrl()}" style="height:36px"/>
        <div class="tit">SETRASA S.A.<br/><span style="font-size:11px">Arrastre de Pesos/Bultos por Pólizas y Puntos de Embarque</span></div>
      </div>
      <div class="meta">
        Póliza: ${esc(data.poliza?.nombre_poliza)} (${esc(data.poliza?.estado)})<br/>
        ${data.punto_embarque ? `Punto: ${esc(data.punto_embarque.descripcion)}<br/>` : ''}
        Del ${esc(filtros.fecha_inicio || '')} al ${esc(filtros.fecha_fin || '')}<br/>
        Usuario: ${esc(usuario)} · Terminal: ${TERMINAL}<br/>Impreso: ${fechaHoraImpresion()}
      </div>
    </div>
    <div class="resumen">
      <div><b>Piezas de la póliza:</b> ${formatNum(r.cantidad_piezas_poliza)}<br/><b>Arrastradas:</b> ${formatNum(r.piezas_arrastradas)}<br/><b>Saldo:</b> ${formatNum(r.saldo_piezas)}</div>
      <div><b>Peso póliza (kg):</b> ${formatNum(r.peso_kilogramos_poliza)}<br/><b>Arrastrado (kg):</b> ${formatNum(r.peso_arrastrado_kg)}<br/><b>Saldo (kg):</b> ${formatNum(r.saldo_peso_kg)}</div>
      <div><b>Arrastrado (qq):</b> ${formatNum(r.peso_arrastrado_qq)}<br/><b>Total viajes en rango:</b> ${(data.grupos || []).reduce((s, g) => s + g.filas.length, 0)}</div>
    </div>
    ${gruposHtml}
    <table style="margin-top:8px"><tfoot><tr>
      <td>TOTALES GENERALES (rango consultado)</td>
      <td class="n">Piezas: ${formatNum(data.totales?.total_piezas)}</td>
      <td class="n">Peso qq: ${formatNum(data.totales?.total_peso_qq)}</td>
      <td class="n">Peso kg: ${formatNum(data.totales?.total_peso_kg)}</td>
    </tr></tfoot></table>`;
  imprimir('Arrastre de Pólizas y Punto de Embarque', estilos, cuerpo);
}

/* ========================= VIAJES POR PÓLIZA (v5 §7) ========================= */
// data: resultado de GET /reportes/viajes-poliza
export function imprimirReporteViajesPoliza(data, usuario = '') {
  const estilos = `
    @page { size: 8.5in 11in; margin: 0.6in; }
    .cab { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1f3d5c; padding-bottom: 6px; }
    .tit { color: #1f3d5c; font-weight: 800; font-size: 15px; }
    .meta { font-size: 9px; text-align: right; color: #333; }
    .grp-tit { background: #6b7a8c; color: #fff; padding: 3px 6px; font-size: 10px; margin-top: 10px; }
    table { width: 100%; border-collapse: collapse; font-size: 9px; }
    th { background: #e5e7eb; padding: 3px 5px; text-align: left; }
    td { padding: 2px 5px; border-bottom: 1px solid #ddd; }
    .n { text-align: right; }
    thead { display: table-header-group; }
    tr { page-break-inside: avoid; }
    tfoot td { font-weight: 700; }
  `;
  const gruposHtml = (data.grupos || []).map((g) => `
    <div class="grp-tit">${esc(g.transportista)}</div>
    <table>
      <thead><tr><th>C. Porte</th><th>Fecha</th><th>Piloto</th><th>Placa</th>
        <th class="n">Peso qq</th><th class="n">Peso kg</th><th class="n">Total pagado</th><th>Destino</th></tr></thead>
      <tbody>${g.filas.map((f) => `<tr>
          <td>${esc(f.num_envio)}</td><td>${esc(f.fecha ? String(f.fecha).slice(0, 10) : '')}</td>
          <td>${esc(f.piloto)}</td><td>${esc(f.placa)}</td>
          <td class="n">${f.peso_qq}</td><td class="n">${formatNum(f.peso_kg)}</td>
          <td class="n">${q(f.valor)}</td><td>${esc(f.destino)}</td></tr>`).join('')}</tbody>
      <tfoot><tr><td colspan="4">Subtotal (${g.subtotal_viajes} viajes)</td>
        <td class="n">${g.subtotal_peso_qq}</td><td class="n">${formatNum(g.subtotal_peso_kg)}</td>
        <td class="n">${q(g.subtotal_pagado)}</td><td></td></tr></tfoot>
    </table>`).join('') || '<p style="padding:16px;text-align:center">Sin viajes para esta póliza.</p>';
  const t = data.totales || {};
  const cuerpo = `
    <div class="cab">
      <div style="display:flex;gap:8px;align-items:center">
        <img src="${logoAbsUrl()}" style="height:36px"/>
        <div class="tit">SETRASA S.A.<br/><span style="font-size:11px">Reporte de Viajes por Póliza</span></div>
      </div>
      <div class="meta">
        Póliza: ${esc(data.poliza?.nombre_poliza)}<br/>
        Usuario: ${esc(usuario)} · Terminal: ${TERMINAL}<br/>Impreso: ${fechaHoraImpresion()}
      </div>
    </div>
    ${gruposHtml}
    <table style="margin-top:8px"><tfoot><tr>
      <td>TOTALES GENERALES — Viajes: ${t.total_viajes || 0}</td>
      <td class="n">Peso qq: ${formatNum(t.total_peso_qq)}</td>
      <td class="n">Peso kg: ${formatNum(t.total_peso_kg)}</td>
      <td class="n">Total pagado: ${q(t.total_pagado)}</td>
    </tr></tfoot></table>`;
  imprimir('Reporte de Viajes por Póliza', estilos, cuerpo);
}

/* ============= ANTICIPOS A TRANSPORTISTAS (por póliza / arrastre) [2026-08 §11] ============= */
// data: { modo, poliza, grupos:[{transportista, anticipos:[{num_anticipo,placa,fecha,piloto,valor,motivo,poliza}], total}], total_general }
export function imprimirReporteAnticiposPoliza(data, usuario = '') {
  const estilos = `
    @page { size: 8.5in 11in; margin: 0.6in; }
    .cab { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1f3d5c; padding-bottom: 6px; }
    .tit { color: #1f3d5c; font-weight: 800; font-size: 15px; }
    .meta { font-size: 9px; text-align: right; color: #333; }
    .grp-tit { background: #6b7a8c; color: #fff; padding: 3px 6px; font-size: 10px; margin-top: 10px; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; font-size: 9px; }
    th { background: #e5e7eb; padding: 3px 5px; text-align: left; }
    td { padding: 2px 5px; border-bottom: 1px solid #ddd; }
    .n { text-align: right; }
    thead { display: table-header-group; }
    tr { page-break-inside: avoid; }
    .sub td { font-weight: 700; border-top: 1px solid #999; background: #f3f4f6; }
    .tot { margin-top: 10px; text-align: right; font-weight: 800; font-size: 12px; color: #1f3d5c; }
  `;
  const arrastre = String(data.modo).toUpperCase() === 'ARRASTRE';
  const cols = arrastre ? 5 : 4;
  const gruposHtml = (data.grupos || []).map((g) => `
    <div class="grp-tit">TRANSPORTISTA: ${esc(g.transportista)}</div>
    <table>
      <thead><tr><th>Vale</th><th>Placa</th><th>Fecha</th><th>Piloto</th>
        ${arrastre ? '<th>Póliza</th>' : ''}<th class="n">Anticipo</th><th>Motivo</th></tr></thead>
      <tbody>${g.anticipos.map((a) => `<tr>
          <td>${esc(a.num_anticipo)}</td><td>${esc(a.placa)}</td>
          <td>${esc(a.fecha ? String(a.fecha).slice(0, 10) : '')}</td><td>${esc(a.piloto)}</td>
          ${arrastre ? `<td>${esc(a.poliza)}</td>` : ''}
          <td class="n">${q(a.valor)}</td><td>${esc(a.motivo)}</td></tr>`).join('')}
        <tr class="sub"><td colspan="${cols}">Total x Transportista:</td><td class="n">${q(g.total)}</td><td></td></tr>
      </tbody>
    </table>`).join('') || '<p style="padding:16px;text-align:center">Sin anticipos para el filtro seleccionado.</p>';
  const cuerpo = `
    <div class="cab">
      <div style="display:flex;gap:8px;align-items:center">
        <img src="${logoAbsUrl()}" style="height:36px"/>
        <div class="tit">SETRASA S.A.<br/><span style="font-size:11px">Reporte de Anticipos a Transportistas</span></div>
      </div>
      <div class="meta">
        ${data.poliza ? `Póliza: ${esc(data.poliza.nombre_poliza)}<br/>` : 'Arrastre: todas las pólizas<br/>'}
        Usuario: ${esc(usuario)} · Terminal: ${TERMINAL}<br/>Impreso: ${fechaHoraImpresion()}
      </div>
    </div>
    ${gruposHtml}
    <div class="tot">Total ${data.poliza ? 'x Póliza' : 'general'}: ${q(data.total_general)}</div>`;
  imprimir('Reporte de Anticipos a Transportistas', estilos, cuerpo);
}

/* ========================= REPORTE DE DIESEL (P18 / v6 §6) ========================= */
// data: { facturas, detalle, totales }; filtros: { fecha_ini, fecha_fin, ... }; usuario: string
// [v6 §6] Vertical (carta), agrupado por factura, sombrea los vales de pólizas
// liquidadas. El filtro de estado de póliza (Activa/Liquidada/Ambas) va en la pantalla.
export function imprimirReporteDiesel(data, filtros = {}, usuario = '') {
  const estilos = `
    @page { size: 8.5in 11in; margin: 0.5in; }
    .cab { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1f3d5c; padding-bottom: 4px; }
    .tit { color: #1f3d5c; font-weight: 800; font-size: 15px; }
    .meta { font-size: 9px; text-align: right; color: #333; }
    .leyenda { display: flex; gap: 16px; align-items: center; font-size: 9px; margin: 6px 0 4px; }
    .leyenda .sw { display: inline-block; width: 11px; height: 11px; border-radius: 2px; margin-right: 4px; vertical-align: middle; }
    table { width: 100%; border-collapse: collapse; }
    .fac th { background: #1f3d5c; color: #fff; font-size: 10px; padding: 3px 5px; text-align: left; }
    .fac td { font-size: 10px; padding: 3px 5px; border-bottom: 1px solid #999; }
    .det th { background: #6b7a8c; color: #fff; font-size: 9px; padding: 2px 5px; }
    .det td { font-size: 9px; padding: 2px 5px; border-bottom: 1px solid #ddd; }
    .liq { background: #e0e0e0; color: #555; }
    .badge { font-size: 8px; padding: 1px 4px; border-radius: 3px; color: #fff; }
    .n { text-align: right; }
    .grp { margin-top: 8px; page-break-inside: avoid; }
    tfoot td { font-weight: 800; }
    thead { display: table-header-group; }
  `;
  const grupos = (data.facturas || []).map((f) => {
    const dets = (data.detalle || []).filter((d) => d.id_factura === f.id_factura);
    const filas = dets.map((d) => {
      const liq = d.estado_poliza === 'LIQUIDADA';
      return `<tr class="${liq ? 'liq' : ''}">
        <td>${esc(d.num_vale)}</td><td>${esc(d.fecha_vale ? String(d.fecha_vale).slice(0, 10) : '')}</td>
        <td>${esc(d.transportista)}</td><td>${esc(d.placa)}</td><td>${esc(d.poliza)}</td>
        <td><span class="badge" style="background:${liq ? '#888' : '#15803d'}">${liq ? 'LIQ' : 'ACT'}</span></td>
        <td class="n">${Number(d.galones).toFixed(2)}</td><td class="n">${q(d.valor)}</td></tr>`;
    }).join('');
    return `<div class="grp">
      <table class="fac"><tr>
        <th>Factura</th><th>Producto</th><th>Fecha</th><th class="n">Comprados</th>
        <th class="n">Precio</th><th class="n">Saldo</th><th>Estado</th><th class="n">Despachados</th><th class="n">Total</th>
      </tr>
      <tr><td>${esc(f.num_factura)}</td><td>${esc(f.producto)}</td><td>${esc(f.fecha_factura ? String(f.fecha_factura).slice(0, 10) : '')}</td>
        <td class="n">${Number(f.galones_comprados).toFixed(2)}</td><td class="n">${q(f.precio_galon)}</td>
        <td class="n">${Number(f.saldo).toFixed(2)}</td><td>${esc(f.estado_factura)}</td>
        <td class="n">${Number(f.galones_despachados).toFixed(2)}</td><td class="n">${q(f.total_valor)}</td></tr>
      </table>
      <table class="det"><tr><th>Vale</th><th>Fecha</th><th>Transportista</th><th>Placa</th><th>Póliza</th><th>Estado</th><th class="n">Galones</th><th class="n">Valor</th></tr>
        ${filas}</table>
    </div>`;
  }).join('');
  const tot = data.totales || {};
  const cuerpo = `
    <div class="cab">
      <div style="display:flex;gap:8px;align-items:center"><img src="${logoAbsUrl()}" style="height:36px"/><div class="tit">SETRASA S.A.<br/><span style="font-size:11px">Reporte de DIESEL por Factura</span></div></div>
      <div class="meta">
        Del ${esc(filtros.fecha_ini || '')} al ${esc(filtros.fecha_fin || '')}<br/>
        Usuario: ${esc(usuario)} · Terminal: ${TERMINAL}<br/>
        Impreso: ${fechaHoraImpresion()}
      </div>
    </div>
    <div class="leyenda">
      <span><span class="sw" style="background:#15803d"></span>ACT — Póliza activa</span>
      <span><span class="sw" style="background:#888"></span>LIQ — Póliza liquidada</span>
    </div>
    ${grupos || '<p style="padding:20px;text-align:center">Sin datos para el filtro.</p>'}
    <table style="margin-top:10px"><tfoot><tr>
      <td>Facturas: ${Number(tot.total_facturas || 0)}</td>
      <td class="n">Galones: ${Number(tot.total_galones || 0).toFixed(2)}</td>
      <td class="n">Total: ${q(tot.total_valor_general)}</td>
    </tr></tfoot></table>`;
  imprimir('Reporte de Diesel por Factura', estilos, cuerpo);
}

/* ========================= LIQUIDACIÓN (P17 / v5 §2) ========================= */
// datos (de GET /liquidacion/reporte/:id): { poliza:{nombre_poliza,fecha_liquidacion},
//   usuario, transportistas:[{ nit, nombre, viajes:[...], anticipos:[...], combustible:[...],
//   administrativos:[...], aceite:[...], totales:{...} }] }
// Formato detallado del PDF: por cada transportista con movimientos, el detalle de
// sus viajes + secciones de descuentos + bloque de totales. Tamaño carta.
export function imprimirLiquidacion(datos, usuarioActual = '', terminal = 'WEB') {
  const estilos = `
    @page { size: 8.5in 11in; margin: 0.5in; }
    .transp { page-break-after: always; }
    .transp:last-child { page-break-after: auto; }
    .cab { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000; padding-bottom: 6px; }
    .tit { font-size: 15px; font-weight: 800; color: #c1121f; }
    .sub { font-size: 11px; }
    /* [v8 §2] meta bajo la línea negra, a la izquierda */
    .meta { font-size: 9px; text-align: left; color: #222; margin: 6px 0 4px; }
    .tname { font-weight: 800; font-size: 12px; margin: 8px 0 4px; background: #1f3d5c; color: #fff; padding: 3px 6px; }
    .sec { font-weight: 700; font-size: 10px; margin: 8px 0 2px; color: #1f3d5c; }
    table { width: 100%; border-collapse: collapse; font-size: 9px; }
    th { background: #e5e7eb; padding: 2px 5px; text-align: left; }
    td { padding: 2px 5px; border-bottom: 1px solid #ddd; }
    .n { text-align: right; }
    tfoot td { font-weight: 700; }
    thead { display: table-header-group; }
    tr { page-break-inside: avoid; }
    /* [v8 §2] bloque de totales abajo a la IZQUIERDA */
    .tot { margin-top: 10px; margin-left: 0; margin-right: auto; width: 46%; font-size: 10px; border: 1px solid #000; }
    .tot td { padding: 3px 8px; border-bottom: 1px solid #ccc; }
    .tot .g { font-weight: 800; background: #f0f0f0; }
    .neg { color: #c1121f; }
    .viajes-tot { text-align: right; font-size: 10px; margin-top: 6px; }
  `;
  const fecha = datos.poliza?.fecha_liquidacion;
  const usuario = datos.usuario || usuarioActual || '';

  const seccionDescuento = (titulo, filas, cols) => {
    if (!filas || !filas.length) return '';
    return `<div class="sec">${esc(titulo)}</div>
      <table><thead><tr>${cols.map((c) => `<th class="${c.n ? 'n' : ''}">${esc(c.label)}</th>`).join('')}</tr></thead>
      <tbody>${filas.map((f) => `<tr>${cols.map((c) => `<td class="${c.n ? 'n' : ''}">${c.get(f)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  };

  const bloques = (datos.transportistas || []).map((t) => {
    const to = t.totales || {};
    const viajesHtml = `
      <div class="sec">VIAJES</div>
      <table>
        <thead><tr><th>C. Porte</th><th>Fecha</th><th>Piloto</th><th>Placa</th>
          <th class="n">Peso qq</th><th class="n">Total pago</th><th>Embarque</th><th>Destino</th></tr></thead>
        <tbody>${(t.viajes || []).map((v) => `<tr>
          <td>${esc(v.c_porte)}</td><td>${esc(v.fecha ? String(v.fecha).slice(0, 10) : '')}</td>
          <td>${esc(v.piloto)}</td><td>${esc(v.placa)}</td>
          <td class="n">${formatNum(v.peso_qq)}</td><td class="n">${q(v.total_pago)}</td>
          <td>${esc(v.embarque)}</td><td>${esc(v.destino)}</td></tr>`).join('')
        || '<tr><td colspan="8" style="text-align:center">Sin viajes.</td></tr>'}</tbody>
      </table>
      <div class="viajes-tot">Total viajes efectuados: <b>${to.total_viajes || 0}</b></div>`;

    const antHtml = seccionDescuento('DESCUENTO DE ANTICIPOS', t.anticipos, [
      { label: 'No.', get: (f) => esc(f.num) },
      { label: 'Fecha', get: (f) => esc(f.fecha ? String(f.fecha).slice(0, 10) : '') },
      { label: 'Descripción', get: (f) => esc(f.descripcion) },
      { label: 'Valor', n: true, get: (f) => q(f.valor) },
    ]);
    const combHtml = seccionDescuento('DESCUENTO DE COMBUSTIBLE', t.combustible, [
      { label: 'Vale', get: (f) => esc(f.num_vale) },
      { label: 'Fecha', get: (f) => esc(f.fecha ? String(f.fecha).slice(0, 10) : '') },
      { label: 'Galones', n: true, get: (f) => formatNum(f.galones) },
      { label: 'Q/galón', n: true, get: (f) => q(f.valor_galon) },
      { label: 'Subtotal', n: true, get: (f) => q(f.subtotal) },
    ]);
    const admHtml = seccionDescuento('DESCUENTOS ADMINISTRATIVOS', t.administrativos, [
      { label: 'Fecha', get: (f) => esc(f.fecha ? String(f.fecha).slice(0, 10) : '') },
      { label: 'Descripción', get: (f) => esc(f.descripcion) },
      { label: 'Valor', n: true, get: (f) => q(f.valor) },
    ]);
    const aceHtml = seccionDescuento('DESCUENTO DE ACEITE', t.aceite, [
      { label: 'Fecha', get: (f) => esc(f.fecha ? String(f.fecha).slice(0, 10) : '') },
      { label: 'Descripción', get: (f) => esc(f.descripcion) },
      { label: 'Valor', n: true, get: (f) => q(f.valor) },
    ]);

    return `<div class="transp">
      <div class="cab">
        <div style="display:flex;gap:10px;align-items:center">
          <img src="${logoAbsUrl()}" alt="SETRASA" style="height:38px" />
          <div><div class="tit">SETRASA S.A.</div><div class="sub">Liquidación a Transportistas</div></div>
        </div>
      </div>
      <div class="meta">
        Póliza: <b>${esc(datos.poliza?.nombre_poliza)}</b> · Fecha: ${esc(fecha ? String(fecha).slice(0, 10) : '')}<br/>
        Usuario: ${esc(usuario)} · Terminal: ${esc(terminal)} · Impreso: ${fechaHoraImpresion()}
      </div>
      <div class="tname">TRANSPORTISTA: ${esc(t.nit)} ${esc(t.nombre)}</div>
      ${viajesHtml}
      ${antHtml}
      ${combHtml}
      ${admHtml}
      ${aceHtml}
      <table class="tot">
        <tr><td>TOTAL A FACTURAR</td><td class="n">${q(to.total_facturar)}</td></tr>
        <tr><td>(−) Anticipos</td><td class="n">${q(to.total_anticipos)}</td></tr>
        <tr><td>SUB TOTAL</td><td class="n">${q(to.subtotal)}</td></tr>
        <tr><td>(−) Suministros</td><td class="n">${q(to.total_suministros)}</td></tr>
        <tr><td>(−) Saldo negativo</td><td class="n">${q(to.saldo_negativo)}</td></tr>
        <tr class="g"><td>TOTAL A PAGAR</td><td class="n ${Number(to.total_pagar) < 0 ? 'neg' : ''}">${q(to.total_pagar)}</td></tr>
      </table>
    </div>`;
  }).join('') || '<p style="text-align:center;padding:20px">La póliza no tiene transportistas con movimientos.</p>';

  imprimir(`Liquidación ${datos.poliza?.nombre_poliza || ''}`, estilos, bloques);
}

/* ============== LIQUIDACIÓN — RESUMEN POR PÓLIZA (v6 §5) ============== */
// Formato resumen (una fila por transportista) para el Historial de Liquidaciones,
// como estaba antes del formato detallado. datos: { poliza, fecha, usuario,
//   transportistas:[{ nit, nombre, cantidad_viajes, valor_viajes, valor_anticipos,
//   valor_combustible, valor_aceite, valor_administrativo, sobregiro_anterior, liquido }],
//   total_liquido }
export function imprimirLiquidacionResumen(datos, terminal = 'WEB') {
  const estilos = `
    @page { size: 8.5in 11in; margin: 0.5in; }
    .cab { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000; padding-bottom: 6px; }
    .tit { font-size: 16px; font-weight: 800; color: #c1121f; }
    .sub { font-size: 12px; }
    .meta { font-size: 9px; text-align: right; color: #222; }
    table.liq { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10px; }
    table.liq th, table.liq td { border: 1px solid #000; padding: 4px 5px; }
    table.liq th { background: #1f3d5c; color: #fff; }
    td.n { text-align: right; }
    tr.tot td { font-weight: 800; background: #f0f0f0; }
    .neg { color: #c1121f; }
    thead { display: table-header-group; }
    tr { page-break-inside: avoid; }
  `;
  const fils = (datos.transportistas || []).map((t) => `
    <tr>
      <td>${esc(t.nit)}</td>
      <td>${esc(t.nombre)}</td>
      <td class="n">${Number(t.cantidad_viajes || 0)}</td>
      <td class="n">${q(t.valor_viajes)}</td>
      <td class="n">${q(t.valor_anticipos)}</td>
      <td class="n">${q(t.valor_combustible)}</td>
      <td class="n">${q(t.valor_aceite)}</td>
      <td class="n">${q(t.valor_administrativo)}</td>
      <td class="n">${q(t.sobregiro_anterior)}</td>
      <td class="n ${Number(t.liquido) < 0 ? 'neg' : ''}">${q(t.liquido)}</td>
    </tr>`).join('');
  const cuerpo = `
    <div class="cab">
      <div style="display:flex;gap:10px;align-items:center">
        <img src="${logoAbsUrl()}" alt="SETRASA" style="height:40px" />
        <div><div class="tit">SETRASA S.A.</div><div class="sub">Liquidación a Transportistas (resumen por póliza)</div></div>
      </div>
      <div class="meta">
        Póliza: <b>${esc(datos.poliza)}</b><br/>
        Fecha: ${esc(datos.fecha ? String(datos.fecha).slice(0, 10) : '')}<br/>
        Usuario: ${esc(datos.usuario || '')} · Terminal: ${terminal}<br/>
        Impreso: ${fechaHoraImpresion()}
      </div>
    </div>
    <table class="liq">
      <thead><tr>
        <th>NIT</th><th>Transportista</th><th>Viajes</th><th>Valor viajes</th>
        <th>Anticipos</th><th>Combustible</th><th>Aceite</th><th>Administrativo</th><th>Sobregiro ant.</th><th>Líquido</th>
      </tr></thead>
      <tbody>
        ${fils || '<tr><td colspan="10" style="text-align:center">Sin transportistas.</td></tr>'}
        <tr class="tot"><td colspan="9" style="text-align:right">TOTAL A PAGAR</td>
          <td class="n ${Number(datos.total_liquido) < 0 ? 'neg' : ''}">${q(datos.total_liquido)}</td></tr>
      </tbody>
    </table>`;
  imprimir(`Liquidación ${datos.poliza || ''}`, estilos, cuerpo);
}

/* ========================= VALE DE COMBUSTIBLE (P15) ========================= */
// datos: { numero, fecha, bomba, nitTransportista, placa, poliza, transportista,
//          piloto, cantidad, factura, valor, total }
export function imprimirValeCombustible(datos) {
  // [v8 §5] MEDIA CARTA en el ancho de la hoja carta (vertical): las 2 copias
  // (original + duplicado) van lado a lado ocupando la mitad superior; el resto de
  // la hoja queda libre para cortar.
  const estilos = `
    @page { size: 8.5in 11in; margin: 0.35in; }
    .hoja { display: flex; gap: 0; height: 5.2in; }
    .vale { width: 50%; height: 5.2in; box-sizing: border-box; overflow: hidden; padding: 8px 12px; border-right: 1px dashed #555; font-size: 11px; }
    .vale:last-child { border-right: none; }
    .cab { display: flex; justify-content: space-between; align-items: flex-start; }
    .no { text-align: right; } .no .n { font-size: 15px; font-weight: 800; }
    .valea { font-size: 15px; font-weight: 800; margin: 4px 0; }
    .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 2px 10px; margin-top: 4px; }
    .lbl { font-weight: 700; }
    table.det { width: 100%; border-collapse: collapse; margin-top: 6px; }
    table.det th, table.det td { border: 1px solid #000; padding: 2px 4px; font-size: 10px; }
    table.det th { background: #f0f0f0; }
    .tot { text-align: right; font-weight: 800; margin-top: 4px; }
    .firma { border-top: 1px solid #000; margin-top: 22px; padding-top: 2px; width: 70%; font-size: 10px; }
    .copia { font-size: 9px; color: #444; margin-top: 2px; }
  `;
  const p = partesFecha(datos.fecha);
  const impreso = partesFecha(new Date());
  const copias = ['ORIGINAL CLIENTE', 'DUPLICADO'];
  const vale = (etiqueta) => `
    <div class="vale">
      <div class="cab">
        <img src="${logoAbsUrl()}" alt="SETRASA" style="height:30px" />
        <div class="no">SUMINISTRO<br/>No. <span class="n">${esc(datos.numero)}</span><br/>
          <span style="font-size:8px">Impreso: ${impreso.dia}/${impreso.mes}/${impreso.anio} ${new Date().toLocaleTimeString('es-GT', { hour12: false })}</span></div>
      </div>
      <div class="valea">VALE A: ${esc(datos.bomba)}</div>
      <div class="grid2">
        <div><span class="lbl">CÓDIGO:</span> ${esc(datos.nitTransportista)}</div>
        <div><span class="lbl">UNIDAD:</span> ${esc(datos.placa)}</div>
        <div><span class="lbl">DÍA/MES/AÑO:</span> ${p.dia}/${p.mesNombre}/${p.anio}</div>
        <div><span class="lbl">A CUENTA DE:</span> ${esc(datos.poliza)}</div>
      </div>
      <div><span class="lbl">PROPIETARIO:</span> ${esc(datos.transportista)}</div>
      <div><span class="lbl">PILOTO:</span> ${esc(datos.piloto)}</div>
      <table class="det">
        <tr><th>Cant.</th><th>Factura</th><th>Valor</th><th>Total</th></tr>
        <tr>
          <td>${esc(datos.cantidad)}</td>
          <td>${esc(datos.factura)}</td>
          <td>${q(datos.valor)}</td>
          <td>${q(datos.total)}</td>
        </tr>
      </table>
      <div class="tot">TOTAL Q: ${q(datos.total)}</div>
      <div class="firma">FIRMA AUT.: SETRASA</div>
      <div class="firma">RECIBÍ CONFORME:</div>
      <div class="copia">${etiqueta}</div>
    </div>`;
  imprimir(`Vale de Combustible ${datos.numero || ''}`, estilos, `<div class="hoja">${copias.map(vale).join('')}</div>`);
}

/* ============ LIQUIDACIÓN A TRANSPORTISTAS · módulo v2 [2026-08] ============ */
// datos: resultado de GET /liquidacion/v2/reporte-detallado/:id_liquidacion
// Una página por transportista: detalle de viajes, anticipos, diesel y totales.
export function imprimirLiquidacionV2(datos, usuarioActual = '') {
  const estilos = `
    @page { size: 8.5in 11in; margin: 0.4in; }
    body { font-family: 'Times New Roman', Times, serif; }
    .transp { page-break-after: always; }
    .transp:last-child { page-break-after: auto; }
    .cab { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
    .cab-izq { display: flex; gap: 6px; align-items: flex-start; }
    .rep-id { font-size: 6.5px; color: #1f3d5c; margin-top: 26px; white-space: nowrap; }
    .emp { font-size: 13px; font-weight: 700; color: #1f3d5c; line-height: 1.25; }
    .emp .l2 { font-size: 11px; font-weight: 400; }
    .emp .pol { font-size: 12px; font-weight: 700; color: #000; }
    .cab-der { font-size: 8px; color: #1f3d5c; text-align: right; line-height: 1.5; white-space: nowrap; }
    .transp-lin { font-size: 11px; font-weight: 700; margin: 8px 0 3px; display: flex; gap: 26px; }
    table { width: 100%; border-collapse: collapse; font-size: 7.5px; }
    .viajes { border: 1px solid #000; }
    .viajes thead th { border-bottom: 1px solid #000; padding: 1px 3px; text-align: left; font-weight: 700; font-size: 8px; }
    .viajes tbody td { padding: 0 3px; }
    .viajes tfoot td { border-top: 1px solid #000; padding: 1px 3px; font-weight: 700; }
    .n { text-align: right; }
    thead { display: table-header-group; }
    tr { page-break-inside: avoid; }
    .sec { font-weight: 700; font-size: 8.5px; margin: 7px 0 1px; }
    .det td { padding: 0 3px; }
    .det .tot-fila td { border-top: 1px solid #000; font-weight: 700; }
    /* Bloque de totales: recuadro abajo a la izquierda */
    .pie { display: flex; align-items: flex-start; gap: 30px; margin-top: 26px; }
    .tot { width: 300px; font-size: 9px; border-collapse: collapse; }
    .tot td { padding: 1px 6px; }
    .tot .val { border: 1px solid #000; text-align: right; width: 110px; }
    .tot .g td { font-weight: 700; }
    .viajes-efec { font-size: 9px; font-weight: 700; display: flex; align-items: center; gap: 8px; margin-top: 34px; }
    .viajes-efec .caja { border: 1px solid #000; padding: 1px 22px; }
    .neg { color: #c1121f; }
  `;
  const liq = datos?.liquidacion || {};
  const usuario = liq.usuario_graba || usuarioActual || '';
  const dmy = (v) => {
    if (!v) return '';
    const p = partesFecha(v);
    return `${p.dia}/${p.mes}/${p.anio}`;
  };
  const lista = datos?.transportistas || [];

  const paginas = lista.map((t, i) => {
    const to = t.totales || {};
    const tv = t.totales_viajes || {};

    const viajes = (t.viajes || []).map((v) => `<tr>
      <td>${esc(v.c_porte)}</td><td>${esc(dmy(v.fecha))}</td><td>${esc(v.piloto)}</td>
      <td>${esc(v.placa)}</td><td class="n">${esc(v.unidad)}</td>
      <td class="n">${formatNum(v.peso)}</td><td class="n">${formatNum(v.total_pago)}</td>
      <td>${esc(v.embarque)}</td><td>${esc(v.destino)}</td></tr>`).join('');

    // Secciones de descuentos: se muestran siempre (como en el documento original),
    // aunque el transportista no tenga movimientos de ese tipo.
    const anticipos = `
      <div class="sec">DESCUENTO DE ANTICIPOS</div>
      ${(t.anticipos || []).length ? `<table class="det"><tbody>
        ${t.anticipos.map((a) => `<tr>
          <td>${esc(a.num)}</td><td>${esc(a.placa)}</td><td>${esc(dmy(a.fecha))}</td>
          <td>${esc(a.piloto)}</td><td>${esc(a.descripcion)}</td>
          <td class="n">${formatNum(a.valor)}</td></tr>`).join('')}
        <tr class="tot-fila"><td colspan="5" class="n"></td><td class="n">${formatNum(to.valor_anticipos)}</td></tr>
      </tbody></table>` : ''}`;

    const diesel = (t.diesel || []).length ? `
      <div class="sec">DESCUENTO DE DIESEL</div>
      <table class="det"><tbody>
        ${t.diesel.map((c) => `<tr>
          <td>${esc(c.num_vale)}</td><td>${esc(dmy(c.fecha))}</td>
          <td class="n">${formatNum(c.galones)} gal</td><td class="n">${formatNum(c.precio)}</td>
          <td class="n">${formatNum(c.total)}</td></tr>`).join('')}
        <tr class="tot-fila"><td colspan="2"></td><td class="n">${formatNum(to.total_galones)}</td>
          <td></td><td class="n">${formatNum(to.valor_diesel)}</td></tr>
      </tbody></table>` : '';

    const seccionDescuento = (titulo, filas, total) => `
      <div class="sec">${titulo}</div>
      ${(filas || []).length ? `<table class="det"><tbody>
        ${filas.map((d) => `<tr><td>${esc(dmy(d.fecha))}</td><td>${esc(d.descripcion)}</td>
          <td class="n">${formatNum(d.valor)}</td></tr>`).join('')}
        <tr class="tot-fila"><td colspan="2" class="n"></td><td class="n">${formatNum(total)}</td></tr>
      </tbody></table>` : ''}`;

    return `<div class="transp">
      <div class="cab">
        <div class="cab-izq">
          <div style="text-align:center">
            <img src="${logoAbsUrl()}" style="height:34px"/>
            <div class="rep-id">ssr36_Proc_Liquidacion</div>
          </div>
          <div class="emp">
            SETRASA S.A.
            <div class="l2">Liquidacion a Transportistas &nbsp;-&nbsp; ${esc(dmy(liq.fecha_liquidacion))}</div>
            <div class="pol">Poliza: ${esc(liq.nombre_poliza)}</div>
          </div>
        </div>
        <div class="cab-der">
          Usuario: ${esc(usuario)}<br/>
          Terminal: ${TERMINAL}<br/>
          Fecha de Impresion: ${fechaHoraImpresion()}<br/>
          Página ${i + 1} de ${lista.length}
        </div>
      </div>

      <div class="transp-lin">
        <span>TRANSPORTISTA:</span><span>${esc(t.codigo ?? '')}</span><span>${esc(t.nombre)}</span>
      </div>

      <table class="viajes">
        <thead><tr>
          <th>C Porte</th><th>Fecha</th><th>Nombre Piloto</th><th>Placa</th>
          <th class="n">Unidad</th><th class="n">Peso Qq</th><th class="n">Total Pago</th>
          <th>Embarque</th><th>Destino</th>
        </tr></thead>
        <tbody>${viajes || '<tr><td colspan="9" style="text-align:center;padding:6px">Sin viajes registrados.</td></tr>'}</tbody>
        <tfoot><tr>
          <td colspan="4"></td>
          <td class="n">${esc(tv.unidad)}</td>
          <td class="n">${formatNum(tv.peso)}</td>
          <td class="n">${formatNum(tv.total_pago)}</td>
          <td colspan="2"></td>
        </tr></tfoot>
      </table>

      ${anticipos}
      ${diesel}
      ${seccionDescuento('DESCUENTOS ADMINISTRATIVOS', t.administrativos, to.valor_administrativo)}
      ${seccionDescuento('DESCUENTO DE ACEITE', t.aceite, to.valor_aceite)}

      <div class="pie">
        <table class="tot">
          <tr class="g"><td>TOTAL A FACTURAR:</td><td class="val">${formatNum(to.total_facturar)}</td></tr>
          <tr><td>(-) ANTICIPOS</td><td class="val">${formatNum(to.valor_anticipos)}</td></tr>
          <tr class="g"><td>SUB TOTAL</td><td class="val">${formatNum(to.sub_total)}</td></tr>
          <tr><td>(-) SUMINISTROS</td><td class="val">${formatNum(to.suministro || to.valor_diesel)}</td></tr>
          <tr><td>(-) SALDO NEGATIVO</td><td class="val ${Number(to.sobregiro_anterior) > 0 ? 'neg' : ''}">${formatNum(to.sobregiro_anterior)}</td></tr>
          <tr class="g"><td>TOTAL A PAGAR:</td><td class="val ${Number(to.total_pagar) < 0 ? 'neg' : ''}">${formatNum(to.total_pagar)}</td></tr>
        </table>
        <div class="viajes-efec">
          TOTAL VIAJES EFECTUADOS: <span class="caja">${esc(to.cantidad_viajes)}</span>
        </div>
      </div>
    </div>`;
  }).join('');

  imprimir(`Reporte de Liquidación ${liq.num_liquidacion || ''}`, estilos,
    paginas || '<p style="padding:20px;text-align:center">La liquidación no tiene transportistas.</p>');
}

/* ====== RESUMEN POR LIQUIDACIÓN DE TRANSPORTISTA · módulo v2 [2026-08] ====== */
// datos: resultado de GET /liquidacion/v2/resumen-transportista
// INGRESOS: viajes, peso, valor carta de porte / viajes locales.
// DESCUENTOS: anticipos, diesel, galones, total a facturar.
export function imprimirResumenLiquidacionTransportista(datos, filtros = {}, usuario = '') {
  const estilos = `
    @page { size: 11in 8.5in; margin: 0.45in; }
    .cab { display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #1f3d5c;padding-bottom:6px; }
    .tit { color:#1f3d5c;font-weight:800;font-size:15px; }
    .meta { font-size:9px;text-align:right;color:#333; }
    .filtros { font-size:9px;color:#444;margin-top:7px; }
    table { width:100%;border-collapse:collapse;margin-top:10px;font-size:8.5px; }
    th { background:#1f3d5c;color:#fff;padding:4px;text-align:left; }
    td { padding:3px 4px;border-bottom:1px solid #d1d5db; }
    .num { text-align:right;white-space:nowrap; }
    .ing { background:#eef7ee; }
    .des { background:#fdefee; }
    tfoot td { font-weight:700;border-top:2px solid #1f3d5c;background:#f3f4f6; }
    thead { display: table-header-group; }
    tr { page-break-inside: avoid; }
  `;
  const t = datos?.totales || {};
  const filas = (datos?.items || []).map((r) => `<tr>
    <td>${esc(r.num_liquidacion)}</td>
    <td>${esc(r.nombre_comercial)}</td>
    <td>${esc(r.nombre_poliza)}</td>
    <td class="num ing">${esc(r.cantidad_viajes)}</td>
    <td class="num ing">${formatNum(r.total_peso)}</td>
    <td class="num ing">${q(r.valor_carta_porte)}</td>
    <td class="num ing">${q(r.valor_locales)}</td>
    <td class="num des">${q(r.valor_anticipos)}</td>
    <td class="num des">${q(r.valor_diesel)}</td>
    <td class="num des">${formatNum(r.total_galones)}</td>
    <td class="num des">${q(r.total_facturar)}</td>
  </tr>`).join('');

  const rangoFechas = [filtros.fecha_inicio, filtros.fecha_fin].filter(Boolean).join(' al ');
  const cuerpo = `
    <div class="cab">
      <div style="display:flex;gap:8px;align-items:center">
        <img src="${logoAbsUrl()}" style="height:36px"/>
        <div class="tit">SETRASA S.A.<br/><span style="font-size:11px">Resumen por Liquidación de Transportista</span></div>
      </div>
      <div class="meta">Usuario: ${esc(usuario)} · Terminal: ${TERMINAL}<br/>Impreso: ${fechaHoraImpresion()}</div>
    </div>
    ${rangoFechas ? `<div class="filtros">Período: ${esc(rangoFechas)}</div>` : ''}
    <table>
      <thead>
        <tr>
          <th colspan="3"></th>
          <th colspan="4" style="text-align:center;background:#2f7a37">INGRESOS</th>
          <th colspan="4" style="text-align:center;background:#a5232f">DESCUENTOS</th>
        </tr>
        <tr>
          <th>Liquidación</th><th>Transportista</th><th>Póliza</th>
          <th class="num">Viajes</th><th class="num">Total peso</th>
          <th class="num">Carta de porte</th><th class="num">Viajes locales</th>
          <th class="num">Anticipos</th><th class="num">Diesel</th>
          <th class="num">Galones</th><th class="num">Total a facturar</th>
        </tr>
      </thead>
      <tbody>${filas || '<tr><td colspan="11" style="text-align:center;padding:16px">Sin liquidaciones para los filtros indicados.</td></tr>'}</tbody>
      ${datos?.items?.length ? `<tfoot><tr>
        <td colspan="3">TOTALES</td>
        <td class="num">${esc(t.cantidad_viajes)}</td>
        <td class="num">${formatNum(t.total_peso)}</td>
        <td class="num">${q(t.valor_carta_porte)}</td>
        <td class="num">${q(t.valor_locales)}</td>
        <td class="num">${q(t.valor_anticipos)}</td>
        <td class="num">${q(t.valor_diesel)}</td>
        <td class="num">${formatNum(t.total_galones)}</td>
        <td class="num">${q(t.total_facturar)}</td>
      </tr></tfoot>` : ''}
    </table>`;
  imprimir('Resumen por Liquidación de Transportista', estilos, cuerpo);
}
