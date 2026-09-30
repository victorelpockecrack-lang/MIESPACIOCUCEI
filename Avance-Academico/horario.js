// ==========================================================================
// horario.js: GESTIÓN DE HORARIO Y RENDERIZADO EN PARRILLA
// ==========================================================================

const CREDITOS_TOTALES_REQUERIDOS = 394;
const HORA_INICIO_PARRILLA = 7;   // 07:00 a.m.
const HORA_FIN_PARRILLA = 22;     // 15 filas (07:00 a.m. a 09:00 p.m.)

let estadoMaterias = {};
let horarioSemanal = [];
let datosKardex = {};
let checklistRequisitos = {};

// Paleta de 24 colores con fondo y color hexadecimal para la cabecera dinámica del modal
const PALETA_COLORES = [
  { clase: "color-card-1",  hex: "#e11d48" },
  { clase: "color-card-2",  hex: "#0284c7" },
  { clase: "color-card-3",  hex: "#10b981" },
  { clase: "color-card-4",  hex: "#8b5cf6" },
  { clase: "color-card-5",  hex: "#ea580c" },
  { clase: "color-card-6",  hex: "#0d9488" },
  { clase: "color-card-7",  hex: "#c026d3" },
  { clase: "color-card-8",  hex: "#ca8a04" },
  { clase: "color-card-9",  hex: "#4f46e5" },
  { clase: "color-card-10", hex: "#65a30d" },
  { clase: "color-card-11", hex: "#f43f5e" },
  { clase: "color-card-12", hex: "#06b6d4" },
  { clase: "color-card-13", hex: "#7e22ce" },
  { clase: "color-card-14", hex: "#f97316" },
  { clase: "color-card-15", hex: "#059669" },
  { clase: "color-card-16", hex: "#2563eb" },
  { clase: "color-card-17", hex: "#9f1239" },
  { clase: "color-card-18", hex: "#84cc16" },
  { clase: "color-card-19", hex: "#ec4899" },
  { clase: "color-card-20", hex: "#1e40af" },
  { clase: "color-card-21", hex: "#b45309" },
  { clase: "color-card-22", hex: "#0e7490" },
  { clase: "color-card-23", hex: "#701a75" },
  { clase: "color-card-24", hex: "#b91c1c" }
];

let mapaColoresMaterias = {};

const COLUMNA_DIA = {
  "LU": 2, // Lunes
  "MA": 3, // Martes
  "MI": 4, // Miércoles (I)
  "JU": 5, // Jueves
  "VI": 6, // Viernes
  "SA": 7  // Sábado
};

const NOMBRES_DIAS_COMPLETOS = {
  "LU": "LUNES",
  "MA": "MARTES",
  "MI": "MIÉRCOLES",
  "JU": "JUEVES",
  "VI": "VIERNES",
  "SA": "SÁBADO",
  "DO": "DOMINGO"
};

function normalizarClaveUDG(c) {
  if (!c) return "";
  let limpia = c.toUpperCase().trim();
  if (/^1\d{4}$/.test(limpia)) limpia = "I" + limpia.substring(1);
  return limpia;
}

function obtenerClaveUsuario() {
  return localStorage.getItem("usuarioNombre") || "default";
}

function consultarEstado(clave) {
  if (!estadoMaterias || !clave) return null;
  const cNorm = normalizarClaveUDG(clave);
  return estadoMaterias[cNorm] || estadoMaterias[clave] || null;
}

function detectarModulosActivos() {
  if (typeof MODULOS_ESPECIALIZACION === "undefined") return [];
  return MODULOS_ESPECIALIZACION.filter(modulo =>
    modulo.materias.some(mat => {
      const info = consultarEstado(mat.clave);
      return info && (info.aprobada || info.enCurso);
    })
  );
}

function resolverMateriaUA(claveUA) {
  const m = claveUA.match(/^UA(\d)_(\d)$/);
  if (!m) return null;

  const [, semDigito, slotDigito] = m;
  const semIdx = parseInt(semDigito, 10) - 1;
  const slotIdx = parseInt(slotDigito, 10) - 1;

  const modulosActivos = detectarModulosActivos();
  const moduloAsignado = modulosActivos[slotIdx];
  if (!moduloAsignado) return null;

  return moduloAsignado.materias[semIdx] || null;
}

function generarMapaColoresMaterias() {
  mapaColoresMaterias = {};
  if (!horarioSemanal || horarioSemanal.length === 0) return;

  const clavesUnicas = [...new Set(horarioSemanal.map(c => normalizarClaveUDG(c.clave)).filter(Boolean))];
  clavesUnicas.forEach((clave, index) => {
    mapaColoresMaterias[clave] = PALETA_COLORES[index % PALETA_COLORES.length];
  });
}

