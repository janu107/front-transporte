/**
 * CargaMasivaViajesModal.jsx — [V9 §1] CARGA MASIVA DE VIAJES.
 *
 * Sube un Excel/CSV con 9 columnas por fila, en este orden:
 *   1 LICENCIA · 2 ENVIO · 3 TIPO · 4 PLACA · 5 PUNTO · 6 PESO
 *   7 CANTIDAD_BULTO · 8 FECHA · 9 VALOR
 * La póliza es la seleccionada en el listado, no viene en el archivo.
 *
 * El TIPO decide el número de envío: «C» (carta de porte) lo asigna el sistema
 * y «V» (viaje local) usa el que trae el Excel.
 *
 * Primero se pide una VISTA PREVIA al servidor (que resuelve licencias, placas,
 * puntos y tipo contra la base) y se muestran las filas listas y las que tienen
 * problema con su motivo. Al aplicar solo se cargan las correctas.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import realApi from '../../api/realApi';
import { leerExcel, descargarPlantillaViajes } from '../../utils/excel';
import { formatCurrency, formatDate, formatNumber } from '../../utils/formatters';

const COLUMNAS = ['LICENCIA', 'ENVIO', 'TIPO', 'PLACA', 'PUNTO', 'PESO', 'CANTIDAD_BULTO', 'FECHA', 'VALOR'];

/** ¿La primera fila es un encabezado de texto y no datos? */
function esEncabezado(fila) {
  if (!fila) return false;
  const texto = fila.map((c) => String(c ?? '').trim().toUpperCase());
  return COLUMNAS.some((c) => texto.includes(c));
}

