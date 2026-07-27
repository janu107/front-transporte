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

/** Abre una ventana nueva, escribe el documento y lanza la impresión. */
function imprimir(titulo, estilos, cuerpo) {
  const w = window.open('', '_blank', 'width=1000,height=700');
  if (!w) {
    alert('El navegador bloqueó la ventana de impresión. Permita las ventanas emergentes.');
    return;
  }
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(titulo)}</title>
    <style>
      * { box-sizing: border-box; }
      body { font-family: Arial, Helvetica, sans-serif; color: #000; margin: 0; }
      ${estilos}
      @media print { .no-print { display: none !important; } }
    </style></head><body>${cuerpo}
    <div class="no-print" style="text-align:center;padding:12px">
      <button onclick="window.print()" style="padding:8px 18px;font-size:14px;cursor:pointer">Imprimir</button>
    </div>
    <script>window.onload = function(){ setTimeout(function(){ window.focus(); window.print(); }, 300); };<\/script>
  </body></html>`);
  w.document.close();
}

/* ============================ CARTA DE PORTE (P11) ============================ */
// datos: { numero, fecha, origen, destino, piloto, placa, cantidad, tc, contiene, poliza }
// [P11b] Tamaño carta: Original + Duplicado 1 en la página 1, Duplicado 2 en la página 2.
// [P11e/f] "Señor" y "Para ser transportado de" = ORIGEN;  [P11g] "A" = DESTINO.
export function imprimirCartaPorte(datos) {
  const estilos = `
    @page { size: 8.5in 11in; margin: 0.35in; }
    .carta { border: 2px solid #000; padding: 14px 16px; margin-bottom: 16px; min-height: 4.55in; box-sizing: border-box; }
    .carta.brk { page-break-after: always; margin-bottom: 0; }
    .cab { display: flex; justify-content: space-between; align-items: flex-start; }
    .predio { font-size: 10px; max-width: 300px; margin-top: 4px; }
    .titulo { text-align: right; }
    .titulo h1 { margin: 0; font-size: 22px; }
    .num { color: #c1121f; font-weight: 800; font-size: 18px; }
    table.dma { border-collapse: collapse; margin-top: 4px; margin-left: auto; }
    table.dma td, table.dma th { border: 1px solid #000; padding: 2px 12px; font-size: 11px; text-align: center; }
    .fila { display: flex; gap: 10px; margin-top: 14px; font-size: 12px; align-items: flex-end; }
    .campo { border-bottom: 1px solid #000; flex: 1; padding: 0 4px 2px; min-height: 18px; }
    .lbl { font-weight: 700; white-space: nowrap; }
    .pie { display: flex; justify-content: space-between; margin-top: 40px; font-size: 10px; text-align: center; gap: 14px; }
    .firma { border-top: 1px solid #000; padding-top: 3px; width: 30%; }
    .imp { border: 1px solid #000; padding: 4px 6px; font-size: 8px; width: 42%; }
    .copia { font-style: italic; font-weight: 700; font-size: 12px; margin-top: 8px; }
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
  const estilos = `
    @page { size: 11in 8.5in; margin: 0.4in; }
    .hoja { display: flex; flex-wrap: wrap; gap: 0; }
    .vale { width: 50%; padding: 12px 16px; border-right: 1px dashed #555; border-bottom: 1px dashed #555; font-size: 11px; }
    .vale .cab { display: flex; justify-content: space-between; align-items: flex-start; }
    .valeno { text-align: right; }
    .valeno .n { font-size: 16px; font-weight: 800; }
    .row { display: flex; justify-content: space-between; margin-top: 10px; }
    .lnk { margin-top: 8px; }
    .caja { border: 1px solid #000; margin-top: 12px; padding: 8px; min-height: 80px; }
    .caja .tipo { font-weight: 700; }
    .caja .desc { margin-top: 4px; }
    .total { text-align: right; font-weight: 800; margin-top: 10px; font-size: 13px; }
    .firma { border-top: 1px solid #000; margin-top: 34px; padding-top: 3px; text-align: center; width: 70%; }
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

/* ========================= REPORTE DE DIESEL (P18) ========================= */
// data: { facturas, detalle, totales }; filtros: { desde, hasta, ... }
export function imprimirReporteDiesel(data, filtros = {}) {
  const estilos = `
    @page { size: 11in 8.5in; margin: 0.4in; }
    .cab { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #1f3d5c; padding-bottom: 4px; }
    .tit { color: #1f3d5c; font-weight: 800; font-size: 15px; }
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
      <div style="font-size:10px;text-align:right">Del ${esc(filtros.fecha_ini || '')} al ${esc(filtros.fecha_fin || '')}</div>
    </div>
    ${grupos || '<p style="padding:20px;text-align:center">Sin datos para el filtro.</p>'}
    <table style="margin-top:10px"><tfoot><tr>
      <td>Facturas: ${Number(tot.total_facturas || 0)}</td>
      <td class="n">Galones: ${Number(tot.total_galones || 0).toFixed(2)}</td>
      <td class="n">Total: ${q(tot.total_valor_general)}</td>
    </tr></tfoot></table>`;
  imprimir('Reporte de Diesel por Factura', estilos, cuerpo);
}

/* ========================= LIQUIDACIÓN (P17) ========================= */
// datos: { poliza, fecha, usuario, transportistas:[{nombre,nit,cantidad_viajes,valor_viajes,
//          valor_combustible,valor_anticipos,sobregiro_anterior,liquido}], total_liquido }
export function imprimirLiquidacion(datos) {
  const estilos = `
    @page { size: 8.5in 11in; margin: 0.5in; }
    .cab { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000; padding-bottom: 6px; }
    .tit { font-size: 16px; font-weight: 800; color: #c1121f; }
    .sub { font-size: 12px; }
    table.liq { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
    table.liq th, table.liq td { border: 1px solid #000; padding: 4px 6px; }
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
      <td class="n">${q(t.sobregiro_anterior)}</td>
      <td class="n ${Number(t.liquido) < 0 ? 'neg' : ''}">${q(t.liquido)}</td>
    </tr>`).join('');
  const cuerpo = `
    <div class="cab">
      <div style="display:flex;gap:10px;align-items:center">
        <img src="${logoAbsUrl()}" alt="SETRASA" style="height:40px" />
        <div><div class="tit">SETRASA S.A.</div><div class="sub">Liquidación a Transportistas</div></div>
      </div>
      <div class="sub" style="text-align:right">
        Póliza: <b>${esc(datos.poliza)}</b><br/>
        Fecha: ${esc(fechaEnLetras(datos.fecha).replace('ESCUINTLA, ', ''))}<br/>
        Usuario: ${esc(datos.usuario || '')}
      </div>
    </div>
    <table class="liq">
      <thead><tr>
        <th>NIT</th><th>Transportista</th><th>Viajes</th><th>Valor viajes</th>
        <th>Anticipos</th><th>Combustible</th><th>Sobregiro ant.</th><th>Líquido</th>
      </tr></thead>
      <tbody>
        ${fils}
        <tr class="tot"><td colspan="7" style="text-align:right">TOTAL A PAGAR</td>
          <td class="n ${Number(datos.total_liquido) < 0 ? 'neg' : ''}">${q(datos.total_liquido)}</td></tr>
      </tbody>
    </table>`;
  imprimir(`Liquidación ${datos.poliza || ''}`, estilos, cuerpo);
}

/* ========================= VALE DE COMBUSTIBLE (P15) ========================= */
// datos: { numero, fecha, bomba, nitTransportista, placa, poliza, transportista,
//          piloto, cantidad, factura, valor, total }
export function imprimirValeCombustible(datos) {
  const estilos = `
    @page { size: 11in 8.5in; margin: 0.4in; }
    .hoja { display: flex; gap: 0; }
    .vale { width: 50%; padding: 8px 12px; border-right: 1px dashed #555; font-size: 11px; }
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
