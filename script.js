/* ============================================================
   script.js
   Registro de invitados con descarga de la lista en .txt y PDF.

   Organización del archivo (para estudiarlo fácil):
     1. Referencias al DOM
     2. Constantes
     3. Utilidades
     4. Validación
     5. Bloques dinámicos (invitados)
     6. Selector de tipo de evento + fecha rápida
     7. Recolección de datos y formato .txt
     8. Descargas
     9. Generador de PDF (sección aparte, opcional)
    10. Guardar y modal de vista previa

   JavaScript puro: sin frameworks ni librerías externas.
   ============================================================ */

/* ================= 1. Referencias al DOM ================= */
const $ = (id) => document.getElementById(id);

const cantidadInput   = $('cantidad-invitados');
const btnAgregar      = $('btn-agregar');
const contenedor      = $('contenedor-invitados');
const btnGuardar      = $('btn-guardar');
const modal           = $('modal');
const preTxt          = $('modal-contenido');
const btnCancelar     = $('btn-cancelar');
const btnDescargarTxt = $('btn-descargar-txt');
const btnDescargarPdf = $('btn-descargar-pdf');
const btnReiniciar    = $('btn-reiniciar');

/* ================= 2. Constantes ================= */

// Límites pedidos en el enunciado: 1 a 50 invitados.
const MIN_INVITADOS = 1;
const MAX_INVITADOS = 50;

// Etiquetas legibles de cada opción de "Relación".
const RELACIONES = { familia: 'Familia', amigo: 'Amigo', trabajo: 'Trabajo', otro: 'Otro' };

// Países: [código, bandera emoji, nombre, dígitos]. Perú primero.
// Los dígitos son el Máximo aproximado de cada país (no todos tienen 8).
const PAISES = [
  ['+51',  '🇵🇪', 'Perú',              9],
  ['+34',  '🇪🇸', 'España',            9],
  ['+52',  '🇲🇽', 'México',            10],
  ['+54',  '🇦🇷', 'Argentina',         11],
  ['+56',  '🇨🇱', 'Chile',             9],
  ['+57',  '🇨🇴', 'Colombia',          10],
  ['+58',  '🇻🇪', 'Venezuela',         10],
  ['+53',  '🇨🇺', 'Cuba',              8],
  ['+1',   '🇺🇸', 'Estados Unidos',    10],
  ['+1',   '🇨🇦', 'Canadá',            10],
  ['+1',   '🇩🇴', 'Rep. Dominicana',   10],
  ['+506', '🇨🇷', 'Costa Rica',        8],
  ['+502', '🇬🇹', 'Guatemala',         8],
  ['+504', '🇭🇳', 'Honduras',          8],
  ['+503', '🇸🇻', 'El Salvador',       8],
  ['+507', '🇵🇦', 'Panamá',            8],
  ['+591', '🇧🇴', 'Bolivia',           8],
  ['+593', '🇪🇨', 'Ecuador',           9],
  ['+595', '🇵🇾', 'Paraguay',          9],
  ['+598', '🇺🇾', 'Uruguay',           8],
  ['+55',  '🇧🇷', 'Brasil',            11],
  ['+33',  '🇫🇷', 'Francia',           9],
  ['+44',  '🇬🇧', 'Reino Unido',       10],
  ['+49',  '🇩🇪', 'Alemania',          11]
];

// Opciones <option> del selector de país. data-max guarda el tope de
// dígitos de ese país, para aplicarlo al campo de teléfono.
const OPCIONES_PAISES = PAISES.map(
  ([codigo, bandera, nombre, digitos]) =>
    `<option value="${codigo}" data-max="${digitos}">${bandera} ${codigo} ${nombre}</option>`
).join('');

// Meses para mostrar la fecha en formato largo (PDF).
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/* ================= 3. Utilidades ================= */

const valor = (input) => input.value.trim();
const grupoDe = (input) => input.closest('.campo');
const errorDe = (input) => grupoDe(input).querySelector('.error');

/** Marca el campo en rojo y muestra su mensaje. */
function mostrarError(input, mensaje) {
  grupoDe(input).classList.add('invalido');
  errorDe(input).textContent = mensaje;
}

/** Quita la marca de error del campo. */
function limpiarError(input) {
  grupoDe(input).classList.remove('invalido');
  errorDe(input).textContent = '';
}