export default function CargaMasivaViajesModal({ poliza, onClose, onCargado }) {
  const isOpen = Boolean(poliza);
  const inputRef = useRef(null);
  const [archivo, setArchivo] = useState(null);
  const [filas, setFilas] = useState([]);
  const [previa, setPrevia] = useState(null);
  const [leyendo, setLeyendo] = useState(false);
  const [aplicando, setAplicando] = useState(false);
  const [message, setMessage] = useState(null);

  const limpiar = useCallback(() => {
    setArchivo(null); setFilas([]); setPrevia(null); setMessage(null);
    if (inputRef.current) inputRef.current.value = '';
  }, []);

  useEffect(() => { if (poliza) limpiar(); }, [poliza, limpiar]);

  const elegirArchivo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setArchivo(file); setPrevia(null); setMessage(null); setLeyendo(true);
    try {
      const matriz = await leerExcel(file);
      const sinEncabezado = esEncabezado(matriz[0]) ? matriz.slice(1) : matriz;
      const desplazamiento = esEncabezado(matriz[0]) ? 2 : 1;

      const datos = sinEncabezado
        .map((f, i) => ({
          __fila: i + desplazamiento,
          licencia: f[0], envio: f[1], tipo: f[2], placa: f[3], punto: f[4],
          peso: f[5], cantidad_bulto: f[6], fecha: f[7], valor: f[8],
        }))
        .filter((f) => [f.licencia, f.placa, f.punto, f.peso].some((v) => String(v ?? '').trim() !== ''));

      if (!datos.length) {
        setMessage({ type: 'error', text: 'El archivo no tiene filas con datos.' });
        setFilas([]); return;
      }
      setFilas(datos);
      // Vista previa: valida contra los catálogos sin escribir nada.
      const r = await realApi.viajesCargaMasiva({
        id_poliza: poliza.codigo, filas: datos, aplicar: false,
      });
      setPrevia(r);
    } catch (err) {
      setFilas([]);
      setMessage({
        type: 'error',
        text: err?.userMessage || err?.response?.data?.message
          || 'No se pudo leer el archivo. Verifique que sea un Excel (.xlsx) o CSV válido.',
      });
    } finally { setLeyendo(false); }
  };

  const aplicar = async () => {
    if (!previa?.validas || aplicando) return;
    setAplicando(true); setMessage(null);
    try {
      const r = await realApi.viajesCargaMasiva({
        id_poliza: poliza.codigo, filas, aplicar: true,
      });
      setPrevia(r);
      setMessage({
        type: 'success',
        text: `Se cargaron ${r.insertados} viaje(s) en la póliza ${r.poliza?.nombre_poliza || ''}.`
          + (r.con_error ? ` ${r.con_error} fila(s) quedaron fuera por errores.` : ''),
      });
      onCargado?.(r);
    } catch (err) {
      setMessage({
        type: 'error',
        text: err?.userMessage || err?.response?.data?.message || 'No se pudo aplicar la carga.',
      });
    } finally { setAplicando(false); }
  };

  const yaAplicado = Boolean(previa?.aplicado);
  const puedeAplicar = previa && previa.validas > 0 && !aplicando && !yaAplicado;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title={poliza ? `Carga masiva de viajes locales — ${poliza.nombre_poliza}` : 'Carga masiva'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={aplicando}>Salir</Button>
          <Button variant="primary" icon="💾" onClick={aplicar} disabled={!puedeAplicar}>
            {aplicando ? 'Cargando...' : previa ? `Aplicar ${previa.validas} viaje(s)` : 'Aplicar'}
          </Button>
        </>
      }
    >
      {message && (
        <div className={`alert alert-${message.type === 'error' ? 'error' : 'success'}`} style={{ marginTop: 0 }}>
          {message.text}
        </div>
      )}

      <div className="carga-cab">
        <div>
          <span className="carga-lbl">Póliza</span>
          <div className="carga-poliza">{poliza?.nombre_poliza}</div>
        </div>
        <div className="carga-acciones">
          <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" onChange={elegirArchivo}
            style={{ display: 'none' }} id="archivoCargaViajes" />
          <Button variant="secondary" icon="📄" onClick={descargarPlantillaViajes}>Plantilla</Button>
          <Button variant="primary" icon="📂" onClick={() => inputRef.current?.click()} disabled={leyendo || aplicando}>
            {leyendo ? 'Leyendo...' : 'Carga info.'}
          </Button>
        </div>
      </div>

      <p className="carga-ayuda">
        El archivo debe tener estas 9 columnas en orden:
        {' '}<b>{COLUMNAS.join(' · ')}</b>. La fecha en formato DD/MM/AAAA.
        {' '}En <b>TIPO</b>: <b>C</b> = carta de porte (el sistema asigna el número de envío)
        {' '}y <b>V</b> = viaje local (usa el número del archivo).
        {archivo && <> · Archivo: <b>{archivo.name}</b></>}
      </p>

      {previa && (
        <div className="carga-resumen">
          <Dato etiqueta="Filas del archivo" valor={formatNumber(previa.total_filas, 0)} />
          <Dato etiqueta="Listas para cargar" valor={formatNumber(previa.validas, 0)} tono="ok" />
          <Dato etiqueta="Con error" valor={formatNumber(previa.con_error, 0)} tono={previa.con_error ? 'error' : undefined} />
          <Dato etiqueta="Cartas de porte (C)" valor={formatNumber(previa.cartas_porte, 0)} />
          <Dato etiqueta="Viajes locales (V)" valor={formatNumber(previa.viajes_locales, 0)} />
          <Dato etiqueta="Peso del archivo" valor={`${formatNumber(previa.peso_archivo)} kg`} />
          <Dato etiqueta="Saldo de peso al aplicar" valor={`${formatNumber(previa.saldo_peso_despues)} kg`}
            tono={previa.saldo_peso_despues < 0 ? 'error' : undefined} />
        </div>
      )}

      {/* Filas listas para cargar */}
      {previa?.filas?.length > 0 && (
        <>
          {/* Plegable: con muchos errores lo importante es leerlos, así que esta
              lista arranca cerrada y les cede la altura. */}
          <details open={!previa.errores?.length} className="carga-plegable">
            <summary className="carga-sec">
              Viajes a cargar ({formatNumber(previa.filas.length, 0)})
            </summary>
          <div className="table-wrapper"><div className="table-scroll" style={{ maxHeight: '42vh' }}>
            <table className="data-table">
              <thead><tr>
                <th>Tipo</th><th>Envío</th><th>Nit transportista</th><th>Placa</th><th>Piloto</th>
                <th>Cod. embarque</th><th>Fecha</th>
                <th style={{ textAlign: 'right' }}>Bultos</th>
                <th style={{ textAlign: 'right' }}>Peso neto</th>
                <th style={{ textAlign: 'right' }}>Valor</th>
              </tr></thead>
              <tbody>
                {previa.filas.map((f) => (
                  <tr key={f.fila}>
                    <td>
                      <span className={`badge ${f.tipo === 'C' ? 'badge-liquidado' : 'badge-activo'}`}>{f.tipo}</span>
                    </td>
                    <td>{f.num_envio || <span className="text-muted">(lo asigna el sistema)</span>}</td>
                    <td>{f.nit || '—'}<div style={{ fontSize: 11, color: '#6b7280' }}>{f.transportista}</div></td>
                    <td>{f.placa}</td>
                    <td>{f.piloto}<div style={{ fontSize: 11, color: '#6b7280' }}>{f.licencia}</div></td>
                    <td>{f.id_tarifa_embarque}<div style={{ fontSize: 11, color: '#6b7280' }}>{f.embarque}</div></td>
                    <td>{formatDate(f.fecha)}</td>
                    <td style={{ textAlign: 'right' }}>{formatNumber(f.cantidad_bulto, 0)}</td>
                    <td style={{ textAlign: 'right' }}>{formatNumber(f.peso)}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(f.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div></div>
          </details>
        </>
      )}

      {/* Filas rechazadas con su motivo */}
      {previa?.errores?.length > 0 && (
        <>
          <h4 className="carga-sec carga-sec--error">
            Filas con error ({previa.errores.length}) — no se cargarán
          </h4>
          <div className="table-wrapper"><div className="table-scroll" style={{ maxHeight: '58vh' }}>
            <table className="data-table">
              <thead><tr>
                <th>Fila</th><th>Tipo</th><th>Envío</th><th>Licencia</th><th>Placa</th>
                <th>Punto</th><th>Fecha</th><th style={{ minWidth: 260 }}>Motivo</th>
              </tr></thead>
              <tbody>
                {previa.errores.map((e) => (
                  <tr key={e.fila} className="carga-fila-error">
                    <td>{e.fila}</td><td>{String(e.tipo ?? '')}</td><td>{String(e.envio ?? '')}</td>
                    <td>{String(e.licencia)}</td><td>{String(e.placa)}</td>
                    <td>{String(e.punto)}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDate(e.fecha) || String(e.fecha ?? '')}</td>
                    <td style={{ minWidth: 260 }}>{e.motivo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div></div>
        </>
      )}

      {!previa && !leyendo && (
        <p className="carga-vacio">
          Presione «Carga info.» para elegir el archivo. Se mostrará una vista previa
          antes de guardar nada.
        </p>
      )}
    </Modal>
  );
}

function Dato({ etiqueta, valor, tono }) {
  return (
    <div>
      <div className="carga-lbl">{etiqueta}</div>
      <div className={`carga-val ${tono ? `carga-val--${tono}` : ''}`}>{valor}</div>
    </div>
  );
}