function obtenerObjetoColorPorClave(clave) {
  const cNorm = normalizarClaveUDG(clave);
  return mapaColoresMaterias[cNorm] || PALETA_COLORES[0];
}

// --------------------------------------------------------------------------
// MODAL DETALLE DE MATERIA CON COLOR DINÁMICO E INFORMACIÓN COMPLETA
// --------------------------------------------------------------------------
let sesionesDetalleActual = [];
let colorActualModalHex = "#0284c7";

function abrirModalDetalleMateria(claveMateria, diaSeleccionado = null) {
  const cNorm = normalizarClaveUDG(claveMateria);
  sesionesDetalleActual = horarioSemanal.filter(c => normalizarClaveUDG(c.clave) === cNorm);

  if (sesionesDetalleActual.length === 0) return;

  // Determinar la sesión a mostrar: según el día clickeado en la parrilla o la primera por defecto
  let indexInicial = 0;
  if (diaSeleccionado) {
    const idx = sesionesDetalleActual.findIndex(s => s.dia === diaSeleccionado);
    if (idx !== -1) indexInicial = idx;
  }

  const primeraSesion = sesionesDetalleActual[indexInicial] || sesionesDetalleActual[0];

  // Asignar el color de la tarjeta a la cabecera del modal
  const objColor = obtenerObjetoColorPorClave(cNorm);
  colorActualModalHex = objColor.hex;

  const headerModal = document.getElementById("detalle-header-dinamico");
  if (headerModal) {
    headerModal.style.backgroundColor = colorActualModalHex;
  }

  // Resolver nombre y créditos desde plan de estudios si no vienen en la sesión
  let nombreMateria = primeraSesion.nombre || "MATERIA";
  let creditosMateria = primeraSesion.creditos || 0;

  if (typeof PLAN_ESTUDIOS_ICOM_2021 !== "undefined") {
    PLAN_ESTUDIOS_ICOM_2021.forEach(sem => {
      sem.materias.forEach(mat => {
        if (normalizarClaveUDG(mat.clave) === cNorm) {
          nombreMateria = mat.nombre;
          if (!creditosMateria) creditosMateria = mat.creditos;
        }
      });
    });
  }

  if (typeof MODULOS_ESPECIALIZACION !== "undefined") {
    MODULOS_ESPECIALIZACION.forEach(mod => {
      mod.materias.forEach(mat => {
        if (normalizarClaveUDG(mat.clave) === cNorm) {
          nombreMateria = mat.nombre;
          if (!creditosMateria) creditosMateria = mat.creditos;
        }
      });
    });
  }

  // Asignar datos fijos de la materia
  const elTitulo = document.getElementById("detalle-materia-titulo");
  const elClave = document.getElementById("detalle-materia-clave");
  const elNRC = document.getElementById("detalle-materia-nrc");
  const elSec = document.getElementById("detalle-materia-seccion");
  const elCred = document.getElementById("detalle-materia-creditos");
  const elDias = document.getElementById("detalle-materia-dias");

  if (elTitulo) elTitulo.innerText = nombreMateria;
  if (elClave) elClave.innerText = cNorm;
  if (elNRC) elNRC.innerText = primeraSesion.nrc || "—";
  if (elSec) elSec.innerText = primeraSesion.seccion || "—";
  if (elCred) elCred.innerText = creditosMateria || "—";

  // Mostrar todos los días de la materia en la parte baja (INFORMACIÓN DE LA MATERIA)
  if (elDias) {
    const listaDias = sesionesDetalleActual.map(s => NOMBRES_DIAS_COMPLETOS[s.dia] || s.dia);
    elDias.innerText = [...new Set(listaDias)].join(", ");
  }

  // Generar botones limpios para cada sesión de día (sin flechas ni selectores desplegables)
  const containerTabs = document.getElementById("detalle-tabs-dias");
  if (containerTabs) {
    containerTabs.innerHTML = "";
    sesionesDetalleActual.forEach((sesion, idx) => {
      const nombreDia = NOMBRES_DIAS_COMPLETOS[sesion.dia] || sesion.dia;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.innerText = nombreDia;
      btn.className = `px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
        idx === indexInicial 
          ? 'text-white shadow-sm' 
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
      }`;
      if (idx === indexInicial) {
        btn.style.backgroundColor = colorActualModalHex;
      }
      btn.onclick = () => seleccionarPestanaDia(idx);
      containerTabs.appendChild(btn);
    });
  }

  seleccionarPestanaDia(indexInicial);

  const modal = document.getElementById("modal-detalle-materia");
  if (modal) modal.classList.remove("hidden");
}
window.abrirModalDetalleMateria = abrirModalDetalleMateria;