/** Muestra u oculta un elemento (clase .oculto). */
function alternar(elemento, visible) {
  elemento.classList.toggle('oculto', !visible);
}

/* ================= 4. Validación ================= */

// Cada validador recibe (valor, input) y devuelve '' si es válido
// o el mensaje de error específico.
const VALIDADORES = {
  texto: (v) => (v === '' ? 'Este campo es obligatorio.' : ''),
  fecha: (v) => (v === '' ? 'Por favor selecciona la fecha.' : ''),
  correo: (v) => {
    if (v === '') return 'El correo es obligatorio.';
    // Formato clásico: texto@dominio.extensión
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Ingresa un correo válido.';
  },
  telefono: (v) => {
    if (v === '') return 'El teléfono es obligatorio.';
    // El enunciado pide mínimo 8 dígitos (el tope varía según el país).
    return v.replace(/\D/g, '').length >= 8 ? '' : 'El teléfono debe tener al menos 8 dígitos.';
  },
  relacion: (v) => (v === '' ? 'Selecciona la relación.' : ''),
  evento: (v) => (v === '' ? 'Selecciona el tipo de evento.' : ''),
  // "Otro" del evento: solo se exige si el selector vale "otro".
  'evento-otro': (v, input) => {
    const sel = input.closest('.tarjeta').querySelector('#evento-tipo');
    return (sel.value === 'otro' && v === '') ? 'Especifica el evento.' : '';
  },
  // "Otro" de la relación: solo se exige si el selector vale "otro".
  'otro-relacion': (v, input) => {
    const sel = input.closest('.invitado').querySelector('[data-tipo="relacion"]');
    return (sel.value === 'otro' && v === '') ? 'Especifica la relación.' : '';
  },
  // El selector de país siempre trae un valor por defecto.
  pais: () => ''
};

/**
 * Valida un campo y muestra/limpia su error.
 * El rojo solo aparece al SALIR del campo o al Guardar; así no se marca
 * mientras se escribe (ej.: teléfono con 2 dígitos a medio escribir).
 */
function validarCampo(input, forzar = false) {
  const fn = VALIDADORES[input.dataset.tipo];
  if (!fn) { limpiarError(input); return true; }

  const mensaje = fn(valor(input), input);
  if (mensaje) {
    if (forzar || input.dataset.tocado !== undefined) mostrarError(input, mensaje);
    return false;
  }
  limpiarError(input);
  return true;
}

/** Validación en tiempo real: al escribir limpia; al salir marca. */
function vincularCampo(campo) {
  campo.addEventListener('input', () => validarCampo(campo));
  campo.addEventListener('blur', () => {
    campo.dataset.tocado = '1';
    validarCampo(campo, true);
  });
}

/** Valida el campo de cantidad (1 a 50). */
function validarCantidad(forzar) {
  const cantidad = Number(cantidadInput.value);
  const error = !Number.isInteger(cantidad) || cantidad < MIN_INVITADOS || cantidad > MAX_INVITADOS
    ? `Ingresa una cantidad entre ${MIN_INVITADOS} y ${MAX_INVITADOS}.`
    : '';

  if (error) {
    if (forzar || cantidadInput.dataset.tocado !== undefined) {
      cantidadInput.dataset.tocado = '1';
      mostrarError(cantidadInput, error);
    }
    return false;
  }
  limpiarError(cantidadInput);
  return true;
}

/* ================= 5. Bloques dinámicos (invitados) ================= */

/**
 * Crea el bloque HTML de un invitado con su número.
 * Campos: nombre, correo, teléfono (país + número) y relación.
 */
