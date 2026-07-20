/**
 * impresionDocs.js
 * Generación e impresión de documentos (Carta de Porte y Vale de Anticipo) usando
 * una ventana nueva + CSS @page + window.print(). No requiere librerías externas.
 *
 * Nota: los campos que el esquema actual no modela (predio origen/destino, No. de
 * factura del vale) se dejan como marcadores para completar según la regla de negocio.
 */

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

/* ============================ CARTA DE PORTE (M6) ============================ */
// datos: { numero, fecha, predioOrigen, destino, piloto, placa, cantidad, tc,
//          contiene, poliza }
export function imprimirCartaPorte(datos) {
  const estilos = `
    @page { size: 8.5in 5.5in; margin: 0.3in; }
    .carta { width: 100%; border: 2px solid #000; padding: 8px 10px; page-break-after: always; }
    .carta:last-child { page-break-after: auto; }
    .cab { display: flex; justify-content: space-between; align-items: flex-start; }
    .marca { font-weight: 800; font-size: 22px; letter-spacing: 1px; }
    .predio { font-size: 9px; max-width: 260px; }
    .titulo { text-align: right; }
    .titulo h1 { margin: 0; font-size: 20px; }
    .num { color: #c1121f; font-weight: 800; font-size: 16px; }
    table.dma { border-collapse: collapse; margin-top: 4px; }
    table.dma td, table.dma th { border: 1px solid #000; padding: 1px 8px; font-size: 10px; text-align: center; }
    .fila { display: flex; gap: 8px; margin-top: 6px; font-size: 11px; }
    .campo { border-bottom: 1px solid #000; flex: 1; padding: 0 4px; min-height: 15px; }
    .lbl { font-weight: 700; white-space: nowrap; }
    .pie { display: flex; justify-content: space-between; margin-top: 14px; font-size: 10px; text-align: center; }
    .firma { border-top: 1px solid #000; padding-top: 2px; width: 30%; }
    .imp { border: 1px solid #000; padding: 3px 6px; font-size: 8px; width: 40%; }
    .copia { font-style: italic; font-weight: 700; font-size: 11px; margin-top: 4px; }
  `;
  const copias = ['ORIGINAL', 'DUPLICADO 1', 'DUPLICADO 2'];
  const p = partesFecha(datos.fecha);
  const carta = (etiqueta) => `
    <div class="carta">
      <div class="cab">
        <div>
          <div class="marca">🚛 SETRASA</div>
          <div class="predio"><b>PREDIO:</b> Km 60 antigua carretera Puerto San José, Escuintla<br/>PBX: 7963-9898 Fax: 7889-5199</div>
        </div>
        <div class="titulo">
          <h1>CARTA DE PORTE</h1>
          <div>No. <span class="num">${esc(datos.numero)}</span></div>
          <table class="dma"><tr><th>DIA</th><th>MES</th><th>AÑO</th></tr>
            <tr><td>${p.dia}</td><td>${p.mesNombre}</td><td>${p.anio}</td></tr></table>
        </div>
      </div>
      <div class="fila"><span class="lbl">Señor:</span><span class="campo">${esc(datos.destino)}</span></div>
      <div class="fila">
        <span class="lbl">Sírvase entregar al Piloto Señor:</span><span class="campo">${esc(datos.piloto)}</span>
        <span class="lbl">Vehículo Placas No.:</span><span class="campo">${esc(datos.placa)}</span>
      </div>
      <div class="fila">
        <span class="lbl">La Cantidad de:</span><span class="campo">${esc(datos.cantidad)}</span>
        <span class="lbl">TC:</span><span class="campo">${esc(datos.tc)}</span>
      </div>
      <div class="fila"><span class="lbl">Dice Contener:</span><span class="campo">${esc(datos.contiene)}</span></div>
      <div class="fila"><span class="lbl">Para ser transportado(as) de:</span><span class="campo">${esc(datos.predioOrigen)}</span></div>
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
  imprimir(`Carta de Porte ${datos.numero || ''}`, estilos, copias.map(carta).join(''));
}

/* ============================ VALE DE ANTICIPO (M7) ============================ */
// datos: { numero, fecha, poliza, placa, transportista, concepto, factura, total }
export function imprimirValeAnticipo(datos) {
  const estilos = `
    @page { size: 11in 8.5in; margin: 0.4in; }
    .hoja { display: flex; flex-wrap: wrap; gap: 0; }
    .vale { width: 50%; padding: 10px 14px; border-right: 1px dashed #555; border-bottom: 1px dashed #555; font-size: 11px; }
    .vale .cab { display: flex; justify-content: space-between; align-items: flex-start; }
    .marca { font-weight: 800; font-size: 16px; }
    .valeno { text-align: right; }
    .valeno .n { font-size: 16px; font-weight: 800; }
    .row { display: flex; justify-content: space-between; margin-top: 4px; }
    .caja { border: 1px solid #000; margin-top: 8px; padding: 6px; min-height: 70px; }
    .total { text-align: right; font-weight: 800; margin-top: 6px; }
    .firma { border-top: 1px solid #000; margin-top: 26px; padding-top: 2px; text-align: center; width: 60%; }
    .copia { font-size: 9px; color: #444; margin-top: 4px; }
  `;
  const copias = ['ORIGINAL CLIENTE', 'CONTABILIDAD', 'COPIA'];
  const fImp = partesFecha(new Date());
  const vale = (etiqueta) => `
    <div class="vale">
      <div class="cab">
        <div class="marca">🚛 SETRASA</div>
        <div class="valeno">VALE NO. <span class="n">${esc(datos.numero)}</span><br/>
          <span style="font-size:8px">Impreso: ${fImp.dia}/${fImp.mes}/${fImp.anio}</span></div>
      </div>
      <div class="row"><span><b>Póliza:</b> ${esc(datos.poliza)}</span><span><b>Placa:</b> ${esc(datos.placa)}</span></div>
      <div><b>Transporte:</b> ${esc(datos.transportista)}</div>
      <div class="caja">
        <div>${esc(datos.concepto || 'ABONO DE FLETES')}</div>
        ${datos.factura ? `<div>FACTURA No. ${esc(datos.factura)}</div>` : ''}
        <div class="total">TOTAL Q: ${q(datos.total)}</div>
      </div>
      <div style="margin-top:6px">${esc(fechaEnLetras(datos.fecha))}</div>
      <div style="margin-top:2px">SETRASA</div>
      <div>${esc(datos.transportista)}</div>
      <div class="firma">NOMBRE / FIRMA</div>
      <div class="copia">${etiqueta}</div>
    </div>`;
  imprimir(`Vale de Anticipo ${datos.numero || ''}`, estilos, `<div class="hoja">${copias.map(vale).join('')}</div>`);
}