function seleccionarPestanaDia(index) {
  const sesion = sesionesDetalleActual[index];
  if (!sesion) return;

  // Actualizar estilo visual de los botones de días
  const tabs = document.querySelectorAll("#detalle-tabs-dias button");
  tabs.forEach((tab, i) => {
    if (i === index) {
      tab.className = "px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer text-white shadow-sm";
      tab.style.backgroundColor = colorActualModalHex;
    } else {
      tab.className = "px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer bg-slate-100 text-slate-600 hover:bg-slate-200";
      tab.style.backgroundColor = "";
    }
  });

  // Actualizar los datos de la sesión seleccionada
  const elHorario = document.getElementById("detalle-sesion-horario");
  const elEdificio = document.getElementById("detalle-sesion-edificio");
  const elAula = document.getElementById("detalle-sesion-aula");
  const elProfesor = document.getElementById("detalle-sesion-profesor");
  const elInicio = document.getElementById("detalle-sesion-inicio");
  const elFin = document.getElementById("detalle-sesion-fin");

  if (elHorario) elHorario.innerText = sesion.horario || "—";
  if (elEdificio) elEdificio.innerText = sesion.edificio || "CUCEI";
  if (elAula) elAula.innerText = sesion.aula || "AULA";
  if (elProfesor) elProfesor.innerText = sesion.profesor || "N/A";
  if (elInicio) elInicio.innerText = sesion.fechaInicio || "17-08-2026";
  if (elFin) elFin.innerText = sesion.fechaFin || "11-12-2026";
}
window.seleccionarPestanaDia = seleccionarPestanaDia;

function cerrarModalDetalleMateria() {
  const modal = document.getElementById("modal-detalle-materia");
  if (modal) modal.classList.add("hidden");
}
window.cerrarModalDetalleMateria = cerrarModalDetalleMateria;

// --------------------------------------------------------------------------
// GESTIÓN DE FONDO DE LA PARRILLA
// --------------------------------------------------------------------------
function abrirModalFondoParrilla() {
  const modal = document.getElementById("modal-personalizar-fondo-parrilla");
  if (modal) modal.classList.remove("hidden");
}
window.abrirModalFondoParrilla = abrirModalFondoParrilla;

function cerrarModalFondoParrilla() {
  const modal = document.getElementById("modal-personalizar-fondo-parrilla");
  if (modal) modal.classList.add("hidden");
}
window.cerrarModalFondoParrilla = cerrarModalFondoParrilla;

function aplicarTemaParrilla(nombreTema) {
  const grid = document.getElementById("parrilla-horario-matriz");
  if (!grid) return;

  grid.className = "parrilla-horario-grid";
  grid.style.backgroundImage = "";
  grid.style.backgroundColor = "";

  const usuario = obtenerClaveUsuario();

  if (nombreTema === "grad-midnight") grid.classList.add("fondo-grad-midnight");
  else if (nombreTema === "grad-aurora") grid.classList.add("fondo-grad-aurora");
  else if (nombreTema === "grad-ocean") grid.classList.add("fondo-grad-ocean");
  else if (nombreTema === "grad-cyberpunk") grid.classList.add("fondo-grad-cyberpunk");
  else if (nombreTema === "solido-slate") grid.classList.add("fondo-solido-slate");
  else if (nombreTema === "solido-obsidian") grid.classList.add("fondo-solido-obsidian");
  else if (nombreTema === "solido-navy") grid.classList.add("fondo-solido-navy");
  else if (nombreTema === "img-montana") grid.classList.add("fondo-img-montana");
  else if (nombreTema === "img-stars") grid.classList.add("fondo-img-stars");
  else grid.classList.add("fondo-parrilla-default");

  localStorage.setItem(`tema_parrilla_horario_${usuario}`, JSON.stringify({ tipo: 'clase', valor: nombreTema }));
  cerrarModalFondoParrilla();
}
window.aplicarTemaParrilla = aplicarTemaParrilla;

function cargarFondoPropioParrilla(input) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = e => {
    const base64Data = e.target.result;
    const grid = document.getElementById("parrilla-horario-matriz");
    if (grid) {
      grid.className = "parrilla-horario-grid";
      grid.style.backgroundImage = `linear-gradient(rgba(15, 23, 42, 0.78), rgba(15, 23, 42, 0.88)), url('${base64Data}')`;
      grid.style.backgroundSize = "cover";
    }
    const usuario = obtenerClaveUsuario();
    localStorage.setItem(`tema_parrilla_horario_${usuario}`, JSON.stringify({ tipo: 'custom', valor: base64Data }));
    cerrarModalFondoParrilla();
  };
  reader.readAsDataURL(file);
}
window.cargarFondoPropioParrilla = cargarFondoPropioParrilla;