function crearBloque(numero) {
  const bloque = document.createElement('div');
  bloque.className = 'invitado';

  bloque.innerHTML = `
    <div class="invitado-cabecera">
      <h3>
        <span class="num">${numero}</span>
        <span class="invitado-nombre">Invitado ${numero}</span>
      </h3>
      <button type="button" class="btn-eliminar" aria-label="Eliminar invitado ${numero}" title="Eliminar invitado">&times;</button>
    </div>

    <div class="invitado-grid">
      <div class="campo">
        <label for="nombre-${numero}">Nombre completo <span class="req">*</span></label>
        <input type="text" id="nombre-${numero}" data-tipo="texto" data-bloque="${numero}" placeholder="Nombre y apellido">
        <small class="error"></small>
      </div>

      <div class="campo">
        <label for="correo-${numero}">Correo electrónico <span class="req">*</span></label>
        <input type="email" id="correo-${numero}" data-tipo="correo" data-bloque="${numero}" placeholder="correo@ejemplo.com">
        <small class="error"></small>
      </div>

      <div class="campo">
        <label for="telefono-${numero}">Teléfono <span class="req">*</span></label>
        <div class="con-ficha">
          <select id="pais-${numero}" data-tipo="pais" data-bloque="${numero}" aria-label="Código de país">
            ${OPCIONES_PAISES}
          </select>
          <input type="tel" id="telefono-${numero}" data-tipo="telefono" data-bloque="${numero}"
                 maxlength="15" inputmode="numeric" placeholder="912345678">
        </div>
        <small class="error"></small>
      </div>

      <div class="campo">
        <label for="relacion-${numero}">Relación con el anfitrión <span class="req">*</span></label>
        <select id="relacion-${numero}" data-tipo="relacion" data-bloque="${numero}">
          <option value="">Selecciona…</option>
          <option value="familia">Familia</option>
          <option value="amigo">Amigo</option>
          <option value="trabajo">Trabajo</option>
          <option value="otro">Otro…</option>
        </select>
        <small class="error"></small>
      </div>
    </div>

    <!-- Campo condicional: solo aparece si la relación es "otro" -->
    <div class="campo sub-campo campo-relacion-otro oculto">
      <label for="otro-relacion-${numero}">¿Qué relación? <span class="req">*</span></label>
      <input type="text" id="otro-relacion-${numero}" data-tipo="otro-relacion" data-bloque="${numero}" placeholder="Ej.: Primo, compañero de trabajo…">
      <small class="error"></small>
    </div>
  `;

  // --- Eliminar el bloque individual y sincronizar todo ---
  bloque.querySelector('.btn-eliminar').addEventListener('click', () => {
    bloque.remove();
    renumerar();
    sincronizarContador();
  });

  // --- Teléfono: solo dígitos; rojo solo al salir del campo ---
  const telefono = bloque.querySelector('[data-tipo="telefono"]');
  const campoPais = bloque.querySelector('[data-tipo="pais"]');

  // Aplica el tope de dígitos del país elegido al campo de teléfono.
  function ajustarTopeTelefono() {
    const opcion = campoPais.options[campoPais.selectedIndex];
    telefono.maxLength = Number(opcion.dataset.max) || 15;
  }
  ajustarTopeTelefono(); // con el país que viene por defecto (+51)
  campoPais.addEventListener('change', () => {
    ajustarTopeTelefono();
    validarCampo(telefono, true);
  });

  telefono.addEventListener('input', () => {
    telefono.value = telefono.value.replace(/\D/g, '').slice(0, telefono.maxLength);
    validarCampo(telefono);
  });
  telefono.addEventListener('blur', () => {
    telefono.dataset.tocado = '1';
    validarCampo(telefono, true);
  });

  // --- Nombre y correo: validación básica en tiempo real ---
  bloque.querySelectorAll('input:not([data-tipo="telefono"])').forEach(vincularCampo);

  // --- Relación "otro": despliegue del campo extra ---
  const selRelacion = bloque.querySelector('[data-tipo="relacion"]');
  const grupoRelOtro = bloque.querySelector('.campo-relacion-otro');
  selRelacion.addEventListener('change', () => {
    const esOtro = selRelacion.value === 'otro';
    alternar(grupoRelOtro, esOtro);
    selRelacion.dataset.tocado = '1';
    validarCampo(selRelacion, true);
    const inputOtro = bloque.querySelector('[data-tipo="otro-relacion"]');
    if (esOtro) validarCampo(inputOtro, true);
    else limpiarError(inputOtro);
  });

  return bloque;
}

/** Al pulsar "Agregar invitados" se regenera la lista con N bloques. */
btnAgregar.addEventListener('click', () => {
  if (!validarCantidad(true)) return;

  contenedor.innerHTML = '';
  const cantidad = Number(cantidadInput.value);
  for (let i = 1; i <= cantidad; i += 1) contenedor.appendChild(crearBloque(i));
});

cantidadInput.addEventListener('blur', () => {
  cantidadInput.dataset.tocado = '1';
  validarCantidad(true);
});