function restablecerFondoParrillaPorDefecto() {
  const grid = document.getElementById("parrilla-horario-matriz");
  if (grid) {
    grid.className = "parrilla-horario-grid fondo-parrilla-default";
    grid.style.backgroundImage = "";
    grid.style.backgroundColor = "";
  }
  const usuario = obtenerClaveUsuario();
  localStorage.removeItem(`tema_parrilla_horario_${usuario}`);
  cerrarModalFondoParrilla();
}
window.restablecerFondoParrillaPorDefecto = restablecerFondoParrillaPorDefecto;

function restaurarPreferenciaFondoParrilla() {
  const usuario = obtenerClaveUsuario();
  const raw = localStorage.getItem(`tema_parrilla_horario_${usuario}`);
  if (!raw) return;

  try {
    const saved = JSON.parse(raw);
    const grid = document.getElementById("parrilla-horario-matriz");
    if (!grid) return;

    if (saved.tipo === 'clase') {
      aplicarTemaParrilla(saved.valor);
    } else if (saved.tipo === 'custom') {
      grid.className = "parrilla-horario-grid";
      grid.style.backgroundImage = `linear-gradient(rgba(15, 23, 42, 0.78), rgba(15, 23, 42, 0.88)), url('${saved.valor}')`;
      grid.style.backgroundSize = "cover";
    }
  } catch (e) {
    console.error("Error al restaurar fondo de la parrilla:", e);
  }
}

// --------------------------------------------------------------------------
// CARGA Y SINCRONIZACIÓN DE DATOS
// --------------------------------------------------------------------------
function cargarDatosAcademicos() {
  const usuario = obtenerClaveUsuario();
  const raw = localStorage.getItem(`academico_data_${usuario}`);
  const rawCheck = localStorage.getItem(`checklist_requisitos_${usuario}`);

  if (raw) {
    try {
      const data = JSON.parse(raw);
      estadoMaterias = data.estadoMaterias || {};
      horarioSemanal = data.horarioClasesSemanal || [];
      datosKardex = data.datosKardexEstudiante || {};
    } catch (e) {
      console.error("Error al leer JSON de datos:", e);
      estadoMaterias = {};
      horarioSemanal = [];
    }
  } else {
    estadoMaterias = {};
    horarioSemanal = [];
  }

  checklistRequisitos = rawCheck ? JSON.parse(rawCheck) : {};

  if (checklistRequisitos.fi === undefined && estadoMaterias["FI"]) {
    checklistRequisitos.fi = !!estadoMaterias["FI"].aprobada;
  }
  if (checklistRequisitos.pp === undefined && estadoMaterias["PP"]) {
    checklistRequisitos.pp = !!estadoMaterias["PP"].aprobada;
  }
}

function formatearHoraLabel(hora24) {
  const ampm = hora24 >= 12 ? 'p.m.' : 'a.m.';
  let h = hora24 % 12;
  if (h === 0) h = 12;
  const hPadded = h < 10 ? '0' + h : '' + h;
  return `${hPadded} ${ampm}`;
}

// --------------------------------------------------------------------------
// CÁLCULO DE LÍMITES DE FILA CON DESESTRUCTURACIÓN SEGURA
// --------------------------------------------------------------------------
function calcularLimitesFilaHorario(strHorario) {
  if (!strHorario) return null;

  // Desestructuración directa de la hora inicial y final
  const [horaInicio, horaFin] = strHorario.split("-");
  if (!horaInicio || !horaFin) return null;

  function extraerH(texto) {
    if (!texto) return { h: 0, m: 0 };
    const str = String(texto);
    const nums = str.match(/\d+/g);
    if (!nums) return { h: 0, m: 0 };
    let h = 0, m = 0;
    if (nums.length >= 2) {
      const [parteHora, parteMinuto] = nums;
      h = parseInt(parteHora, 10);
      m = parseInt(parteMinuto, 10);
    } else if (nums.length === 1) {
      const [parteUnica] = nums;
      if (parteUnica.length >= 3) {
        h = parseInt(parteUnica.slice(0, -2), 10);
        m = parseInt(parteUnica.slice(-2), 10);
      } else {
        h = parseInt(parteUnica, 10);
        m = 0;
      }
    }
    return { h, m };
  }

  const pIni = extraerH(horaInicio);
  const pFin = extraerH(horaFin);

  let horaInicioCerrada = pIni.h;
  let horaFinCerrada = pFin.h;

  if (pFin.m >= 45) {
    horaFinCerrada += 1;
  } else if (pFin.m > 0) {
    horaFinCerrada += 1;
  }

  let filaInicio = (horaInicioCerrada - HORA_INICIO_PARRILLA) + 2;
  let filaFin = (horaFinCerrada - HORA_INICIO_PARRILLA) + 2;

  filaInicio = Math.max(2, Math.min(17, filaInicio));
  filaFin = Math.max(filaInicio + 1, Math.min(17, filaFin));

  return { filaInicio, filaFin };
}

// --------------------------------------------------------------------------
// RENDERIZADO DE LA PARRILLA DE HORARIO
// --------------------------------------------------------------------------
function renderizarParrillaHorario() {
  const container = document.getElementById("parrilla-horario-matriz");
  const avisoSinHorario = document.getElementById("aviso-sin-horario");
  const subtituloCreditos = document.getElementById("subtitulo-creditos-horario");
  const badgeTotalMats = document.getElementById("badge-total-materias");
  const tituloCiclo = document.getElementById("titulo-ciclo-horario");

  if (!container) return;

  if (datosKardex && datosKardex.ultimoCiclo && datosKardex.ultimoCiclo !== "Sin archivo") {
    if (tituloCiclo) tituloCiclo.innerText = `HORARIO DE CURSOS DEL CICLO ${datosKardex.ultimoCiclo}`;
  }

  if (!horarioSemanal || horarioSemanal.length === 0) {
    if (avisoSinHorario) avisoSinHorario.classList.remove("hidden");
    container.parentElement.parentElement.classList.add("hidden");
    return;
  }

  if (avisoSinHorario) avisoSinHorario.classList.add("hidden");
  container.parentElement.parentElement.classList.remove("hidden");

  generarMapaColoresMaterias();

  while (container.children.length > 7) {
    container.removeChild(container.lastChild);
  }

  const totalHoras = HORA_FIN_PARRILLA - HORA_INICIO_PARRILLA;

  for (let i = 0; i < totalHoras; i++) {
    const horaActual = HORA_INICIO_PARRILLA + i;
    const filaGrid = i + 2;

    const celdaHora = document.createElement("div");
    celdaHora.className = "parrilla-hora-label";
    celdaHora.style.gridRow = `${filaGrid} / ${filaGrid + 1}`;
    celdaHora.style.gridColumn = "1 / 2";
    celdaHora.innerText = formatearHoraLabel(horaActual);
    container.appendChild(celdaHora);

    for (let c = 2; c <= 7; c++) {
      const slot = document.createElement("div");
      slot.className = "parrilla-celda-slot";
      slot.style.gridRow = `${filaGrid} / ${filaGrid + 1}`;
      slot.style.gridColumn = `${c} / ${c + 1}`;
      container.appendChild(slot);
    }
  }

  let creditosEnHorario = 0;
  const materiasUnicas = new Set();

  horarioSemanal.forEach(clase => {
    const colIndex = COLUMNA_DIA[clase.dia];
    if (!colIndex) return;

    const limites = calcularLimitesFilaHorario(clase.horario);
    if (!limites) return;

    const cNorm = normalizarClaveUDG(clase.clave);
    materiasUnicas.add(cNorm);

    const card = document.createElement("div");
    const objColor = obtenerObjetoColorPorClave(cNorm);
    card.className = `tarjeta-materia-parrilla ${objColor.clase}`;
    card.style.gridColumn = `${colIndex} / ${colIndex + 1}`;
    card.style.gridRow = `${limites.filaInicio} / ${limites.filaFin}`;

    // Al hacer clic, pasa la clave y el día exacto de la tarjeta seleccionada
    card.onclick = () => abrirModalDetalleMateria(cNorm, clase.dia);

    let nombreLimpio = clase.nombre || "MATERIA";
    if (typeof PLAN_ESTUDIOS_ICOM_2021 !== "undefined") {
      PLAN_ESTUDIOS_ICOM_2021.forEach(sem => {
        sem.materias.forEach(mat => {
          if (normalizarClaveUDG(mat.clave) === cNorm) {
            nombreLimpio = mat.nombre;
          }
        });
      });
    }

    if (typeof MODULOS_ESPECIALIZACION !== "undefined") {
      MODULOS_ESPECIALIZACION.forEach(mod => {
        mod.materias.forEach(mat => {
          if (normalizarClaveUDG(mat.clave) === cNorm) {
            nombreLimpio = mat.nombre;
          }
        });
      });
    }

    card.innerHTML = `
      <div class="tarjeta-materia-clave">${cNorm || 'CUCEI'}</div>
      <div class="tarjeta-materia-nombre" title="${nombreLimpio}">${nombreLimpio}</div>
      <div class="tarjeta-materia-pie">
        <span>${clase.edificio} • ${clase.aula}</span>
      </div>
    `;

    container.appendChild(card);
  });

  materiasUnicas.forEach(claveMateria => {
    let cred = 0;
    if (typeof PLAN_ESTUDIOS_ICOM_2021 !== "undefined") {
      PLAN_ESTUDIOS_ICOM_2021.forEach(sem => {
        sem.materias.forEach(mat => {
          if (normalizarClaveUDG(mat.clave) === claveMateria) {
            cred = Number(mat.creditos || 0);
          }
        });
      });
    }
    if (cred === 0 && typeof MODULOS_ESPECIALIZACION !== "undefined") {
      MODULOS_ESPECIALIZACION.forEach(mod => {
        mod.materias.forEach(mat => {
          if (normalizarClaveUDG(mat.clave) === claveMateria) {
            cred = Number(mat.creditos || 0);
          }
        });
      });
    }
    creditosEnHorario += cred;
  });

  if (subtituloCreditos) {
    subtituloCreditos.innerText = `TOTAL DE CRÉDITOS EN CURSO: ${creditosEnHorario} C`;
  }
  if (badgeTotalMats) {
    badgeTotalMats.innerText = `${materiasUnicas.size} Asignaturas Registradas`;
  }
}
window.renderizarParrillaHorario = renderizarParrillaHorario;