/** Renumera los bloques visibles y mantiene consistentes ids y labels. */
function renumerar() {
  contenedor.querySelectorAll('.invitado').forEach((bloque, i) => {
    const n = i + 1;
    bloque.querySelector('.num').textContent = n;
    bloque.querySelector('.invitado-nombre').textContent = `Invitado ${n}`;

    bloque.querySelectorAll('[data-bloque]').forEach((campo) => {
      const idViejo = campo.id;
      const base = campo.dataset.tipo === 'texto' ? 'nombre' : campo.dataset.tipo;
      campo.dataset.bloque = n;
      campo.id = `${base}-${n}`;
      const label = bloque.querySelector(`label[for="${idViejo}"]`);
      if (label) label.htmlFor = campo.id;
    });
  });
}

/** El campo de cantidad refleja siempre cuántos invitados hay ahora. */
function sincronizarContador() {
  cantidadInput.value = contenedor.querySelectorAll('.invitado').length;
}

/* ================= 6. Tipo de evento + fecha rápida ================= */

// Muestra el campo "Otro" solo si el evento es "otro".
function sincronizarEventoOtro() {
  const esOtro = $('evento-tipo').value === 'otro';
  alternar($('grupo-evento-otro'), esOtro);
  $('evento-tipo').dataset.tocado = '1';
  validarCampo($('evento-tipo'), true);
  if (esOtro) validarCampo($('evento-otro'), true);
  else limpiarError($('evento-otro'));
}

$('evento-tipo').addEventListener('change', sincronizarEventoOtro);

// Validación en tiempo real para el resto de campos del evento.
['evento-otro', 'fecha-evento', 'lugar-evento'].map($).forEach(vincularCampo);

// Accesos rápidos: Hoy, Mañana, +7 días.
function aISO(fecha) {
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${m}-${d}`;
}

document.querySelectorAll('.chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    const hoy = new Date();
    const fecha = chip.dataset.fecha === 'maniana'
      ? new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1)
      : chip.dataset.fecha === 'semana'
        ? new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 7)
        : hoy;

    $('fecha-evento').value = aISO(fecha);
    $('fecha-evento').dataset.tocado = '1';
    validarCampo($('fecha-evento'), true);
  });
});

/* ================= 7. Recolección de datos y formato .txt ================= */

/** Recoge todo lo del formulario en una sola estructura. */
function construirEntrada() {
  const selectEvento = $('evento-tipo');
  const evento = selectEvento.value === 'otro'
    ? $('evento-otro').value.trim()
    : selectEvento.value;

  const invitados = [...contenedor.querySelectorAll('.invitado')].map((bloque) => {
    const v = (tipo) => (bloque.querySelector(`[data-tipo="${tipo}"]`).value || '').trim();
    const rel = v('relacion');
    return {
      nombre:   v('texto'),
      correo:   v('correo'),
      telefono: `${v('pais')} ${v('telefono')}`.trim(),
      relacion: rel === 'otro' ? `Otro (${v('otro-relacion')})` : (RELACIONES[rel] || rel)
    };
  });

  return { evento, fecha: $('fecha-evento').value, lugar: $('lugar-evento').value.trim(), invitados };
}

/** Convierte "2026-12-15" en "15 de diciembre de 2026". */
function fechaLarga(iso) {
  if (!iso) return '';
  const [anio, mes, dia] = iso.split('-').map(Number);
  if (!anio || !mes || !dia) return iso;
  return `${dia} de ${MESES[mes - 1]} de ${anio}`;
}

/** Genera el texto del .txt con el formato exacto del enunciado. */
function construirTexto(e) {
  let texto = `=== EVENTO: ${e.evento} ===\n`;
  texto += `Fecha: ${e.fecha}\n`;
  texto += `Lugar: ${e.lugar}\n`;
  texto += `Total invitados: ${e.invitados.length}\n\n`;

  e.invitados.forEach((g, i) => {
    texto += `--- INVITADO ${i + 1} ---\n`;
    texto += `Nombre: ${g.nombre}\n`;
    texto += `Correo: ${g.correo}\n`;
    texto += `Teléfono: ${g.telefono}\n`;
    texto += `Relación: ${g.relacion}\n\n`;
  });

  return texto.trimEnd();
}

/* ================= 8. Descargas (Blob + URL.createObjectURL) =================
   El navegador crea una URL temporal con el contenido, simula el clic de
   descarga y libera la URL. No hace falta ningún servidor. */

function descargarBlob(blob, nombreArchivo) {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}

/* ================= 9. Generador de PDF (sin librerías) =================
   Esta sección construye el archivo PDF a bajo nivel (objetos, xref,
   texto WinAnsi). Se deja separada porque es lo más avanzado: el resto
   del programa no necesita entenderla para funcionar. */

const PDF_ANCHO = 595.28;   // A4 en puntos
const PDF_ALTO = 842.89;
const PDF_MARGEN = 50;

// Escapa ( ) \ dentro de una cadena de texto PDF.
function cadPdf(s) {
  return s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

// Convierte a WinAnsi para soportar los acentos del español.
function winAnsi(s) {
  let out = '';
  for (const ch of s) {
    const c = ch.codePointAt(0);
    if (c <= 0xff) out += String.fromCharCode(c);   // é ñ ó á … y ASCII
    else if (c === 0x2013 || c === 0x2014) out += '-';
    else if (c === 0x2018 || c === 0x2019) out += "'";
    else if (c === 0x201c || c === 0x201d) out += '"';
    else if (c === 0x2026) out += '...';
    else out += '?';
  }
  return out;
}

/**
 * Dibuja el contenido de las páginas y devuelve un array con el stream
 * de texto de cada una. Diseño centrado y elegante para cualquier ocasión.
 */
function dibujarPdf(e) {
  const paginas = [''];
  let y = 0;

  // Paleta (RGB de 0 a 1)
  const nav  = [0.16, 0.28, 0.38];
  const oro  = [0.72, 0.54, 0.18];
  const gris = [0.42, 0.46, 0.52];
  const tinta = [0.18, 0.20, 0.24];
  const suave = [0.88, 0.88, 0.88];
  const blanco = [1, 1, 1];

  function cmd(s) { paginas[paginas.length - 1] += s; }
  function lineas(x1, y1, x2, y2, color, g = 0.8) {
    cmd(`${color.join(' ')} RG ${g} w ${x1} ${y1} m ${x2} ${y2} l S\n`);
  }
  function rect(x, y, w, h, color) {
    cmd(`${color.join(' ')} rg ${x} ${y} ${w} ${h} re f\n`);
  }
  function texto(txt, x, y, tam, fu, color) {
    cmd(`BT /${fu} ${tam} Tf ${x} ${y} Td ${color.join(' ')} rg (${cadPdf(winAnsi(txt))}) Tj ET\n`);
  }

  // Ancho aproximado y texto centrado.
  const ancho = (t, s) => t.length * s * 0.55;
  function centrado(txt, tam, fu, color) {
    texto(txt, (PDF_ANCHO - ancho(txt, tam)) / 2, y, tam, fu, color);
  }

  // Texto centrado con salto de línea automático (nombres largos).
  function ajusteCentrado(txt, tam, fu, color) {
    const maxW = PDF_ANCHO - 2 * (PDF_MARGEN + 45);
    const lineasArr = [];
    let curva = '';
    txt.split(/\s+/).forEach((pal) => {
      const candidata = curva ? `${curva} ${pal}` : pal;
      if (ancho(candidata, tam) > maxW) {
        if (curva) lineasArr.push(curva);
        curva = pal;
      } else {
        curva = candidata;
      }
    });
    if (curva) lineasArr.push(curva);
    lineasArr.forEach((l) => { centrado(l, tam, fu, color); y -= tam * 1.3; });
  }

  // Ornamento: línea + rombo + línea, todo centrado.
  function ornamento() {
    lineas(PDF_ANCHO / 2 - 95, y, PDF_ANCHO / 2 - 14, y, oro, 1);
    lineas(PDF_ANCHO / 2 + 14, y, PDF_ANCHO / 2 + 95, y, oro, 1);
    cmd(`${oro.join(' ')} rg ${PDF_ANCHO / 2 - 4.5} ${y} m ${PDF_ANCHO / 2} ${y + 4.5} l ${PDF_ANCHO / 2 + 4.5} ${y} l ${PDF_ANCHO / 2} ${y - 4.5} l h f\n`);
    y -= 22;
  }

  // Marco doble: línea dorada + línea interior suave.
  function marco() {
    cmd(`${oro.join(' ')} RG 1.2 w ${24} ${24} ${PDF_ANCHO - 48} ${PDF_ALTO - 48} re S\n`);
    cmd(`${suave.join(' ')} RG 0.7 w ${31} ${31} ${PDF_ANCHO - 62} ${PDF_ALTO - 62} re S\n`);
  }

  // Cabecera de las páginas de continuación.
  function cabeceraContinuacion() {
    marco();
    y = PDF_ALTO - 90;
    centrado('Lista de invitados (continuación)', 14, 'F2', nav);
    y -= 22;
    lineas(PDF_ANCHO / 2 - 60, y, PDF_ANCHO / 2 + 60, y, oro, 1);
    y -= 34;
  }

  // ---------- Página 1 ----------
  marco();
  y = PDF_ALTO - 175;
  centrado('I N V I T A C I Ó N', 10.5, 'F3', oro);
  y -= 30;
  ajusteCentrado(e.evento, 25, 'F2', nav);
  y -= 12;
  ornamento();

  centrado('F E C H A', 8.5, 'F2', oro); y -= 16;
  centrado(fechaLarga(e.fecha), 12.5, 'F1', tinta); y -= 28;
  centrado('L U G A R', 8.5, 'F2', oro); y -= 16;
  ajusteCentrado(e.lugar, 12.5, 'F1', tinta);
  y -= 26;
  ornamento();
  y -= 6;
  centrado(`Lista de invitados (${e.invitados.length})`, 16, 'F2', nav);
  y -= 30;

  // ---------- Invitados ----------
  e.invitados.forEach((g, i) => {
    if (y < 100) {
      paginas.push('');
      cabeceraContinuacion();
    }

    // Ficha dorada con el número del invitado.
    const xNum = PDF_MARGEN + 34;
    rect(xNum, y, 15, 15, oro);
    texto(String(i + 1), xNum + (15 - ancho(String(i + 1), 10)) / 2, y + 11.5, 10, 'F2', blanco);
    texto(g.nombre, PDF_MARGEN + 58, y + 12.5, 12.5, 'F2', nav);
    y -= 22;

    [`Correo: ${g.correo}`, `Teléfono: ${g.telefono}`, `Relación: ${g.relacion}`].forEach((linea) => {
      texto(linea, PDF_MARGEN + 58, y, 9.8, 'F1', gris);
      y -= 14;
    });
    y -= 2;
    lineas(PDF_MARGEN + 34, y, PDF_ANCHO - PDF_MARGEN - 34, y, suave, 0.6);
    y -= 19;
  });

  // Pie de página final.
  y = 60;
  centrado(`— ${e.evento} —`, 9.5, 'F3', gris);

  return paginas;
}

/** Ensambla los objetos y produce el binario del archivo PDF. */
function construirPdf(e) {
  const streams = dibujarPdf(e);
  const n = streams.length;
  const nF1 = 3 + n * 2;
  const nF2 = nF1 + 1;
  const nF3 = nF1 + 2;

  const objetos = [];

  // 1: catálogo, 2: páginas
  objetos.push('<< /Type /Catalog /Pages 2 0 R >>');
  const kids = streams.map((_, i) => `${3 + i * 2} 0 R`).join(' ');
  objetos.push(`<< /Type /Pages /Kids [${kids}] /Count ${n} >>`);

  // Páginas y sus streams de contenido: (3,4), (5,6), …
  streams.forEach((stream, i) => {
    objetos.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PDF_ANCHO} ${PDF_ALTO}] ` +
      `/Resources << /Font << /F1 ${nF1} 0 R /F2 ${nF2} 0 R /F3 ${nF3} 0 R >> >> ` +
      `/Contents ${4 + i * 2} 0 R >>`
    );
  });
  streams.forEach((stream) => {
    objetos.push(`<< /Length ${stream.length} >>\nstream\n${stream}endstream`);
  });

  // Fuentes estándar de PDF (no requieren incrustación).
  objetos.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  objetos.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
  objetos.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique >>');

  // Ensamblado: tabla xref con el offset de cada objeto.
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objetos.forEach((o) => {
    offsets.push(pdf.length);
    pdf += `${offsets.length - 1} 0 obj\n${o}\nendobj\n`;
  });
  const inicioXref = pdf.length;
  pdf += `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objetos.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${inicioXref}\n%%EOF`;

  // Importante: pasar bytes exactos (WinAnsi = 1 byte por carácter).
  // Si se pasara un string, el navegador lo convertiría a UTF-8 y los
  // acentos se escribirían en 2 bytes, rompiendo el PDF.
  const bytes = new Uint8Array(pdf.length);
  for (let i = 0; i < pdf.length; i += 1) bytes[i] = pdf.charCodeAt(i) & 0xff;
  return new Blob([bytes], { type: 'application/pdf' });
}