function actualizarBannerMetricas() {
  let aprobadas = 0;
  let enCurso = 0;
  let creditosTotal = 0;
  let totalMateriasPlan = 0;

  if (typeof PLAN_ESTUDIOS_ICOM_2021 !== "undefined") {
    PLAN_ESTUDIOS_ICOM_2021.forEach(sem => {
      sem.materias.forEach(mat => {
        if (mat.esCasillaDual || mat.clave === "FI" || mat.clave === "PP") return;
        totalMateriasPlan++;

        let claveCheck = mat.clave;
        let credsMateria = Number(mat.creditos || 0);

        if (/^UA\d_\d$/.test(mat.clave)) {
          const s = resolverMateriaUA(mat.clave);
          if (s) {
            claveCheck = s.clave;
            credsMateria = Number(s.creditos || 0);
          }
        }

        const info = consultarEstado(claveCheck);
        if (info) {
          if (info.aprobada) {
            aprobadas++;
            creditosTotal += credsMateria;
          } else if (info.enCurso) {
            enCurso++;
          }
        }
      });
    });
  }

  if (checklistRequisitos.fi) creditosTotal += 4;
  if (checklistRequisitos.pp) creditosTotal += 6;

  const pendientes = Math.max(0, totalMateriasPlan - (aprobadas + enCurso));
  const porcentaje = Math.min(100, Math.round((creditosTotal / CREDITOS_TOTALES_REQUERIDOS) * 100));

  const elApr = document.getElementById("total-aprobadas");
  const elCur = document.getElementById("total-en-curso");
  const elPen = document.getElementById("materias-pendientes");
  const elAvance = document.getElementById("porcentaje-avance");
  const elCred = document.getElementById("total-creditos");

  if (elApr) elApr.innerText = aprobadas;
  if (elCur) elCur.innerText = enCurso;
  if (elPen) elPen.innerText = pendientes;
  if (elAvance) elAvance.innerText = `${porcentaje}%`;
  if (elCred) elCred.innerText = `${creditosTotal} / ${CREDITOS_TOTALES_REQUERIDOS} C`;
}
window.actualizarBannerMetricas = actualizarBannerMetricas;

// --------------------------------------------------------------------------
// MODAL HORARIO SEMANAL (VER MIS CLASES)
// --------------------------------------------------------------------------
function abrirModalHorarioModal() {
  const modal = document.getElementById("modal-horario");
  if (!modal) return;
  renderizarHorarioSemanalModal();
  modal.classList.remove("hidden");
}
window.abrirModalHorarioModal = abrirModalHorarioModal;

function cerrarModalHorarioModal() {
  const modal = document.getElementById("modal-horario");
  if (modal) modal.classList.add("hidden");
}
window.cerrarModalHorarioModal = cerrarModalHorarioModal;