/* ================= 10. Guardar y modal de vista previa ================= */

/** Rellena la mini maqueta del PDF del modal. */
function renderVistaPdf(e) {
  $('pdf-evento').textContent = e.evento;
  $('pdf-fecha').textContent = fechaLarga(e.fecha);
  $('pdf-lugar').textContent = e.lugar;
  $('pdf-total').textContent = e.invitados.length;

  const lista = $('pdf-lista');
  lista.innerHTML = '';
  e.invitados.forEach((g) => {
    const li = document.createElement('li');
    const b = document.createElement('b');
    b.textContent = g.nombre;
    const small = document.createElement('small');
    small.textContent = `${g.correo} · ${g.telefono} · ${g.relacion}`;
    li.append(b, small);
    lista.appendChild(li);
  });
}

/** Cambia entre las vistas .txt y PDF del modal. */
function irATab(tab) {
  const esTxt = tab === 'txt';
  $('tab-txt').classList.toggle('activo', esTxt);
  $('tab-pdf').classList.toggle('activo', !esTxt);
  preTxt.hidden = !esTxt;
  $('modal-pdf').hidden = esTxt;
}

$('tab-txt').addEventListener('click', () => irATab('txt'));
$('tab-pdf').addEventListener('click', () => irATab('pdf'));

/** Limpia todos los errores de un contenedor. */
function limpiarErrores(contenedor) {
  contenedor.querySelectorAll('.error').forEach((e) => { e.textContent = ''; });
  contenedor.querySelectorAll('.campo').forEach((c) => c.classList.remove('invalido'));
}

/**
 * Al pulsar "Guardar":
 * 1) Se validan todos los campos (evento e invitados).
 * 2) Si algo falla, se muestran los errores y no se continúa.
 * 3) Si todo está bien, se muestra la vista previa.
 */
btnGuardar.addEventListener('click', () => {
  limpiarErrores(document.querySelector('.app'));

  // Campos del evento.
  const eventoValido = ['evento-tipo', 'evento-otro', 'fecha-evento', 'lugar-evento']
    .map($).every((c) => validarCampo(c, true));

  // Invitados.
  const bloques = contenedor.querySelectorAll('.invitado');
  let invitadosValidos = true;
  bloques.forEach((bloque) => {
    bloque.querySelectorAll('[data-tipo]').forEach((campo) => {
      if (!validarCampo(campo, true)) invitadosValidos = false;
    });
  });

  if (!eventoValido || !invitadosValidos) return;
  if (bloques.length === 0) {
    cantidadInput.dataset.tocado = '1';
    mostrarError(cantidadInput, 'Primero agrega al menos un invitado.');
    return;
  }

  // Todo correcto: se prepara la vista previa.
  const entrada = construirEntrada();
  preTxt.textContent = construirTexto(entrada);
  renderVistaPdf(entrada);
  irATab('txt');
  modal.hidden = false;
});

/* Botones y cierre del modal. */
btnCancelar.addEventListener('click', () => { modal.hidden = true; });

btnDescargarTxt.addEventListener('click', () => {
  descargarBlob(new Blob([preTxt.textContent], { type: 'text/plain;charset=utf-8' }), 'invitados.txt');
  modal.hidden = true;
});

btnDescargarPdf.addEventListener('click', () => {
  descargarBlob(construirPdf(construirEntrada()), 'invitados.pdf');
  modal.hidden = true;
});

/* ================= 11. Reiniciar formulario ================= */

function reiniciarFormulario() {
  // Limpiar campos del evento
  ['evento-tipo', 'evento-otro', 'fecha-evento', 'lugar-evento'].forEach(id => {
    $(id).value = '';
    delete $(id).dataset.tocado;
  });
  alternar($('grupo-evento-otro'), false);

  // Limpiar invitados
  contenedor.innerHTML = '';
  cantidadInput.value = MIN_INVITADOS;
  delete cantidadInput.dataset.tocado;

  // Limpiar marcas de error
  limpiarErrores(document.querySelector('.app'));
}

btnReiniciar.addEventListener('click', reiniciarFormulario);

modal.addEventListener('click', (ev) => {
  if (ev.target === modal) modal.hidden = true;
});

document.addEventListener('keydown', (ev) => {
  if (ev.key === 'Escape' && !modal.hidden) modal.hidden = true;
});