function renderizarHorarioSemanalModal() {
  const container = document.getElementById("grid-dias-horario");
  const elTotal = document.getElementById("total-asignaciones");
  if (!container) return;

  container.innerHTML = "";
  const diasSemana = [
    { key: "LU", label: "LU" },
    { key: "MA", label: "MA" },
    { key: "MI", label: "MI" },
    { key: "JU", label: "JU" },
    { key: "VI", label: "VI" },
    { key: "SA", label: "SA" },
    { key: "DO", label: "DO" }
  ];

  let totalClasesSemana = 0;

  diasSemana.forEach(d => {
    const col = document.createElement("div");
    col.className = "flex flex-col gap-2.5 bg-slate-900/50 p-2.5 rounded-xl border border-slate-800/80 min-h-[300px]";

    const header = document.createElement("div");
    header.className = "bg-[#1e293b] text-white font-black text-center py-1.5 rounded-lg text-xs uppercase tracking-wider shadow-sm border border-slate-700/50";
    header.innerText = d.label;
    col.appendChild(header);

    const clasesDelDia = horarioSemanal.filter(c => c.dia === d.key);
    totalClasesSemana += clasesDelDia.length;

    if (clasesDelDia.length === 0) {
      const vacio = document.createElement("div");
      vacio.className = "text-[10px] text-slate-500 text-center py-6 italic font-medium";
      vacio.innerText = "Libre";
      col.appendChild(vacio);
    } else {
      clasesDelDia.forEach(clase => {
        const cNorm = normalizarClaveUDG(clase.clave);
        let nombreLimpio = clase.nombre || "MATERIA";
        if (typeof PLAN_ESTUDIOS_ICOM_2021 !== "undefined") {
          PLAN_ESTUDIOS_ICOM_2021.forEach(sem => {
            sem.materias.forEach(mat => {
              if (normalizarClaveUDG(mat.clave) === cNorm) nombreLimpio = mat.nombre;
            });
          });
        }
        if (typeof MODULOS_ESPECIALIZACION !== "undefined") {
          MODULOS_ESPECIALIZACION.forEach(mod => {
            mod.materias.forEach(mat => {
              if (normalizarClaveUDG(mat.clave) === cNorm) nombreLimpio = mat.nombre;
            });
          });
        }

        const card = document.createElement("div");
        card.className = "bg-white border border-sky-300 rounded-lg p-2 text-left shadow-sm";
        card.innerHTML = `
          <div class="flex justify-between items-center">
            <span class="text-[9px] font-black text-sky-700">${cNorm}</span>
            <span class="text-[8px] bg-sky-100 text-sky-800 px-1 rounded font-bold">${clase.horario}</span>
          </div>
          <p class="text-[9px] font-bold text-slate-800 truncate mt-1">${nombreLimpio}</p>
          <p class="text-[8px] text-slate-500 mt-0.5">🏢 ${clase.edificio} • 📍 ${clase.aula}</p>
        `;
        col.appendChild(card);
      });
    }
    container.appendChild(col);
  });

  if (elTotal) elTotal.innerText = `${totalClasesSemana} clases a la semana`;
}

// --------------------------------------------------------------------------
// MENÚS, PERFIL Y CONFIGURACIÓN
// --------------------------------------------------------------------------
function toggleMenuPrincipal() {
  const menu = document.getElementById('menuLateralOpciones');
  if (menu) menu.classList.toggle('hidden');
}
window.toggleMenuPrincipal = toggleMenuPrincipal;

function abrirModalPerfil() {
  const usuarioActivo = obtenerClaveUsuario();
  const cuentas = JSON.parse(localStorage.getItem('cuentasUsuarios') || '[]');
  const cuenta = cuentas.find(u => u.usuario === usuarioActivo || u.correo === usuarioActivo);

  const elUsuario = document.getElementById('perfilUsuarioNombre');
  const elCorreo = document.getElementById('perfilUsuarioCorreo');

  if (elUsuario) elUsuario.innerText = cuenta ? cuenta.usuario : usuarioActivo;
  if (elCorreo) elCorreo.innerText = cuenta ? cuenta.correo : "No registrado";

  actualizarTextosPerfilUI();
  const modal = document.getElementById('modal-perfil-usuario');
  if (modal) modal.classList.remove('hidden');
}
window.abrirModalPerfil = abrirModalPerfil;

function cerrarModalPerfil() {
  const modal = document.getElementById('modal-perfil-usuario');
  if (modal) modal.classList.add('hidden');
}
window.cerrarModalPerfil = cerrarModalPerfil;

function actualizarTextosPerfilUI() {
  const elSit = document.getElementById('perfilKardexSituacion');
  const elAdm = document.getElementById('perfilKardexAdmision');
  const elUlt = document.getElementById('perfilKardexUltimoCiclo');

  if (elSit) elSit.innerText = datosKardex.situacion || "Sin archivo";
  if (elAdm) elAdm.innerText = datosKardex.admision || "Sin archivo";
  if (elUlt) elUlt.innerText = datosKardex.ultimoCiclo || "Sin archivo";
}

function abrirModalConfiguracion() {
  cargarFotoPerfilUI();
  const modal = document.getElementById('modal-configuracion');
  if (modal) modal.classList.remove('hidden');
}
window.abrirModalConfiguracion = abrirModalConfiguracion;

function cerrarModalConfiguracion() {
  const modal = document.getElementById('modal-configuracion');
  if (modal) modal.classList.add('hidden');
}
window.cerrarModalConfiguracion = cerrarModalConfiguracion;

function cargarFotoPerfilUI() {
  const usuario = obtenerClaveUsuario();
  const foto = localStorage.getItem(`fotoPerfil_${usuario}`);
  const navImg = document.getElementById('avatarUsuarioNav');
  const navIco = document.getElementById('iconoUsuarioNav');
  const prevImg = document.getElementById('avatarConfigPreview');
  const prevIco = document.getElementById('avatarIconoPreview');

  if (foto) {
    if (navImg) { navImg.src = foto; navImg.classList.remove('hidden'); }
    if (navIco) navIco.classList.add('hidden');
    if (prevImg) { prevImg.src = foto; prevImg.classList.remove('hidden'); }
    if (prevIco) prevIco.classList.add('hidden');
  } else {
    if (navImg) navImg.classList.add('hidden');
    if (navIco) navIco.classList.remove('hidden');
    if (prevImg) prevImg.classList.add('hidden');
    if (prevIco) prevIco.classList.remove('hidden');
  }
}

function procesarFotoPerfil(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    localStorage.setItem(`fotoPerfil_${obtenerClaveUsuario()}`, e.target.result);
    cargarFotoPerfilUI();
  };
  reader.readAsDataURL(file);
}
window.procesarFotoPerfil = procesarFotoPerfil;

function eliminarFotoPerfil() {
  localStorage.removeItem(`fotoPerfil_${obtenerClaveUsuario()}`);
  cargarFotoPerfilUI();
}
window.eliminarFotoPerfil = eliminarFotoPerfil;

function actualizarPreferenciaAnimaciones(checkbox) {
  if (checkbox.checked) {
    document.body.classList.remove('no-transitions');
  } else {
    document.body.classList.add('no-transitions');
  }
}
window.actualizarPreferenciaAnimaciones = actualizarPreferenciaAnimaciones;

function limpiarArchivosHorario() {
  const usuario = obtenerClaveUsuario();
  localStorage.removeItem(`academico_data_${usuario}`);
  localStorage.removeItem(`checklist_requisitos_${usuario}`);
  localStorage.removeItem(`tema_parrilla_horario_${usuario}`);
  
  estadoMaterias = {};
  horarioSemanal = [];
  checklistRequisitos = {};
  datosKardex = { situacion: "Sin archivo", admision: "Sin archivo", ultimoCiclo: "Sin archivo" };

  actualizarBannerMetricas();
  renderizarParrillaHorario();
  restablecerFondoParrillaPorDefecto();
  actualizarTextosPerfilUI();
  cerrarModalConfiguracion();
}
window.limpiarArchivosHorario = limpiarArchivosHorario;

function cerrarSesionUsuario() {
  localStorage.removeItem('usuarioNombre');
  window.location.href = 'index.html';
}
window.cerrarSesionUsuario = cerrarSesionUsuario;

// --------------------------------------------------------------------------
// EVENTOS GLOBALES DE VENTANA
// --------------------------------------------------------------------------
window.onclick = function(e) {
  // Cierre de menú lateral al hacer clic fuera
  if (!e.target.closest('#btnMenuPrincipal') && !e.target.closest('#menuLateralOpciones')) {
    const menu = document.getElementById('menuLateralOpciones');
    if (menu && !menu.classList.contains('hidden')) menu.classList.add('hidden');
  }
};

// --------------------------------------------------------------------------
// INICIALIZACIÓN GENERAL (DOMContentLoaded)
// --------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  const usuario = obtenerClaveUsuario();
  const elSaludo = document.getElementById('saludoUsuario');
  if (elSaludo && usuario !== "default") {
    let clean = usuario.includes('@') ? usuario.split('@')[0] : usuario;
    clean = clean.charAt(0).toUpperCase() + clean.slice(1);
    elSaludo.innerText = `Horario de Clases de ${clean}`;
  }

  restaurarPreferenciaFondoParrilla();
  cargarFotoPerfilUI();
  cargarDatosAcademicos();
  actualizarBannerMetricas();
  renderizarParrillaHorario();

  // Cerrar modal de detalle haciendo clic en el fondo oscuro exterior
  const modalDetalle = document.getElementById("modal-detalle-materia");
  if (modalDetalle) {
    modalDetalle.addEventListener("click", (e) => {
      if (e.target === modalDetalle) {
        cerrarModalDetalleMateria();
      }
    });
  }

  // Cerrar cualquier modal abierto con la tecla Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      cerrarModalDetalleMateria();
      cerrarModalFondoParrilla();
      cerrarModalHorarioModal();
      cerrarModalPerfil();
      cerrarModalConfiguracion();
    }
  });
});