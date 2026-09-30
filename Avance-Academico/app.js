// ==========================================================================
// app.js: SISTEMA INTEGRADO ÚNICO Y AUTÓNOMO
// ==========================================================================

const REQUISITOS_EGRESO = ["SS_ING", "PP", "FI", "PROY_MOD", "EGEL"];
const CREDITOS_TOTALES_REQUERIDOS = 394;

// Estados y estructuras globales
window.estadoMaterias = window.estadoMaterias || {};
window.horarioClasesSemanal = window.horarioClasesSemanal || [];
let MAPA_PLAN_ESTUDIOS = {};

// Instancias Chart.js (Dashboard principal)
let chartAvanceInstance = null;
let chartPromedioInstance = null;
window.chartCreditosSemestreInstance = window.chartCreditosSemestreInstance || null;
window.chartAvanceCiclosInstance = window.chartAvanceCiclosInstance || null;
window.chartAreasFormacionInstance = window.chartAreasFormacionInstance || null;

// Instancias Chart.js (Simulador)
window.chartSimAvanceDonaInstance = window.chartSimAvanceDonaInstance || null;
window.chartSimSemestresInstance = window.chartSimSemestresInstance || null;
window.chartSimCiclosInstance = window.chartSimCiclosInstance || null;
window.chartSimAreasFormacionInstance = window.chartSimAreasFormacionInstance || null;

// Créditos y ciclos
window.creditosExtraRequisitos = window.creditosExtraRequisitos || { fi: 0, pp: 0 };

window.promediosCiclosCreditos = window.promediosCiclosCreditos || {
  ciclos: ["2023-A", "2023-B", "2024-A", "2024-B", "2025-A", "2025-B", "2026-A", "2026-B"],
  acumulados: [0, 0, 0, 0, 0, 0, 0, 0],
  porCiclo: [0, 0, 0, 0, 0, 0, 0, 0]
};

let datosKardexEstudiante = {
  situacion: "Sin archivo",
  admision: "Sin archivo",
  ultimoCiclo: "Sin archivo"
};

let promediosHistoricos = {
  ciclos: ["2023-A", "2023-B", "2024-A", "2024-B", "2025-A", "2025-B", "2026-A", "2026-B"],
  valores: [null, null, null, null, null, null, null, null],
  promedioGeneral: "—"
};

let passwordVisible = false;
let passwordReal = "••••••••";

// --------------------------------------------------------------------------
// 1. ESTADO DE HORARIO HOY
// --------------------------------------------------------------------------
function actualizarEstadoHorarioHoy() {
  const titulo = document.getElementById('horarioTitulo');
  const subtitulo = document.getElementById('horarioSubtitulo');
  if (!titulo || !subtitulo) return;

  const diasSemana = ["DO", "LU", "MA", "MI", "JU", "VI", "SA"];
  const diaHoy = diasSemana[new Date().getDay()];
  const horario = window.horarioClasesSemanal || [];
  const clasesHoy = horario.filter(c => c.dia === diaHoy);

  if (clasesHoy.length > 0) {
    titulo.innerText = "¡Tienes clases hoy!";
    subtitulo.innerText = `Tienes ${clasesHoy.length} asignación(es) programada(s) para hoy.`;
  } else {
    titulo.innerText = "¡Disfruta de tu día libre!";
    subtitulo.innerText = "Hoy no existen clases programadas para ti.";
  }
}
window.actualizarEstadoHorarioHoy = actualizarEstadoHorarioHoy;

// --------------------------------------------------------------------------
// 2. PERSISTENCIA EN LOCALSTORAGE POR USUARIO
// --------------------------------------------------------------------------
function obtenerClaveUsuarioActivo() {
  return localStorage.getItem("usuarioNombre") || "default";
}

function guardarDatosSesionUsuario() {
  const usuario = obtenerClaveUsuarioActivo();
  if (!usuario || usuario === "default") return;

  const paqueteDatos = {
    carreraSeleccionada: document.getElementById("selectedCareer")?.innerText || "",
    estadoMaterias: window.estadoMaterias || {},
    horarioClasesSemanal: window.horarioClasesSemanal || [],
    datosKardexEstudiante: datosKardexEstudiante,
    promediosHistoricos: promediosHistoricos,
    promediosCiclosCreditos: window.promediosCiclosCreditos,
    creditosExtraRequisitos: window.creditosExtraRequisitos,
    nombreKardex: document.getElementById("texto-kardex")?.innerText || "Sin archivo",
    nombreHorario: document.getElementById("texto-horario")?.innerText || "Sin archivo"
  };

  try {
    localStorage.setItem(`academico_data_${usuario}`, JSON.stringify(paqueteDatos));
  } catch (err) {
    console.warn("Error al guardar sesión:", err);
  }
}
window.guardarDatosSesionUsuario = guardarDatosSesionUsuario;

function restaurarDatosSesionUsuario() {
  const usuario = obtenerClaveUsuarioActivo();
  if (!usuario || usuario === "default") return false;

  const raw = localStorage.getItem(`academico_data_${usuario}`);
  if (!raw) return false;

  try {
    const data = JSON.parse(raw);

    if (data.estadoMaterias && Object.keys(data.estadoMaterias).length > 0) {
      window.estadoMaterias = data.estadoMaterias;
    }
    if (data.horarioClasesSemanal && Array.isArray(data.horarioClasesSemanal)) {
      window.horarioClasesSemanal = data.horarioClasesSemanal;
    }
    if (data.promediosCiclosCreditos) {
      window.promediosCiclosCreditos = data.promediosCiclosCreditos;
    }
    if (data.creditosExtraRequisitos) {
      window.creditosExtraRequisitos = data.creditosExtraRequisitos;
    }
    if (data.datosKardexEstudiante) {
      datosKardexEstudiante = data.datosKardexEstudiante;
    }
    if (data.promediosHistoricos) {
      promediosHistoricos = data.promediosHistoricos;
    }

    const txtKardex = document.getElementById("texto-kardex");
    const btnQK = document.getElementById("btn-quitar-kardex");
    if (txtKardex && data.nombreKardex && data.nombreKardex !== "Sin archivo") {
      txtKardex.innerText = data.nombreKardex;
      if (btnQK) btnQK.classList.remove("hidden");
    }

    const txtHorario = document.getElementById("texto-horario");
    const btnQH = document.getElementById("btn-quitar-horario");
    const btnVC = document.getElementById("btn-ver-clases");
    if (txtHorario && data.nombreHorario && data.nombreHorario !== "Sin archivo") {
      txtHorario.innerText = data.nombreHorario;
      if (btnQH) btnQH.classList.remove("hidden");
      if (btnVC && window.horarioClasesSemanal && window.horarioClasesSemanal.length > 0) {
        btnVC.classList.remove("hidden");
      }
    }

    const tieneDatos = (data.nombreKardex && data.nombreKardex !== "Sin archivo") ||
                       (data.nombreHorario && data.nombreHorario !== "Sin archivo") ||
                       (Object.keys(window.estadoMaterias).length > 0);

    const carrera = data.carreraSeleccionada && data.carreraSeleccionada !== "Seleccionar carrera..."
      ? data.carreraSeleccionada
      : (tieneDatos ? "Ingeniería en Computación" : null);

    if (carrera && typeof seleccionarCarrera === "function") {
      seleccionarCarrera(carrera);
    }

    actualizarTextosPerfilUI();
    actualizarEstadoHorarioHoy();
    actualizarTodo();
    return true;
  } catch (e) {
    console.error("Error al restaurar sesión:", e);
    return false;
  }
}
window.restaurarDatosSesionUsuario = restaurarDatosSesionUsuario;

function guardarEstadoChecklist() {
  const usuario = obtenerClaveUsuarioActivo();
  if (!usuario || usuario === "default") return;

  const checkFI = document.getElementById("check-fi");
  const checkSS = document.getElementById("check-ss");
  const checkPP = document.getElementById("check-pp");
  const checkEGEL = document.getElementById("check-egel");
  const checkPM = document.getElementById("check-pm");
  const checkIngles = document.getElementById("check-ingles");

  if (!checkFI && !checkSS) return;

  const data = {
    fi: checkFI ? checkFI.checked : false,
    ss: checkSS ? checkSS.checked : false,
    pp: checkPP ? checkPP.checked : false,
    egel: checkEGEL ? checkEGEL.checked : false,
    pm: checkPM ? checkPM.checked : false,
    ingles: checkIngles ? checkIngles.checked : false
  };

  localStorage.setItem(`checklist_requisitos_${usuario}`, JSON.stringify(data));

  if (!window.estadoMaterias) window.estadoMaterias = {};

  window.estadoMaterias["FI"] = { aprobada: data.fi, creditos: data.fi ? 4 : 0 };
  window.estadoMaterias["SS"] = { aprobada: data.ss, creditos: 0 };
  window.estadoMaterias["ING_B1"] = { aprobada: data.ingles, creditos: 0 };
  window.estadoMaterias["PP"] = { aprobada: data.pp, creditos: data.pp ? 6 : 0 };
  window.estadoMaterias["PROY_MOD"] = { aprobada: data.pm, creditos: 0 };
  window.estadoMaterias["EGEL"] = { aprobada: data.egel, creditos: 0 };

  guardarDatosSesionUsuario();
}
window.guardarEstadoChecklist = guardarEstadoChecklist;

function restaurarEstadoChecklist() {
  const usuario = obtenerClaveUsuarioActivo();
  if (!usuario || usuario === "default") return;

  const raw = localStorage.getItem(`checklist_requisitos_${usuario}`);
  if (!raw) return;

  try {
    const saved = JSON.parse(raw);

    const checkFI = document.getElementById("check-fi");
    const checkSS = document.getElementById("check-ss");
    const checkPP = document.getElementById("check-pp");
    const checkEGEL = document.getElementById("check-egel");
    const checkPM = document.getElementById("check-pm");
    const checkIngles = document.getElementById("check-ingles");

    if (checkFI) {
      checkFI.checked = !!saved.fi;
      window.creditosExtraRequisitos.fi = saved.fi ? 4 : 0;
    }
    if (checkSS) {
      checkSS.checked = !!saved.ss;
    }
    if (checkPP) {
      checkPP.checked = !!saved.pp;
      window.creditosExtraRequisitos.pp = saved.pp ? 6 : 0;
    }
    if (checkEGEL) {
      checkEGEL.checked = !!saved.egel;
    }
    if (checkPM) {
      checkPM.checked = !!saved.pm;
    }
    if (checkIngles) {
      checkIngles.checked = !!saved.ingles;
    }

    if (!window.estadoMaterias) window.estadoMaterias = {};
    window.estadoMaterias["FI"] = { aprobada: !!saved.fi, creditos: saved.fi ? 4 : 0 };
    window.estadoMaterias["SS"] = { aprobada: !!saved.ss, creditos: 0 };
    window.estadoMaterias["ING_B1"] = { aprobada: !!saved.ingles, creditos: 0 };
    window.estadoMaterias["PP"] = { aprobada: !!saved.pp, creditos: saved.pp ? 6 : 0 };
    window.estadoMaterias["PROY_MOD"] = { aprobada: !!saved.pm, creditos: 0 };
    window.estadoMaterias["EGEL"] = { aprobada: !!saved.egel, creditos: 0 };
  } catch (e) {
    console.error("Error al restaurar checklist:", e);
  }
}
window.restaurarEstadoChecklist = restaurarEstadoChecklist;

// --------------------------------------------------------------------------
// 3. RESOLUCIÓN DE MATERIAS Y PLAN DE ESTUDIOS
// --------------------------------------------------------------------------
function consultarEstadoMateria(clave) {
  if (!window.estadoMaterias || !clave) return null;
  if (window.estadoMaterias[clave]) return window.estadoMaterias[clave];

  let altClave = clave;
  if (clave.startsWith("I")) altClave = "1" + clave.substring(1);
  else if (clave.startsWith("1")) altClave = "I" + clave.substring(1);

  return window.estadoMaterias[altClave] || null;
}
window.consultarEstadoMateria = consultarEstadoMateria;

function inicializarMapaPlanEstudios() {
  MAPA_PLAN_ESTUDIOS = {};
  if (typeof PLAN_ESTUDIOS_ICOM_2021 !== "undefined") {
    PLAN_ESTUDIOS_ICOM_2021.forEach(sem => {
      sem.materias.forEach(mat => {
        if (mat.esCasillaDual && mat.subItems) {
          mat.subItems.forEach(sub => {
            MAPA_PLAN_ESTUDIOS[sub.clave] = sub.nombre;
          });
        } else {
          MAPA_PLAN_ESTUDIOS[mat.clave] = mat.nombre;
        }
      });
    });
  }

  if (typeof MODULOS_ESPECIALIZACION !== "undefined") {
    MODULOS_ESPECIALIZACION.forEach(modulo => {
      modulo.materias.forEach(mat => {
        MAPA_PLAN_ESTUDIOS[mat.clave] = mat.nombre;
      });
    });
  }
}

function detectarModulosActivos() {
  if (typeof MODULOS_ESPECIALIZACION === "undefined") return [];

  return MODULOS_ESPECIALIZACION.filter(modulo =>
    modulo.materias.some(mat => {
      const info = consultarEstadoMateria(mat.clave);
      return info && (info.aprobada || info.enCurso);
    })
  );
}

function resolverMateriaUA(claveUA) {
  const m = claveUA.match(/^UA(\d)_(\d)$/);
  if (!m) return null;

  const semIdx = parseInt(m[1], 10) - 1;
  const slotIdx = parseInt(m[2], 10) - 1;

  const modulosActivos = detectarModulosActivos();
  const moduloAsignado = modulosActivos[slotIdx];
  if (!moduloAsignado) return null;

  const materiaReal = moduloAsignado.materias[semIdx];
  if (!materiaReal) return null;

  return {
    clave: materiaReal.clave,
    nombre: materiaReal.nombre,
    hc: materiaReal.hc,
    creditos: materiaReal.creditos,
    categoria: materiaReal.categoria || (semIdx === 2 ? "egreso" : "intermedio")
  };
}

// --------------------------------------------------------------------------
// 4. CÁLCULO DE CRÉDITOS Y MÉTRICAS
// --------------------------------------------------------------------------
function obtenerCreditosPurosKardex() {
  let creditos = 0;
  if (typeof PLAN_ESTUDIOS_ICOM_2021 === "undefined") return 0;

  PLAN_ESTUDIOS_ICOM_2021.forEach(sem => {
    sem.materias.forEach(mat => {
      if (mat.esCasillaDual || mat.clave === "FI" || mat.clave === "PP") return;

      let clave = mat.clave;
      let cred = Number(mat.creditos || 0);

      if (/^UA\d_\d$/.test(clave)) {
        const sust = resolverMateriaUA(clave);
        if (sust) { clave = sust.clave; cred = Number(sust.creditos || 0); }
      }

      const info = consultarEstadoMateria(clave);
      if (info && info.aprobada) creditos += cred;
    });
  });
  return creditos;
}

function actualizarMetricas() {
  let totalMateriasPlan = 0;
  let aprobadas = 0;
  let enCurso = 0;
  let sumaCalificaciones = 0;
  let materiasConCalificacion = 0;

  if (typeof PLAN_ESTUDIOS_ICOM_2021 !== "undefined") {
    PLAN_ESTUDIOS_ICOM_2021.forEach(sem => {
      sem.materias.forEach(mat => {
        if (mat.esCasillaDual) return;

        const esRequisito = REQUISITOS_EGRESO.includes(mat.clave);
        let claveConsulta = mat.clave;
        if (/^UA\d_\d$/.test(mat.clave)) {
          const sustituto = resolverMateriaUA(mat.clave);
          claveConsulta = sustituto ? sustituto.clave : mat.clave;
        }

        const info = consultarEstadoMateria(claveConsulta);
        if (!esRequisito) totalMateriasPlan++;

        if (info) {
          if (info.aprobada) {
            aprobadas++;
            if (!esRequisito && typeof info.calificacion === "number" && info.calificacion > 0) {
              sumaCalificaciones += info.calificacion;
              materiasConCalificacion++;
            }
          } else if (info.enCurso) {
            enCurso++;
          }
        }
      });
    });
  }

  const pendientes = Math.max(0, totalMateriasPlan - (aprobadas + enCurso));
  const promedioGeneral = materiasConCalificacion > 0 ? (sumaCalificaciones / materiasConCalificacion) : 0;

  const elAprobadas = document.getElementById("total-aprobadas");
  const elEnCurso = document.getElementById("total-en-curso");
  const elPendientes = document.getElementById("materias-pendientes");
  const elPromedio = document.getElementById("promedio-general");

  if (elAprobadas) elAprobadas.innerText = aprobadas;
  if (elEnCurso) elEnCurso.innerText = enCurso;
  if (elPromedio) elPromedio.innerText = promedioGeneral > 0 ? promedioGeneral.toFixed(2) : "—";
  if (elPendientes) elPendientes.innerText = pendientes;

  renderizarGraficaPromedio();
}

function sincronizarContadoresVisuales() {
  const base = obtenerCreditosPurosKardex();
  const extra = (window.creditosExtraRequisitos.fi || 0) + (window.creditosExtraRequisitos.pp || 0);
  const total = base + extra;
  const totalReq = typeof CREDITOS_TOTALES_REQUERIDOS !== "undefined" ? CREDITOS_TOTALES_REQUERIDOS : 394;
  const faltantes = Math.max(0, totalReq - total);
  const pctReal = ((total / totalReq) * 100).toFixed(2);
  const pctBanner = Math.min(100, Math.round((total / totalReq) * 100));

  const elCredBanner = document.getElementById("total-creditos");
  const elPctBanner = document.getElementById("porcentaje-avance");
  if (elCredBanner) elCredBanner.innerText = `${total} / ${totalReq} C`;
  if (elPctBanner) elPctBanner.innerText = `${pctBanner}%`;

  const elPctCard = document.getElementById("porcentajeTexto");
  const elObtCard = document.getElementById("creditosObtenidos");
  const elFaltCard = document.getElementById("creditosFaltantes");
  if (elPctCard) elPctCard.innerText = `${pctReal}%`;
  if (elObtCard) elObtCard.innerText = total;
  if (elFaltCard) elFaltCard.innerText = faltantes;

  const btnVerClases = document.getElementById("btn-ver-clases");
  if (btnVerClases) {
    if (window.horarioClasesSemanal && window.horarioClasesSemanal.length > 0) {
      btnVerClases.classList.remove("hidden");
    } else {
      btnVerClases.classList.add("hidden");
    }
  }

  renderizarGraficaAvance(total);
  renderizarGraficaSemestres();
  renderizarGraficaAreasFormacion();
  renderizarGraficaAvanceCiclos();
  actualizarSimuladorHorario();

  guardarDatosSesionUsuario();
}

function actualizarTodo() {
  actualizarMetricas();
  sincronizarContadoresVisuales();
}
window.actualizarTodo = actualizarTodo;
window.actualizarMetricas = actualizarMetricas;
window.sincronizarContadoresVisuales = sincronizarContadoresVisuales;

// --------------------------------------------------------------------------
// 5. LIMPIEZA DE ARCHIVOS
// --------------------------------------------------------------------------
function quitarKardex() {
  Object.keys(window.estadoMaterias).forEach(clave => {
    if (window.estadoMaterias[clave]) {
      window.estadoMaterias[clave].aprobada = false;
      window.estadoMaterias[clave].calificacion = null;
      window.estadoMaterias[clave].creditos = 0;
    }
  });

  const inputKardex = document.getElementById("input-kardex");
  if (inputKardex) inputKardex.value = "";

  const textoKardex = document.getElementById("texto-kardex");
  if (textoKardex) textoKardex.innerText = "Sin archivo";

  const btnQuitarKardex = document.getElementById("btn-quitar-kardex");
  if (btnQuitarKardex) btnQuitarKardex.classList.add("hidden");

  datosKardexEstudiante = {
    situacion: "Sin archivo",
    admision: "Sin archivo",
    ultimoCiclo: "Sin archivo"
  };
  promediosHistoricos.valores = promediosHistoricos.ciclos.map(() => null);
  promediosHistoricos.promedioGeneral = "—";

  window.promediosCiclosCreditos.porCiclo = window.promediosCiclosCreditos.ciclos.map(() => 0);
  window.promediosCiclosCreditos.acumulados = window.promediosCiclosCreditos.ciclos.map(() => 0);
  window.creditosExtraRequisitos = { fi: 0, pp: 0 };

  const checkboxes = ["check-fi", "check-ss", "check-pp", "check-egel", "check-pm", "check-ingles"];
  checkboxes.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.checked = false;
  });

  guardarEstadoChecklist();
  actualizarTextosPerfilUI();
  actualizarTodo();
}
window.quitarKardex = quitarKardex;

function quitarHorario() {
  Object.keys(window.estadoMaterias).forEach(clave => {
    if (window.estadoMaterias[clave]) {
      window.estadoMaterias[clave].enCurso = false;
    }
  });

  window.horarioClasesSemanal = [];

  const inputHorario = document.getElementById("input-horario");
  if (inputHorario) inputHorario.value = "";

  const textoHorario = document.getElementById("texto-horario");
  if (textoHorario) textoHorario.innerText = "Sin archivo";

  const btnQuitarHorario = document.getElementById("btn-quitar-horario");
  if (btnQuitarHorario) btnQuitarHorario.classList.add("hidden");

  const btnVerClases = document.getElementById("btn-ver-clases");
  if (btnVerClases) btnVerClases.classList.add("hidden");

  actualizarTodo();
  actualizarEstadoHorarioHoy();
}
window.quitarHorario = quitarHorario;

// --------------------------------------------------------------------------
// 6. PARSER DE KÁRDEX UdeG
// --------------------------------------------------------------------------
const KardexParser = {
  normalizarClave(clave) {
    if (!clave) return null;
    let c = clave.replace(/[^A-Z0-9]/gi, '').trim().toUpperCase();
    if (/^1\d{4}$/.test(c)) c = 'I' + c.substring(1);
    return c;
  },

  extraerClave(texto) {
    if (!texto) return null;
    const match = texto.match(/(?:^|[\s|])([A-Z]{1,4}\d{3,5}|1\d{4})(?:[\s|]|$)/i);
    return match ? this.normalizarClave(match[1]) : null;
  },

  extraerIntentoLinea(linea) {
    const t = linea.toUpperCase();
    if (t.includes('SD') || t.includes('SIN DERECHO')) {
      return { nota: 0, aprobada: false, creditos: 0 };
    }

    const matchCalificacion = t.match(
      /\b(\d{2,3})\s*\(?\s*(CIEN|NOVENTA|OCHENTA|OCHENT[A-Z]+|SETENTA|SESENTA|CINCUENTA|CUARENTA|TREINTA|VEINTE|DIECINUEVE|DIECIOCHO|DIECISIETE|DIECISEIS|QUINCE|CATORCE|TRECE|DOCE|ONCE|DIEZ)\b/
    );

    if (matchCalificacion) {
      let notaNum = parseInt(matchCalificacion[1], 10);
      if (notaNum > 100 && notaNum.toString().startsWith("1")) {
        notaNum = parseInt(notaNum.toString().substring(1), 10);
      }
      const aprobada = notaNum >= 60 && notaNum <= 100;
      const matchNC = t.match(/(?:ORDINARIO|EXTRAORDINARIO)\s*\(?[A-Z]{1,3}\)?\s+(\d{1,2})\s+\d{2,3}/);
      const creditos = matchNC ? parseInt(matchNC[1], 10) : 0;
      return { nota: notaNum, aprobada, creditos };
    }

    if (t.includes('ACREDITADO') || t.includes('APROBADO')) {
      return { nota: 100, aprobada: true, creditos: 0 };
    }
    return null;
  },

  evaluarBloqueIntentos(lineasBloque) {
    let mejor = { nota: 0, aprobada: false, creditos: 0 };
    for (const linea of lineasBloque) {
      const intento = this.extraerIntentoLinea(linea);
      if (!intento) continue;
      if (intento.aprobada && (!mejor.aprobada || intento.nota > mejor.nota)) {
        mejor = intento;
      } else if (!mejor.aprobada && !intento.aprobada && intento.nota > mejor.nota) {
        mejor = intento;
      }
    }
    return mejor;
  },

  async procesarPDF(archivo) {
    const lib = window.pdfjsLib || window['pdfjs-dist/build/pdf'];
    if (!lib) throw new Error("PDF.js no disponible.");

    const arrayBuffer = await archivo.arrayBuffer();
    const pdf = await lib.getDocument({ data: arrayBuffer }).promise;
    const items = [];

    for (let pagina = 1; pagina <= pdf.numPages; pagina++) {
      const paginaObj = await pdf.getPage(pagina);
      const contenido = await paginaObj.getTextContent();
      contenido.items.forEach(item => {
        if (!item.str.trim()) return;
        items.push({
          pagina: pagina,
          x: item.transform[4],
          y: item.transform[5],
          str: item.str.trim()
        });
      });
    }

    const TOLERANCIA_Y = 4;
    items.sort((a, b) => {
      if (a.pagina !== b.pagina) return a.pagina - b.pagina;
      if (Math.abs(a.y - b.y) > TOLERANCIA_Y) return b.y - a.y;
      return a.x - b.x;
    });

    const lineas = [];
    let filaActual = [];
    let yActual = null;
    let paginaActual = null;

    for (const it of items) {
      const nuevaFila = yActual === null || it.pagina !== paginaActual || Math.abs(it.y - yActual) > TOLERANCIA_Y;
      if (nuevaFila) {
        if (filaActual.length) lineas.push(filaActual.map(x => x.str).join(' '));
        filaActual = [it];
      } else {
        filaActual.push(it);
      }
      yActual = it.y;
      paginaActual = it.pagina;
    }
    if (filaActual.length) lineas.push(filaActual.map(x => x.str).join(' '));

    const mapaResultados = {};
    for (let i = 0; i < lineas.length; i++) {
      const clave = this.extraerClave(lineas[i]);
      if (!clave) continue;

      const lineasBloque = [];
      for (let j = i; j < Math.min(i + 6, lineas.length); j++) {
        if (j > i && this.extraerClave(lineas[j])) break;
        lineasBloque.push(lineas[j]);
      }

      const datosNota = this.evaluarBloqueIntentos(lineasBloque);
      const existente = mapaResultados[clave];

      if (!existente || (!existente.aprobada && datosNota.aprobada) || (existente.aprobada && datosNota.aprobada && datosNota.nota > existente.nota)) {
        mapaResultados[clave] = {
          clave: clave,
          nota: datosNota.nota,
          aprobada: datosNota.aprobada,
          creditos: datosNota.creditos
        };
      }
    }
    return mapaResultados;
  },

  async cargarEnEstado(archivo) {
    const materiasParsed = await this.procesarPDF(archivo);
    Object.keys(materiasParsed).forEach(clave => {
      const datos = materiasParsed[clave];
      if (!window.estadoMaterias[clave]) {
        window.estadoMaterias[clave] = { aprobada: false, calificacion: 0, creditos: 0, enCurso: false };
      }
      if (datos.aprobada) {
        window.estadoMaterias[clave].aprobada = true;
        window.estadoMaterias[clave].calificacion = datos.nota;
        window.estadoMaterias[clave].creditos = datos.creditos;
        window.estadoMaterias[clave].enCurso = false;
      }
    });

    actualizarTodo();
    window.dispatchEvent(new CustomEvent('kardexProcesado', { detail: window.estadoMaterias }));
  }
};
window.KardexParser = KardexParser;

window.procesarKardexDirecto = async function(inputElement) {
  const archivo = inputElement.files[0];
  if (!archivo) return;

  const labelTexto = document.getElementById("texto-kardex");
  if (labelTexto) labelTexto.innerText = archivo.name;

  try {
    await KardexParser.cargarEnEstado(archivo);
    await procesarMetadatosYPromediosKardex(archivo);
    await procesarAvanceCiclosKardex(archivo);

    const btnQuitarKardex = document.getElementById("btn-quitar-kardex");
    if (btnQuitarKardex) btnQuitarKardex.classList.remove("hidden");

    guardarDatosSesionUsuario();
  } catch (err) {
    console.error("❌ Error al procesar Kárdex:", err);
    alert("Hubo un error al procesar el archivo Kárdex.");
  }
};

function extraerNotaNumericaIntento(textoLinea) {
  const t = textoLinea.toUpperCase();
  if (t.includes('SD') || t.includes('SIN DERECHO')) return 0;

  const matchLetras = t.match(/\b(\d{2,3})\s*(?:\(?\s*(?:CIEN|NOVENTA|OCHENTA|OCHENT[A-Z]+|SETENTA|SESENTA|CINCUENTA|CUARENTA|TREINTA|VEINTE|DIECINUEVE|DIECIOCHO|DIECISIETE|DIECISEIS|QUINCE|CATORCE|TRECE|DOCE|ONCE|DIEZ)\b)/);
  if (matchLetras) {
    let nota = parseInt(matchLetras[1], 10);
    if (nota > 100 && nota.toString().startsWith("1")) {
      nota = parseInt(nota.toString().substring(1), 10);
    }
    return nota;
  }

  const matchDirecto = t.match(/\b(100|[6-9]\d)\b(?=.*(?:ORDINARIO|EXTRAORDINARIO))/);
  if (matchDirecto) return parseInt(matchDirecto[1], 10);

  return 0;
}

async function procesarMetadatosYPromediosKardex(file) {
  if (!file) return;
  try {
    const arrayBuffer = await file.arrayBuffer();
    const lib = window.pdfjsLib || window['pdfjs-dist/build/pdf'];
    if (!lib) return;

    const pdf = await lib.getDocument({ data: arrayBuffer }).promise;
    const items = [];
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const content = await page.getTextContent();
      content.items.forEach(it => {
        const str = it.str.trim();
        if (str) {
          items.push({ pagina: p, x: it.transform[4], y: it.transform[5], str: str });
        }
      });
    }

    const TOLERANCIA_Y = 3.5;
    items.sort((a, b) => {
      if (a.pagina !== b.pagina) return a.pagina - b.pagina;
      if (Math.abs(a.y - b.y) > TOLERANCIA_Y) return b.y - a.y;
      return a.x - b.x;
    });

    const lineas = [];
    let filaActual = [];
    let yActual = null;
    let paginaActual = null;

    for (const it of items) {
      const nuevaFila = yActual === null || it.pagina !== paginaActual || Math.abs(it.y - yActual) > TOLERANCIA_Y;
      if (nuevaFila) {
        if (filaActual.length) lineas.push(filaActual.map(x => x.str).join(' '));
        filaActual = [it];
      } else {
        filaActual.push(it);
      }
      yActual = it.y;
      paginaActual = it.pagina;
    }
    if (filaActual.length) lineas.push(filaActual.map(x => x.str).join(' '));

    const textoCompleto = lineas.join('\n');

    if (/ALUMNO EN ART\s*\d+/i.test(textoCompleto)) {
      const match = textoCompleto.match(/ALUMNO EN ART\s*\d+/i);
      datosKardexEstudiante.situacion = match[0].toUpperCase();
    } else if (/\bACTIVO\b/i.test(textoCompleto)) {
      datosKardexEstudiante.situacion = "ACTIVO";
    } else if (/\bREGULAR\b/i.test(textoCompleto)) {
      datosKardexEstudiante.situacion = "REGULAR";
    }

    const matchAdm = textoCompleto.match(/Admisi[oó]n:?[\s\r\n]*(\b20\d{2}-?[A-Z]\b)/i);
    if (matchAdm && matchAdm[1]) {
      datosKardexEstudiante.admision = matchAdm[1].toUpperCase().replace('-', '');
    }

    let ultimoCicloDetectado = null;

    const matchUltDirecto = textoCompleto.match(/[Uu]ltimo\s*Ciclo:?[\s\r\n]*(\b20\d{2}-?[A-Z]\b)/i);
    if (matchUltDirecto && matchUltDirecto[1]) {
      ultimoCicloDetectado = matchUltDirecto[1].toUpperCase().replace('-', '');
    }

    if (!ultimoCicloDetectado) {
      for (let idx = 0; idx < lineas.length; idx++) {
        if (/[Uu]ltimo\s*Ciclo/i.test(lineas[idx])) {
          const ventana = lineas.slice(idx, Math.min(idx + 7, lineas.length)).join(' ');
          const matchVentana = ventana.match(/\b(20\d{2}-?[A-Z])\b/i);
          if (matchVentana && matchVentana[1]) {
            ultimoCicloDetectado = matchVentana[1].toUpperCase().replace('-', '');
            break;
          }
        }
      }
    }

    if (!ultimoCicloDetectado) {
      const ciclosEnKardex = [...textoCompleto.matchAll(/CALENDARIO\s+(\d{4}-[AB])/gi)];
      if (ciclosEnKardex.length > 0) {
        const ultimoBloque = ciclosEnKardex[ciclosEnKardex.length - 1][1];
        ultimoCicloDetectado = ultimoBloque.toUpperCase().replace('-', '');
      }
    }

    if (ultimoCicloDetectado) {
      datosKardexEstudiante.ultimoCiclo = ultimoCicloDetectado;
    }

    actualizarTextosPerfilUI();

    promediosHistoricos.promedioGeneral = "—";
    const matchPromGral = textoCompleto.match(/Promedio\s*:?[\s\r\n]*(\d{2,3}(?:\.\d{1,2})?)/i);
    if (matchPromGral && matchPromGral[1]) {
      promediosHistoricos.promedioGeneral = parseFloat(matchPromGral[1]).toFixed(2);
    }

    let cicloActual = null;
    const materiasAprobadasPorCiclo = {};

    for (let i = 0; i < lineas.length; i++) {
      const linea = lineas[i];
      const matchHeaderCiclo = linea.match(/CALENDARIO\s+(\d{4}-[AB])/i);
      if (matchHeaderCiclo) {
        cicloActual = matchHeaderCiclo[1].toUpperCase();
        if (!materiasAprobadasPorCiclo[cicloActual]) materiasAprobadasPorCiclo[cicloActual] = {};
        continue;
      }
      if (!cicloActual) continue;

      const matchClave = linea.match(/(?:^|[\s|])([A-Z]{1,4}\d{3,5}|1\d{4})(?:[\s|]|$)/i);
      if (matchClave) {
        let clave = matchClave[1].toUpperCase();
        if (/^1\d{4}$/.test(clave)) clave = 'I' + clave.substring(1);

        const lineasMateria = [];
        for (let j = i; j < Math.min(i + 6, lineas.length); j++) {
          if (j > i && lineas[j].match(/(?:^|[\s|])([A-Z]{1,4}\d{3,5}|1\d{4})(?:[\s|]|$)/i)) break;
          lineasMateria.push(lineas[j]);
        }

        let mejorNotaAprobatoria = null;
        lineasMateria.forEach(lm => {
          const nota = extraerNotaNumericaIntento(lm);
          if (nota >= 60 && nota <= 100) {
            if (mejorNotaAprobatoria === null || nota > mejorNotaAprobatoria) {
              mejorNotaAprobatoria = nota;
            }
          }
        });

        if (mejorNotaAprobatoria !== null) {
          materiasAprobadasPorCiclo[cicloActual][clave] = mejorNotaAprobatoria;
        }
      }
    }

    promediosHistoricos.valores = promediosHistoricos.ciclos.map(ciclo => {
      const mats = materiasAprobadasPorCiclo[ciclo];
      if (mats) {
        const notasAprobadas = Object.values(mats);
        if (notasAprobadas.length > 0) {
          const suma = notasAprobadas.reduce((a, b) => a + b, 0);
          return parseFloat((suma / notasAprobadas.length).toFixed(2));
        }
      }
      return null;
    });

    renderizarGraficaPromedio();
  } catch (e) {
    console.error("Error al procesar metadatos del Kárdex:", e);
  }
}
window.procesarMetadatosYPromediosKardex = procesarMetadatosYPromediosKardex;

async function procesarAvanceCiclosKardex(file) {
  if (!file) return;
  try {
    const arrayBuffer = await file.arrayBuffer();
    const lib = window.pdfjsLib || window['pdfjs-dist/build/pdf'];
    if (!lib) return;

    const pdf = await lib.getDocument({ data: arrayBuffer }).promise;
    const items = [];

    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const content = await page.getTextContent();
      content.items.forEach(it => {
        const str = it.str.trim();
        if (str) items.push({ pagina: p, x: it.transform[4], y: it.transform[5], str: str });
      });
    }

    const TOLERANCIA_Y = 4;
    items.sort((a, b) => {
      if (a.pagina !== b.pagina) return a.pagina - b.pagina;
      if (Math.abs(a.y - b.y) > TOLERANCIA_Y) return b.y - a.y;
      return a.x - b.x;
    });

    const lineas = [];
    let filaActual = [];
    let yActual = null;
    let paginaActual = null;

    for (const it of items) {
      const nuevaFila = yActual === null || it.pagina !== paginaActual || Math.abs(it.y - yActual) > TOLERANCIA_Y;
      if (nuevaFila) {
        if (filaActual.length) lineas.push(filaActual.map(x => x.str).join(' '));
        filaActual = [it];
      } else {
        filaActual.push(it);
      }
      yActual = it.y;
      paginaActual = it.pagina;
    }
    if (filaActual.length) lineas.push(filaActual.map(x => x.str).join(' '));

    let cicloActual = null;
    const creditosPorCicloMap = {};
    window.promediosCiclosCreditos.ciclos.forEach(c => { creditosPorCicloMap[c] = {}; });

    for (let i = 0; i < lineas.length; i++) {
      const linea = lineas[i];
      const matchCiclo = linea.match(/CALENDARIO\s+(\d{4}-[AB])/i);
      if (matchCiclo) {
        cicloActual = matchCiclo[1].toUpperCase();
        if (!creditosPorCicloMap[cicloActual]) creditosPorCicloMap[cicloActual] = {};
        continue;
      }
      if (!cicloActual) continue;

      const matchClave = linea.match(/(?:^|[\s|])([A-Z]{1,4}\d{3,5}|1\d{4})(?:[\s|]|$)/i);
      if (matchClave) {
        let clave = matchClave[1].toUpperCase();
        if (/^1\d{4}$/.test(clave)) clave = 'I' + clave.substring(1);

        for (let j = i; j < Math.min(i + 8, lineas.length); j++) {
          const l = lineas[j].toUpperCase();
          if (j > i && lineas[j].match(/(?:^|[\s|])([A-Z]{1,4}\d{3,5}|1\d{4})(?:[\s|]|$)/i)) break;

          const matchCal = l.match(/\b(\d{2,3})\s*(?:\(?\s*(?:CIEN|NOVENTA|OCHENTA|OCHENT[A-Z]+|SETENTA|SESENTA|CINCUENTA|CUARENTA|TREINTA|VEINTE|DIECINUEVE|DIECIOCHO|DIECISIETE|DIECISEIS|QUINCE|CATORCE|TRECE|DOCE|ONCE|DIEZ)\b)/);
          if (matchCal) {
            let nota = parseInt(matchCal[1], 10);
            if (nota > 100 && nota.toString().startsWith("1")) nota = parseInt(nota.toString().substring(1), 10);

            if (nota >= 60 && nota <= 100) {
              const matchNC = l.match(/(?:ORDINARIO|EXTRAORDINARIO)\s*\(?[A-Z]{1,3}\)?\s+(\d{1,2})\s+\d{2,3}/);
              let creditos = matchNC ? parseInt(matchNC[1], 10) : 0;

              if (creditos === 0 && typeof PLAN_ESTUDIOS_ICOM_2021 !== "undefined") {
                PLAN_ESTUDIOS_ICOM_2021.forEach(s => {
                  const m = s.materias.find(mat => mat.clave === clave || mat.clave === ('1' + clave.substring(1)));
                  if (m) creditos = m.creditos || 0;
                });
              }

              if (creditos > 0) creditosPorCicloMap[cicloActual][clave] = creditos;
            }
          }
        }
      }
    }

    let sumaProg = 0;
    window.promediosCiclosCreditos.porCiclo = window.promediosCiclosCreditos.ciclos.map(ciclo => {
      const mats = creditosPorCicloMap[ciclo];
      return mats ? Object.values(mats).reduce((acc, c) => acc + c, 0) : 0;
    });

    window.promediosCiclosCreditos.acumulados = window.promediosCiclosCreditos.porCiclo.map(c => {
      sumaProg += c;
      return sumaProg;
    });

    renderizarGraficaAvanceCiclos();
  } catch (err) {
    console.error("Error al procesar avance por ciclo:", err);
  }
}
window.procesarAvanceCiclosKardex = procesarAvanceCiclosKardex;

// --------------------------------------------------------------------------
// 7. PARSER DE HORARIO UdeG (Extracción completa de NRC, Profesor, Sec, Fechas)
// --------------------------------------------------------------------------
async function parsearHorarioPDFConEstructura(file) {
  const lib = window.pdfjsLib || window['pdfjs-dist/build/pdf'];
  if (!lib) throw new Error("PDF.js no disponible.");

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await lib.getDocument({ data: arrayBuffer }).promise;
  
  let items = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    content.items.forEach(it => {
      const str = it.str.trim();
      if (str) {
        items.push({
          pagina: i,
          x: Math.round(it.transform[4]),
          y: Math.round(it.transform[5]),
          str: str
        });
      }
    });
  }

  const TOLERANCIA_Y = 4.5;
  items.sort((a, b) => {
    if (a.pagina !== b.pagina) return a.pagina - b.pagina;
    if (Math.abs(a.y - b.y) > TOLERANCIA_Y) return b.y - a.y;
    return a.x - b.x;
  });

  const lineas = [];
  let filaActual = [];
  let yActual = null;
  let paginaActual = null;

  for (const it of items) {
    const nuevaFila = yActual === null || it.pagina !== paginaActual || Math.abs(it.y - yActual) > TOLERANCIA_Y;
    if (nuevaFila) {
      if (filaActual.length) lineas.push({ texto: filaActual.map(x => x.str).join(' '), items: filaActual, y: yActual });
      filaActual = [it];
    } else {
      filaActual.push(it);
    }
    yActual = it.y;
    paginaActual = it.pagina;
  }
  if (filaActual.length) lineas.push({ texto: filaActual.map(x => x.str).join(' '), items: filaActual, y: yActual });

  Object.keys(window.estadoMaterias).forEach(clave => {
    if (window.estadoMaterias[clave]) {
      window.estadoMaterias[clave].enCurso = false;
    }
  });

  window.horarioClasesSemanal = [];
  const materiasDetectadasEnCurso = new Set();

  function normalizarClaveUDG(c) {
    if (!c) return "";
    let limpia = c.toUpperCase().trim();
    if (/^1\d{4}$/.test(limpia)) limpia = "I" + limpia.substring(1);
    return limpia;
  }

  for (let i = 0; i < lineas.length; i++) {
    const l = lineas[i];
    const matchNRC = l.texto.match(/\b(\d{6})\b/);
    if (!matchNRC) continue;

    const bloque = [l];
    for (let k = 1; k <= 3; k++) {
      if (i + k < lineas.length) {
        const sig = lineas[i + k];
        if (sig.texto.match(/\b\d{6}\b/) || sig.texto.toUpperCase().includes("TOTAL DE CRÉDITOS")) break;
        bloque.push(sig);
      }
    }

    const textoBloque = bloque.map(b => b.texto).join(" ");
    const itemsBloque = bloque.flatMap(b => b.items);

    const nrc = matchNRC[1];

    let claveMateria = null;
    const matchClave = textoBloque.match(/\b([A-Z]{1,4}\d{3,5}|1\d{4})\b/i);

    for (const it of itemsBloque) {
      const c = normalizarClaveUDG(it.str);
      if (MAPA_PLAN_ESTUDIOS[c]) {
        claveMateria = c;
        break;
      }
    }

    if (!claveMateria && matchClave) {
      const cNorm = normalizarClaveUDG(matchClave[1]);
      if (MAPA_PLAN_ESTUDIOS[cNorm]) claveMateria = cNorm;
    }

    if (!claveMateria) continue;

    const matchHorario = textoBloque.match(/(\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2})/);
    const horario = matchHorario ? matchHorario[1].replace(/\s+/g, "") : "HORARIO N/D";

    let edificio = "CUCEI";
    let aula = "AULA";

    for (const it of itemsBloque) {
      const val = it.str.toUpperCase().trim();
      if (/^(DUCT\d*|DED[A-Z0-9]*|BETA|ALFA)/i.test(val)) edificio = val;
      if (/^(LC\d+|A\d+|B\d+|C\d+|D\d+)/i.test(val)) aula = val;
    }

    let seccion = "—";
    const matchSec = textoBloque.match(/\b(D\d{2})\b/);
    if (matchSec) seccion = matchSec[1];

    let creditos = 0;
    const matchCR = textoBloque.match(/\b(?:D\d{2})\s+(\d{1,2})\b/);
    if (matchCR) creditos = parseInt(matchCR[1], 10);

    const matchFechas = textoBloque.match(/(\d{2}-\d{2}-\d{4})\s+(\d{2}-\d{2}-\d{4})/);
    let fechaInicio = matchFechas ? matchFechas[1] : "17-08-2026";
    let fechaFin = matchFechas ? matchFechas[2] : "11-12-2026";

    let profesor = "N/A";
    const matchProf = textoBloque.match(/\d{2}-\d{2}-\d{4}\s+\d{2}-\d{2}-\d{4}\s+([A-ZÁÉÍÓÚÑ\s]+)$/i);
    if (matchProf && matchProf[1]) {
      profesor = matchProf[1].trim();
    } else {
      for (let bi = bloque.length - 1; bi >= 0; bi--) {
        const txtLin = bloque[bi].texto.trim();
        if (/^[A-ZÁÉÍÓÚÑ\s]{6,}$/i.test(txtLin) && !txtLin.includes("CUCEI") && !txtLin.includes("HORARIO")) {
          profesor = txtLin;
          break;
        }
      }
    }

    const diasFila = [];
    itemsBloque.forEach(it => {
      const token = it.str.trim().toUpperCase();
      if (token === "L") diasFila.push("LU");
      else if (token === "M") diasFila.push("MA");
      else if (token === "I" || token === "1") diasFila.push("MI");
      else if (token === "J") diasFila.push("JU");
      else if (token === "V") diasFila.push("VI");
      else if (token === "S") diasFila.push("SA");
      else if (token === "D") diasFila.push("DO");
    });

    const diasFiltrados = [...new Set(diasFila)].filter(d => {
      return !textoBloque.includes("LM1JVSD") && !textoBloque.includes("L M 1 J V S D");
    });

    if (diasFiltrados.length === 0) {
      if (/\bL\b/i.test(textoBloque) && /\b(I|1)\b/.test(textoBloque)) diasFiltrados.push("LU", "MI");
      else if (/\bM\b/i.test(textoBloque) && /\bJ\b/i.test(textoBloque)) diasFiltrados.push("MA", "JU");
      else if (/\bV\b/i.test(textoBloque)) diasFiltrados.push("VI");
      else if (/\bS\b/i.test(textoBloque)) diasFiltrados.push("SA");
      else if (/\bL\b/i.test(textoBloque)) diasFiltrados.push("LU");
    }

    materiasDetectadasEnCurso.add(claveMateria);
    if (!window.estadoMaterias[claveMateria]) {
      window.estadoMaterias[claveMateria] = { aprobada: false, calificacion: null, creditos: creditos, enCurso: true };
    } else {
      window.estadoMaterias[claveMateria].enCurso = true;
    }

    const nombreMateria = MAPA_PLAN_ESTUDIOS[claveMateria] || "MATERIA";

    diasFiltrados.forEach(diaKey => {
      const yaRegistrada = window.horarioClasesSemanal.some(
        c => c.dia === diaKey && c.clave === claveMateria && c.horario === horario
      );
      if (!yaRegistrada) {
        window.horarioClasesSemanal.push({
          dia: diaKey,
          clave: claveMateria,
          nombre: nombreMateria,
          edificio: edificio,
          aula: aula,
          horario: horario,
          nrc: nrc,
          seccion: seccion,
          creditos: creditos,
          fechaInicio: fechaInicio,
          fechaFin: fechaFin,
          profesor: profesor
        });
      }
    });
  }

  Object.keys(window.estadoMaterias).forEach(clave => {
    if (!materiasDetectadasEnCurso.has(clave)) {
      window.estadoMaterias[clave].enCurso = false;
    }
  });

  actualizarTodo();
  actualizarEstadoHorarioHoy();
  guardarDatosSesionUsuario();

  const btnClases = document.getElementById("btn-ver-clases");
  if (btnClases) btnClases.classList.remove("hidden");
}
window.parsearHorarioPDFConEstructura = parsearHorarioPDFConEstructura;

function abrirModalHorario() {
  const modal = document.getElementById("modal-horario");
  if (!modal) return;
  renderizarHorarioSemanal();
  modal.classList.remove("hidden");
}
window.abrirModalHorario = abrirModalHorario;

function cerrarModalHorario() {
  const modal = document.getElementById("modal-horario");
  if (modal) modal.classList.add("hidden");
}
window.cerrarModalHorario = cerrarModalHorario;

function renderizarHorarioSemanal() {
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

    const clasesDelDia = window.horarioClasesSemanal.filter(c => c.dia === d.key);
    totalClasesSemana += clasesDelDia.length;

    if (clasesDelDia.length === 0) {
      const vacio = document.createElement("div");
      vacio.className = "text-[10px] text-slate-500 text-center py-6 italic font-medium";
      vacio.innerText = "Libre";
      col.appendChild(vacio);
    } else {
      clasesDelDia.forEach(clase => {
        const claveMostrar = (clase.clave && clase.clave !== "CUCEI" && clase.clave !== "MATERIA") 
          ? clase.clave 
          : (clase.nombre.split(" ")[0] || "MATERIA");

        let nombreLimpio = MAPA_PLAN_ESTUDIOS[clase.clave] || clase.nombre || "MATERIA DESCONOCIDA";

        nombreLimpio = nombreLimpio
          .replace(/\b(?:IL|I|CB)\d{3,4}\b/gi, "")
          .replace(/\s+/g, " ")
          .trim();

        if (clase.clave) {
          const claveEscapada = clase.clave.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const regexClave = new RegExp(`\\b${claveEscapada}\\b`, "gi");
          nombreLimpio = nombreLimpio.replace(regexClave, "").replace(/\s+/g, " ").trim();
        }

        const card = document.createElement("div");
        card.className = "bg-white border border-sky-300 rounded-lg p-2 text-left shadow-sm";
        card.innerHTML = `
          <div class="flex justify-between items-center">
            <span class="text-[9px] font-black text-sky-700">${claveMostrar}</span>
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
// 8. GRÁFICAS DEL DASHBOARD Y SIMULACIÓN
// --------------------------------------------------------------------------
function renderizarGraficaAvance(creditosObtenidos) {
  const canvas = document.getElementById('chartAvance');
  if (!canvas || typeof Chart === 'undefined') return;

  const totalRequeridos = typeof CREDITOS_TOTALES_REQUERIDOS !== 'undefined' ? CREDITOS_TOTALES_REQUERIDOS : 394;
  const creditosFaltantes = Math.max(0, totalRequeridos - creditosObtenidos);
  const porcentaje = ((creditosObtenidos / totalRequeridos) * 100).toFixed(2);

  const elPorcentaje = document.getElementById('porcentajeTexto');
  const elReq = document.getElementById('creditosRequeridos');
  const elObt = document.getElementById('creditosObtenidos');
  const elFalt = document.getElementById('creditosFaltantes');

  if (elPorcentaje) elPorcentaje.innerText = `${porcentaje}%`;
  if (elReq) elReq.innerText = totalRequeridos;
  if (elObt) elObt.innerText = creditosObtenidos;
  if (elFalt) elFalt.innerText = creditosFaltantes;

  const ctx = canvas.getContext('2d');
  if (chartAvanceInstance) chartAvanceInstance.destroy();

  chartAvanceInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Obtenidos', 'Faltantes'],
      datasets: [{
        data: [creditosObtenidos, creditosFaltantes],
        backgroundColor: ['#00A896', '#E9C46A'],
        borderWidth: 0,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '72%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 12,
            boxHeight: 12,
            usePointStyle: true,
            pointStyle: 'circle',
            font: { family: 'Poppins', size: 10 },
            color: '#64748b'
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) { return ` ${context.label}: ${context.raw} C`; }
          }
        }
      }
    }
  });
}

function renderizarGraficaPromedio() {
  const canvas = document.getElementById('chartPromedioCiclos');
  if (!canvas || typeof Chart === 'undefined') return;

  const elPromedioCard = document.getElementById('promedioCardTexto');
  const elPromedioHeader = document.getElementById('promedio-general');

  if ((!promediosHistoricos.promedioGeneral || promediosHistoricos.promedioGeneral === "—") && elPromedioHeader) {
    const valHeader = elPromedioHeader.innerText.trim();
    if (valHeader !== "—" && valHeader !== "") {
      promediosHistoricos.promedioGeneral = valHeader;
    }
  }

  if (elPromedioCard) {
    elPromedioCard.innerText = (promediosHistoricos.promedioGeneral && promediosHistoricos.promedioGeneral !== "") 
      ? promediosHistoricos.promedioGeneral 
      : "—";
  }

  const ctx = canvas.getContext('2d');
  if (chartPromedioInstance) chartPromedioInstance.destroy();

  const gradient = ctx.createLinearGradient(0, 0, 0, 180);
  gradient.addColorStop(0, 'rgba(233, 196, 106, 0.45)');
  gradient.addColorStop(1, 'rgba(233, 196, 106, 0.02)');

  chartPromedioInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: promediosHistoricos.ciclos,
      datasets: [{
        label: 'Promedio por ciclo',
        data: promediosHistoricos.valores,
        fill: true,
        spanGaps: true,
        backgroundColor: gradient,
        borderColor: '#e5b84c',
        borderWidth: 2.5,
        tension: 0.35,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: '#e5b84c',
        pointBorderWidth: 2,
        pointRadius: 4.5,
        pointHoverRadius: 6.5,
        pointHoverBackgroundColor: '#e5b84c'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      scales: {
        y: {
          suggestedMin: 50,
          max: 100,
          ticks: { stepSize: 10, font: { family: 'Poppins', size: 9 }, color: '#94a3b8' },
          grid: { color: 'rgba(226, 232, 240, 0.6)' }
        },
        x: {
          ticks: { font: { family: 'Poppins', size: 8.5 }, color: '#64748b' },
          grid: { display: false }
        }
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          align: 'center',
          labels: { boxWidth: 14, boxHeight: 8, font: { family: 'Poppins', size: 10 }, color: '#64748b' }
        },
        tooltip: {
          callbacks: {
            label: function(context) { 
              const val = context.raw;
              return ` Promedio: ${val !== null && val > 0 ? Number(val).toFixed(2) : 'Sin registro'}`; 
            }
          }
        }
      }
    }
  });
}

function renderizarGraficaSemestres() {
  const canvas = document.getElementById("chartCreditosSemestre");
  if (!canvas || typeof Chart === "undefined" || typeof PLAN_ESTUDIOS_ICOM_2021 === "undefined") return;

  const datosSem = PLAN_ESTUDIOS_ICOM_2021.map(sem => {
    let tot = 0, obt = 0;
    sem.materias.forEach(mat => {
      if (mat.esCasillaDual) return;
      let clave = mat.clave;
      let cred = Number(mat.creditos || 0);

      if (/^UA\d_\d$/.test(clave)) {
        const sust = resolverMateriaUA(clave);
        if (sust) { clave = sust.clave; cred = Number(sust.creditos || 0); }
      }

      if (mat.clave === "FI") {
        tot += 4;
        if (window.creditosExtraRequisitos.fi > 0) obt += 4;
        return;
      }
      if (mat.clave === "PP") {
        tot += 6;
        if (window.creditosExtraRequisitos.pp > 0) obt += 6;
        return;
      }

      tot += cred;
      const info = consultarEstadoMateria(clave);
      if (info && info.aprobada) obt += cred;
    });

    const p = tot > 0 ? Math.min(100, Math.round((obt / tot) * 100)) : 0;
    return { semestre: sem.semestre, obtenidos: obt, totales: tot, porcentaje: p };
  });

  const textoComp = document.getElementById("semestresCompletosTexto");
  if (textoComp) {
    const listos = datosSem.filter(d => d.porcentaje === 100).length;
    textoComp.innerText = `${listos} de ${datosSem.length} listos`;
  }

  const ctx = canvas.getContext("2d");
  if (window.chartCreditosSemestreInstance) window.chartCreditosSemestreInstance.destroy();

  window.chartCreditosSemestreInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: datosSem.map(d => `Sem ${d.semestre}`),
      datasets: [{
        label: "Avance del Semestre (%)",
        data: datosSem.map(d => d.porcentaje),
        backgroundColor: datosSem.map(d => (d.porcentaje === 100 ? "#00A896" : d.porcentaje > 0 ? "#E9C46A" : "#cbd5e1")),
        borderRadius: 6,
        barPercentage: 0.65,
        minBarLength: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      scales: {
        y: { min: 0, max: 100, ticks: { stepSize: 25, callback: v => `${v}%`, font: { size: 9 }, color: "#94a3b8" }, grid: { color: "rgba(226, 232, 240, 0.6)" } },
        x: { ticks: { font: { size: 8.5 }, color: "#64748b" }, grid: { display: false } }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctxTip => {
              const item = datosSem[ctxTip.dataIndex];
              return ` ${item.porcentaje}% (${item.obtenidos}/${item.totales} C)`;
            }
          }
        }
      }
    }
  });
}

function renderizarGraficaAvanceCiclos() {
  const canvas = document.getElementById("chartAvanceCiclos");
  if (!canvas || typeof Chart === "undefined") return;

  const ctx = canvas.getContext("2d");
  if (window.chartAvanceCiclosInstance) window.chartAvanceCiclosInstance.destroy();

  const gradient = ctx.createLinearGradient(0, 0, 0, 180);
  gradient.addColorStop(0, "rgba(0, 168, 150, 0.45)");
  gradient.addColorStop(1, "rgba(0, 168, 150, 0.02)");

  const ultimoConCreditos = [...window.promediosCiclosCreditos.porCiclo].reverse().find(c => c > 0) || 0;
  const textoSub = document.getElementById("textoAvanceCiclos");
  if (textoSub) {
    textoSub.innerText = `${ultimoConCreditos} C obtenidos en último ciclo escolar activo`;
  }

  window.chartAvanceCiclosInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: window.promediosCiclosCreditos.ciclos,
      datasets: [{
        label: "Créditos Acumulados",
        data: window.promediosCiclosCreditos.acumulados,
        fill: true,
        backgroundColor: gradient,
        borderColor: "#00A896",
        borderWidth: 2.5,
        tension: 0.35,
        pointBackgroundColor: "#ffffff",
        pointBorderColor: "#00A896",
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true, suggestedMax: 394, ticks: { stepSize: 50, callback: v => `${v} C`, font: { size: 9 } } },
        x: { ticks: { font: { size: 8.5 } }, grid: { display: false } }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: context => {
              const idx = context.dataIndex;
              const ganados = window.promediosCiclosCreditos.porCiclo[idx];
              return ` Acumulado: ${context.raw} C (+${ganados} C en este ciclo escolar)`;
            }
          }
        }
      }
    }
  });
}

function renderizarGraficaAreasFormacion() {
  const canvas = document.getElementById("chartAreasFormacion");
  if (!canvas || typeof Chart === "undefined" || typeof PLAN_ESTUDIOS_ICOM_2021 === "undefined") return;

  const areas = {
    basicaComun:  { label: "Básica Común", obtenidos: 0, totales: 0, color: "#EAB308" },
    intermedia:   { label: "Intermedia",   obtenidos: 0, totales: 0, color: "#2563EB" },
    egreso:       { label: "Egreso",       obtenidos: 0, totales: 0, color: "#15803D" },
    laboratorios: { label: "Laboratorios", obtenidos: 0, totales: 0, color: "#F472B6" },
    requisitos:   { label: "Requisitos",   obtenidos: 0, totales: 10, color: "#9333EA" }
  };

  areas.requisitos.obtenidos = (window.creditosExtraRequisitos.fi || 0) + (window.creditosExtraRequisitos.pp || 0);

  PLAN_ESTUDIOS_ICOM_2021.forEach(sem => {
    sem.materias.forEach(mat => {
      if (mat.esCasillaDual || mat.clave === "FI" || mat.clave === "PP") return;

      let clave = mat.clave;
      let cred = Number(mat.creditos || 0);

      if (/^UA\d_\d$/.test(clave)) {
        const sust = resolverMateriaUA(clave);
        if (sust) { clave = sust.clave; cred = Number(sust.creditos || 0); }
      }

      let grupo = null;
      if (mat.categoria === "inicial") grupo = areas.basicaComun;
      else if (mat.categoria === "intermedio") grupo = areas.intermedia;
      else if (mat.categoria === "egreso") grupo = areas.egreso;
      else if (mat.categoria === "lab") grupo = areas.laboratorios;

      if (grupo) {
        grupo.totales += cred;
        const info = consultarEstadoMateria(clave);
        if (info && info.aprobada) grupo.obtenidos += cred;
      }
    });
  });

  const keys = Object.keys(areas);
  const labels = keys.map(k => areas[k].label);
  const obtenidos = keys.map(k => areas[k].obtenidos);
  const totales = keys.map(k => areas[k].totales);
  const colores = keys.map(k => areas[k].color);

  const ctx = canvas.getContext("2d");
  if (window.chartAreasFormacionInstance) window.chartAreasFormacionInstance.destroy();

  window.chartAreasFormacionInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Créditos Obtenidos",
          data: obtenidos,
          backgroundColor: colores,
          borderRadius: 6,
          borderSkipped: false
        },
        {
          label: "Créditos Faltantes",
          data: totales.map((tot, i) => Math.max(0, tot - obtenidos[i])),
          backgroundColor: "#e2e8f0",
          borderRadius: 6,
          borderSkipped: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { stacked: true, grid: { display: false }, ticks: { font: { family: "Poppins", size: 8.5 }, color: "#64748b" } },
        y: { stacked: true, ticks: { stepSize: 20, callback: value => `${value} C`, font: { family: "Poppins", size: 9 }, color: "#94a3b8" }, grid: { color: "rgba(226, 232, 240, 0.6)" } }
      },
      plugins: {
        legend: {
          display: true,
          position: "top",
          labels: {
            boxWidth: 10,
            boxHeight: 10,
            font: { family: "Poppins", size: 9 },
            color: "#475569",
            padding: 8,
            generateLabels: () => {
              const items = keys.map((k, i) => ({
                text: `${areas[k].label} (${areas[k].obtenidos}/${areas[k].totales} C)`,
                fillStyle: areas[k].color,
                strokeStyle: areas[k].color,
                lineWidth: 0,
                hidden: false,
                index: i
              }));
              items.push({
                text: "Faltantes",
                fillStyle: "#e2e8f0",
                strokeStyle: "#cbd5e1",
                lineWidth: 1,
                hidden: false,
                index: 99
              });
              return items;
            }
          }
        },
        tooltip: {
          callbacks: {
            label: context => {
              const idx = context.dataIndex;
              const obt = obtenidos[idx];
              const tot = totales[idx];
              const pct = tot > 0 ? Math.round((obt / tot) * 100) : 0;
              return ` ${context.dataset.label}: ${context.raw} C (${pct}% completado)`;
            }
          }
        }
      }
    }
  });
}

function calcularCreditosEnCursoHorario() {
  let creditosEnCurso = 0;
  let materiasContadas = 0;

  if (typeof PLAN_ESTUDIOS_ICOM_2021 !== "undefined") {
    PLAN_ESTUDIOS_ICOM_2021.forEach(sem => {
      sem.materias.forEach(mat => {
        if (mat.esCasillaDual) return;
        let cKey = mat.clave;
        let cVal = Number(mat.creditos || 0);

        if (/^UA\d_\d$/.test(mat.clave)) {
          const s = resolverMateriaUA(mat.clave);
          if (s) { cKey = s.clave; cVal = Number(s.creditos || 0); }
        }

        const info = consultarEstadoMateria(cKey);
        if (info && info.enCurso && !info.aprobada) {
          creditosEnCurso += cVal;
          materiasContadas++;
        }
      });
    });
  }
  return { creditosEnCurso, materiasContadas };
}

function actualizarSimuladorHorario() {
  const base = obtenerCreditosPurosKardex();
  const actuales = base + (window.creditosExtraRequisitos.fi || 0) + (window.creditosExtraRequisitos.pp || 0);
  const totalReq = typeof CREDITOS_TOTALES_REQUERIDOS !== "undefined" ? CREDITOS_TOTALES_REQUERIDOS : 394;

  const { creditosEnCurso, materiasContadas } = calcularCreditosEnCursoHorario();
  const proyectados = actuales + creditosEnCurso;
  const faltantesProyectados = Math.max(0, totalReq - proyectados);

  const pctActual = (actuales / totalReq) * 100;
  const pctProyectado = Math.min(100, (proyectados / totalReq) * 100);
  const incremento = Math.max(0, pctProyectado - pctActual);

  const elCurso = document.getElementById("sim-creditos-curso");
  const elMats = document.getElementById("sim-materias-curso");
  const elTotales = document.getElementById("sim-creditos-totales");
  const elPct = document.getElementById("sim-porcentaje-avance");
  const elInc = document.getElementById("sim-incremento-avance");
  const elFalt = document.getElementById("sim-creditos-faltantes");

  if (elCurso) elCurso.innerText = `${creditosEnCurso} C`;
  if (elMats) elMats.innerText = `${materiasContadas} materia(s) en curso`;
  if (elTotales) elTotales.innerText = `${proyectados} / ${totalReq} C`;
  if (elPct) elPct.innerText = `${pctProyectado.toFixed(2)}%`;
  if (elInc) elInc.innerText = `+${incremento.toFixed(2)}% de incremento`;
  if (elFalt) elFalt.innerText = `${faltantesProyectados} C`;

  renderizarGraficasSimulacion(actuales, proyectados, faltantesProyectados, pctProyectado, creditosEnCurso);
}

function renderizarGraficasSimulacion(actuales, proyectados, faltantesProyectados, pctProyectado, creditosEnCurso) {
  const canvasDona = document.getElementById("chartSimAvanceDona");
  if (canvasDona && typeof Chart !== "undefined") {
    const elPctDona = document.getElementById("simPorcentajeDonaTexto");
    const elObtDona = document.getElementById("simObtenidosDonaTexto");
    const elFaltDona = document.getElementById("simFaltantesDonaTexto");

    if (elPctDona) elPctDona.innerText = `${pctProyectado.toFixed(2)}%`;
    if (elObtDona) elObtDona.innerText = `${proyectados} C`;
    if (elFaltDona) elFaltDona.innerText = `${faltantesProyectados} C`;

    if (window.chartSimAvanceDonaInstance) window.chartSimAvanceDonaInstance.destroy();
    
    const tieneEnCurso = creditosEnCurso > 0;
    const labelsDona = tieneEnCurso 
      ? ["Aprobados (Kárdex)", "Proyección", "Faltantes"] 
      : ["Aprobados (Kárdex)", "Faltantes"];
    const dataDona = tieneEnCurso 
      ? [actuales, creditosEnCurso, faltantesProyectados] 
      : [actuales, faltantesProyectados];
    const coloresDona = tieneEnCurso 
      ? ["#00A896", "#f97316", "#E9C46A"] 
      : ["#00A896", "#E9C46A"];

    window.chartSimAvanceDonaInstance = new Chart(canvasDona.getContext("2d"), {
      type: "doughnut",
      data: {
        labels: labelsDona,
        datasets: [{
          data: dataDona,
          backgroundColor: coloresDona,
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "72%",
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              boxWidth: 10,
              boxHeight: 10,
              usePointStyle: true,
              pointStyle: 'circle',
              font: { family: 'Poppins', size: 9 },
              color: '#64748b'
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return ` ${context.label}: ${context.raw} C`;
              }
            }
          }
        }
      }
    });
  }

  const canvasSem = document.getElementById("chartSimSemestres");
  if (canvasSem && typeof Chart !== "undefined" && typeof PLAN_ESTUDIOS_ICOM_2021 !== "undefined") {
    const datosSem = PLAN_ESTUDIOS_ICOM_2021.map(sem => {
      let tot = 0, obtKardex = 0, obtHorario = 0;

      sem.materias.forEach(mat => {
        if (mat.esCasillaDual) return;
        let cKey = mat.clave, cVal = Number(mat.creditos || 0);
        if (/^UA\d_\d$/.test(mat.clave)) {
          const s = resolverMateriaUA(mat.clave);
          if (s) { cKey = s.clave; cVal = Number(s.creditos || 0); }
        }
        if (mat.clave === "FI") {
          tot += 4;
          if (window.creditosExtraRequisitos.fi > 0) obtKardex += 4;
          return;
        }
        if (mat.clave === "PP") {
          tot += 6;
          if (window.creditosExtraRequisitos.pp > 0) obtKardex += 6;
          return;
        }

        tot += cVal;
        const info = consultarEstadoMateria(cKey);
        if (info) {
          if (info.aprobada) obtKardex += cVal;
          else if (info.enCurso) obtHorario += cVal;
        }
      });

      const pKardex = tot > 0 ? (obtKardex / tot) * 100 : 0;
      const pHorario = tot > 0 ? (obtHorario / tot) * 100 : 0;
      const pTotal = Math.min(100, Math.round(pKardex + pHorario));

      return {
        semestre: sem.semestre,
        pctKardex: pKardex,
        pctHorario: pHorario,
        pctTotal: pTotal,
        obtenidosTotales: obtKardex + obtHorario,
        totales: tot
      };
    });

    const elSemTxt = document.getElementById("simSemestresTexto");
    if (elSemTxt) {
      const listos = datosSem.filter(d => d.pctTotal === 100).length;
      elSemTxt.innerText = `${listos} de ${datosSem.length} listos`;
    }

    if (window.chartSimSemestresInstance) window.chartSimSemestresInstance.destroy();
    window.chartSimSemestresInstance = new Chart(canvasSem.getContext("2d"), {
      type: "bar",
      data: {
        labels: datosSem.map(d => `Sem ${d.semestre}`),
        datasets: [
          {
            label: "Aprobado (Kárdex)",
            data: datosSem.map(d => d.pctKardex),
            backgroundColor: "#00A896",
            borderRadius: 4
          },
          {
            label: "Proyección",
            data: datosSem.map(d => d.pctHorario),
            backgroundColor: "#f97316",
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { stacked: true, grid: { display: false }, ticks: { font: { size: 8.5 } } },
          y: { stacked: true, min: 0, max: 100, ticks: { stepSize: 25, callback: v => `${v}%`, font: { size: 9 } } }
        },
        plugins: {
          legend: {
            display: true,
            position: "bottom",
            labels: { boxWidth: 10, font: { size: 9 }, color: "#64748b" }
          },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.dataset.label}: ${ctx.raw.toFixed(1)}%`
            }
          }
        }
      }
    });
  }

  const canvasCiclos = document.getElementById("chartSimCiclos");
  if (canvasCiclos && typeof Chart !== "undefined") {
    let acum = 0;
    const datosCiclosProyectados = window.promediosCiclosCreditos.porCiclo.map((cr, idx) => {
      let suma = cr;
      if (idx === window.promediosCiclosCreditos.ciclos.length - 1) suma += creditosEnCurso;
      acum += suma;
      return acum;
    });

    const elCicloTxt = document.getElementById("simCicloActualTexto");
    if (elCicloTxt) elCicloTxt.innerText = `+${creditosEnCurso} C proyectados en 2026-B`;

    const ctx = canvasCiclos.getContext("2d");
    const gradient = ctx.createLinearGradient(0, 0, 0, 180);
    gradient.addColorStop(0, "rgba(249, 115, 22, 0.45)");
    gradient.addColorStop(1, "rgba(249, 115, 22, 0.02)");

    if (window.chartSimCiclosInstance) window.chartSimCiclosInstance.destroy();
    window.chartSimCiclosInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: window.promediosCiclosCreditos.ciclos,
        datasets: [{
          label: "Créditos Acumulados Proyectados",
          data: datosCiclosProyectados,
          fill: true,
          backgroundColor: gradient,
          borderColor: "#f97316",
          borderWidth: 2.5,
          tension: 0.35,
          pointBackgroundColor: "#ffffff",
          pointBorderColor: "#f97316",
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, suggestedMax: 394, ticks: { stepSize: 50, callback: v => `${v} C`, font: { size: 9 } } },
          x: { ticks: { font: { size: 8.5 } }, grid: { display: false } }
        },
        plugins: { legend: { display: false } }
      }
    });
  }

  const canvasAreas = document.getElementById("chartSimAreasFormacion");
  if (canvasAreas && typeof Chart !== "undefined" && typeof PLAN_ESTUDIOS_ICOM_2021 !== "undefined") {
    const areas = {
      basicaComun:  { label: "Básica",       kardex: 0, horario: 0, totales: 0, color: "#EAB308" },
      intermedia:   { label: "Intermedia",   kardex: 0, horario: 0, totales: 0, color: "#2563EB" },
      egreso:       { label: "Egreso",       kardex: 0, horario: 0, totales: 0, color: "#15803D" },
      laboratorios: { label: "Laboratorios", kardex: 0, horario: 0, totales: 0, color: "#F472B6" },
      requisitos:   { label: "Requisitos",   kardex: 0, horario: 0, totales: 10, color: "#9333EA" }
    };

    areas.requisitos.kardex = (window.creditosExtraRequisitos.fi || 0) + (window.creditosExtraRequisitos.pp || 0);

    PLAN_ESTUDIOS_ICOM_2021.forEach(sem => {
      sem.materias.forEach(mat => {
        if (mat.esCasillaDual || mat.clave === "FI" || mat.clave === "PP") return;
        let cKey = mat.clave, cVal = Number(mat.creditos || 0);
        if (/^UA\d_\d$/.test(mat.clave)) {
          const s = resolverMateriaUA(mat.clave);
          if (s) { cKey = s.clave; cVal = Number(s.creditos || 0); }
        }
        let grp = null;
        if (mat.categoria === "inicial") grp = areas.basicaComun;
        else if (mat.categoria === "intermedio") grp = areas.intermedia;
        else if (mat.categoria === "egreso") grp = areas.egreso;
        else if (mat.categoria === "lab") grp = areas.laboratorios;

        if (grp) {
          grp.totales += cVal;
          const info = consultarEstadoMateria(cKey);
          if (info) {
            if (info.aprobada) grp.kardex += cVal;
            else if (info.enCurso) grp.horario += cVal;
          }
        }
      });
    });

    const keys = Object.keys(areas);
    if (window.chartSimAreasFormacionInstance) window.chartSimAreasFormacionInstance.destroy();
    window.chartSimAreasFormacionInstance = new Chart(canvasAreas.getContext("2d"), {
      type: "bar",
      data: {
        labels: keys.map(k => areas[k].label),
        datasets: [
          {
            label: "Aprobados (Kárdex)",
            data: keys.map(k => areas[k].kardex),
            backgroundColor: keys.map(k => areas[k].color),
            borderRadius: 4
          },
          {
            label: "Proyección",
            data: keys.map(k => areas[k].horario),
            backgroundColor: "#f97316",
            borderRadius: 4
          },
          {
            label: "Faltantes",
            data: keys.map(k => Math.max(0, areas[k].totales - (areas[k].kardex + areas[k].horario))),
            backgroundColor: "#e2e8f0",
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { stacked: true, grid: { display: false }, ticks: { font: { size: 8.5 } } },
          y: { stacked: true, ticks: { stepSize: 20, callback: v => `${v} C`, font: { size: 9 } } }
        },
        plugins: {
          legend: {
            display: true,
            position: "bottom",
            labels: { boxWidth: 10, font: { size: 9 }, color: "#64748b" }
          },
          tooltip: {
            callbacks: {
              label: context => ` ${context.dataset.label}: ${context.raw} C`
            }
          }
        }
      }
    });
  }
}

// --------------------------------------------------------------------------
// 9. CONTROLADORES DEL CHECKLIST DE REQUISITOS (SINCRONIZADO CON MALLA)
// --------------------------------------------------------------------------
function mostrarAlertaRequisitos(mensaje) {
  const caja = document.getElementById("alertaRequisitosChecklist");
  const txt = document.getElementById("textoAlertaRequisitos");
  if (!caja || !txt) { alert(mensaje); return; }
  txt.innerText = mensaje;
  caja.classList.remove("hidden");
  setTimeout(() => { caja.classList.add("hidden"); }, 4500);
}

function gestionarCheckFI(checkbox) {
  window.creditosExtraRequisitos.fi = checkbox.checked ? 4 : 0;
  guardarEstadoChecklist();
  sincronizarContadoresVisuales();
}
window.gestionarCheckFI = gestionarCheckFI;

function gestionarCheckSS(e, checkbox) {
  const pct = (obtenerCreditosPurosKardex() / 394) * 100;
  if (!checkbox.checked) {
    guardarEstadoChecklist();
    sincronizarContadoresVisuales();
    return true;
  }
  if (pct < 60 || pct > 100) {
    if (e) e.preventDefault();
    checkbox.checked = false;
    mostrarAlertaRequisitos("El alumno solo puede marcar Servicio Social si cuenta con entre el 60% y el 100% de los créditos.");
    guardarEstadoChecklist();
    sincronizarContadoresVisuales();
    return false;
  }
  guardarEstadoChecklist();
  sincronizarContadoresVisuales();
  return true;
}
window.gestionarCheckSS = gestionarCheckSS;

function gestionarCheckPP(e, checkbox) {
  const pct = (obtenerCreditosPurosKardex() / 394) * 100;
  if (!checkbox.checked) {
    window.creditosExtraRequisitos.pp = 0;
    guardarEstadoChecklist();
    sincronizarContadoresVisuales();
    return true;
  }
  if (pct < 80 || pct > 100) {
    if (e) e.preventDefault();
    checkbox.checked = false;
    window.creditosExtraRequisitos.pp = 0;
    mostrarAlertaRequisitos("El alumno solo puede marcar Prácticas Profesionales si cuenta con entre el 80% y el 100% de los créditos.");
    guardarEstadoChecklist();
    sincronizarContadoresVisuales();
    return false;
  }
  window.creditosExtraRequisitos.pp = 6;
  guardarEstadoChecklist();
  sincronizarContadoresVisuales();
  return true;
}
window.gestionarCheckPP = gestionarCheckPP;

function gestionarCheckEGEL(e, checkbox) {
  const pct = (obtenerCreditosPurosKardex() / 394) * 100;
  if (!checkbox.checked) {
    guardarEstadoChecklist();
    sincronizarContadoresVisuales();
    return true;
  }
  if (pct < 90) {
    if (e) e.preventDefault();
    checkbox.checked = false;
    mostrarAlertaRequisitos("Necesitas como mínimo el 90% de los créditos para marcar Capacitación EGEL.");
    guardarEstadoChecklist();
    sincronizarContadoresVisuales();
    return false;
  }
  guardarEstadoChecklist();
  sincronizarContadoresVisuales();
  return true;
}
window.gestionarCheckEGEL = gestionarCheckEGEL;

function gestionarCheckPM(e, checkbox) {
  if (!checkbox.checked) {
    guardarEstadoChecklist();
    sincronizarContadoresVisuales();
    return true;
  }
  const seminarios = ["IL369", "IL370", "IL371"];
  const faltantes = seminarios.filter(s => {
    const info = consultarEstadoMateria(s);
    return !info || !info.aprobada;
  });

  if (faltantes.length > 0) {
    if (e) e.preventDefault();
    checkbox.checked = false;
    mostrarAlertaRequisitos(`Para marcar Proyecto Modular antes debes haber aprobado los 3 seminarios: ${faltantes.join(", ")}`);
    guardarEstadoChecklist();
    sincronizarContadoresVisuales();
    return false;
  }
  guardarEstadoChecklist();
  sincronizarContadoresVisuales();
  return true;
}
window.gestionarCheckPM = gestionarCheckPM;

function gestionarCheckIngles(e, checkbox) {
  guardarEstadoChecklist();
  sincronizarContadoresVisuales();
  return true;
}
window.gestionarCheckIngles = gestionarCheckIngles;

// --------------------------------------------------------------------------
// 10. SESIÓN, MENÚS, PERFIL Y CONFIGURACIÓN
// --------------------------------------------------------------------------
function inicializarUsuarioSesion() {
  const usuarioGuardado = localStorage.getItem('usuarioNombre');
  const elSaludo = document.getElementById('saludoUsuario');

  if (elSaludo) {
    if (usuarioGuardado && usuarioGuardado.trim() !== '') {
      let nombreLimpio = usuarioGuardado.includes('@') ? usuarioGuardado.split('@')[0] : usuarioGuardado;
      nombreLimpio = nombreLimpio.charAt(0).toUpperCase() + nombreLimpio.slice(1);
      elSaludo.innerText = `¡Hola ${nombreLimpio}!`;
    } else {
      elSaludo.innerText = `¡Hola!`;
    }
  }
}

function cerrarSesionUsuario() {
  localStorage.removeItem('usuarioNombre');
  window.location.href = 'index.html';
}
window.cerrarSesionUsuario = cerrarSesionUsuario;

function toggleMenuPrincipal() {
  const menu = document.getElementById('menuLateralOpciones');
  if (menu) menu.classList.toggle('hidden');
}
window.toggleMenuPrincipal = toggleMenuPrincipal;

function toggleMenuCarrera() {
  const menu = document.getElementById('careerMenu');
  if (menu) menu.classList.toggle('hidden');
}
window.toggleMenuCarrera = toggleMenuCarrera;

function seleccionarCarrera(nombreCarrera) {
  const span = document.getElementById('selectedCareer');
  if (span) {
    span.innerText = nombreCarrera;
    span.classList.remove('text-slate-400', 'text-slate-300', 'italic');
    span.classList.add('text-white', 'font-semibold');
  }
  
  const menu = document.getElementById('careerMenu');
  if (menu) menu.classList.add('hidden');

  const badgeCarrera = document.getElementById('badgeCarreraHeader');
  const panelMetricasBanner = document.getElementById('panelMetricasBanner');
  const vistaDefecto = document.getElementById('vistaDashboardDefecto');
  const panelTarjetas = document.getElementById('panelTarjetasCarrera');

  if (nombreCarrera === 'Ingeniería en Computación') {
    if (badgeCarrera) {
      badgeCarrera.classList.remove('hidden');
      badgeCarrera.classList.add('flex');
    }
    if (panelMetricasBanner) {
      panelMetricasBanner.classList.remove('hidden');
      panelMetricasBanner.classList.add('flex');
    }
    if (vistaDefecto) vistaDefecto.classList.add('hidden');
    if (panelTarjetas) panelTarjetas.classList.remove('hidden');

    actualizarTodo();
    actualizarEstadoHorarioHoy();
    guardarDatosSesionUsuario();
  } else {
    if (badgeCarrera) badgeCarrera.classList.add('hidden');
    if (panelMetricasBanner) {
      panelMetricasBanner.classList.add('hidden');
      panelMetricasBanner.classList.remove('flex');
    }
    if (vistaDefecto) vistaDefecto.classList.remove('hidden');
    if (panelTarjetas) panelTarjetas.classList.add('hidden');
  }
}
window.seleccionarCarrera = seleccionarCarrera;

function actualizarTextosPerfilUI() {
  const elSituacion = document.getElementById('perfilKardexSituacion');
  const elAdmision = document.getElementById('perfilKardexAdmision');
  const elUltimoCiclo = document.getElementById('perfilKardexUltimoCiclo');

  if (elSituacion) {
    elSituacion.innerText = datosKardexEstudiante.situacion;
    if (datosKardexEstudiante.situacion === "Sin archivo" || datosKardexEstudiante.situacion === "No cargado") {
      elSituacion.className = "font-bold text-slate-400 bg-slate-800/50 px-2 py-0.5 rounded-lg border border-slate-700";
    } else {
      elSituacion.className = "font-bold text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded-lg border border-amber-500/30";
    }
  }
  if (elAdmision) elAdmision.innerText = datosKardexEstudiante.admision;
  if (elUltimoCiclo) elUltimoCiclo.innerText = datosKardexEstudiante.ultimoCiclo;
}

function abrirModalPerfil() {
  const usuarioActivo = localStorage.getItem('usuarioNombre');
  const cuentas = JSON.parse(localStorage.getItem('cuentasUsuarios') || '[]');
  const cuentaEncontrada = cuentas.find(u => u.usuario === usuarioActivo || u.correo === usuarioActivo);

  const elUsuario = document.getElementById('perfilUsuarioNombre');
  const elCorreo = document.getElementById('perfilUsuarioCorreo');
  const elPass = document.getElementById('perfilUsuarioPassword');

  if (cuentaEncontrada) {
    if (elUsuario) elUsuario.innerText = cuentaEncontrada.usuario;
    if (elCorreo) elCorreo.innerText = cuentaEncontrada.correo;
    passwordReal = cuentaEncontrada.password;
  } else {
    if (elUsuario) elUsuario.innerText = usuarioActivo || "Estudiante";
    if (elCorreo) elCorreo.innerText = "No registrado";
    passwordReal = "••••••••";
  }

  passwordVisible = false;
  if (elPass) elPass.innerText = "••••••••";
  const icon = document.getElementById('iconoOjoPerfil');
  if (icon) icon.className = "fa-solid fa-eye-slash text-xs";

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

function toggleVerPasswordPerfil() {
  const elPass = document.getElementById('perfilUsuarioPassword');
  const icon = document.getElementById('iconoOjoPerfil');
  if (!elPass) return;

  passwordVisible = !passwordVisible;
  if (passwordVisible) {
    elPass.innerText = passwordReal;
    if (icon) icon.className = "fa-solid fa-eye text-xs text-teal-400";
  } else {
    elPass.innerText = "••••••••";
    if (icon) icon.className = "fa-solid fa-eye-slash text-xs";
  }
}
window.toggleVerPasswordPerfil = toggleVerPasswordPerfil;

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
  const usuarioActivo = localStorage.getItem('usuarioNombre') || 'default';
  const fotoGuardada = localStorage.getItem(`fotoPerfil_${usuarioActivo}`);

  const imgNav = document.getElementById('avatarUsuarioNav');
  const iconoNav = document.getElementById('iconoUsuarioNav');
  const imgPreview = document.getElementById('avatarConfigPreview');
  const iconoPreview = document.getElementById('avatarIconoPreview');

  if (fotoGuardada) {
    if (imgNav) { imgNav.src = fotoGuardada; imgNav.classList.remove('hidden'); }
    if (iconoNav) iconoNav.classList.add('hidden');
    if (imgPreview) { imgPreview.src = fotoGuardada; imgPreview.classList.remove('hidden'); }
    if (iconoPreview) iconoPreview.classList.add('hidden');
  } else {
    if (imgNav) { imgNav.src = ''; imgNav.classList.add('hidden'); }
    if (iconoNav) iconoNav.classList.remove('hidden');
    if (imgPreview) { imgPreview.src = ''; imgPreview.classList.add('hidden'); }
    if (iconoPreview) iconoPreview.classList.remove('hidden');
  }
}

function procesarFotoPerfil(inputElement) {
  const archivo = inputElement.files[0];
  if (!archivo) return;

  if (archivo.size > 2 * 1024 * 1024) {
    alert("La imagen excede el límite de 2 MB.");
    inputElement.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const base64Data = e.target.result;
    const usuarioActivo = localStorage.getItem('usuarioNombre') || 'default';
    localStorage.setItem(`fotoPerfil_${usuarioActivo}`, base64Data);
    cargarFotoPerfilUI();
  };
  reader.readAsDataURL(archivo);
}
window.procesarFotoPerfil = procesarFotoPerfil;

function eliminarFotoPerfil() {
  const usuarioActivo = localStorage.getItem('usuarioNombre') || 'default';
  localStorage.removeItem(`fotoPerfil_${usuarioActivo}`);
  const inputFoto = document.getElementById('input-avatar-archivo');
  if (inputFoto) inputFoto.value = "";
  cargarFotoPerfilUI();
}
window.eliminarFotoPerfil = eliminarFotoPerfil;

function actualizarPreferenciaAnimaciones(checkbox) {
  if (checkbox.checked) {
    document.body.classList.remove('no-transitions');
    if (typeof Chart !== 'undefined') Chart.defaults.animation = true;
  } else {
    document.body.classList.add('no-transitions');
    if (typeof Chart !== 'undefined') Chart.defaults.animation = false;
  }
}
window.actualizarPreferenciaAnimaciones = actualizarPreferenciaAnimaciones;

function limpiarArchivosCargados() {
  const usuario = obtenerClaveUsuarioActivo();
  if (usuario && usuario !== "default") {
    localStorage.removeItem(`checklist_requisitos_${usuario}`);
  }
  quitarKardex();
  quitarHorario();
  cerrarModalConfiguracion();
}
window.limpiarArchivosCargados = limpiarArchivosCargados;

window.onclick = function(event) {
  if (!event.target.closest('#careerDropdownBtn') && !event.target.closest('#careerMenu')) {
    const dropdown = document.getElementById('careerMenu');
    if (dropdown && !dropdown.classList.contains('hidden')) dropdown.classList.add('hidden');
  }
  if (!event.target.closest('#btnMenuPrincipal') && !event.target.closest('#menuLateralOpciones')) {
    const menuLateral = document.getElementById('menuLateralOpciones');
    if (menuLateral && !menuLateral.classList.contains('hidden')) menuLateral.classList.add('hidden');
  }
};

// --------------------------------------------------------------------------
// 11. INICIALIZACIÓN GENERAL DEL DOM
// --------------------------------------------------------------------------
window.addEventListener('kardexProcesado', async () => {
  const inputKardex = document.getElementById('input-kardex');
  if (inputKardex && inputKardex.files && inputKardex.files[0]) {
    await procesarMetadatosYPromediosKardex(inputKardex.files[0]);
    await procesarAvanceCiclosKardex(inputKardex.files[0]);
  }
  restaurarEstadoChecklist();
  sincronizarContadoresVisuales();
});

document.addEventListener('DOMContentLoaded', () => {
  inicializarMapaPlanEstudios();
  inicializarUsuarioSesion();
  cargarFotoPerfilUI();

  restaurarDatosSesionUsuario();
  restaurarEstadoChecklist();
  actualizarTodo();

  const inputKardex = document.getElementById('input-kardex');
  if (inputKardex) {
    inputKardex.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        await procesarMetadatosYPromediosKardex(file);
        await procesarAvanceCiclosKardex(file);
        restaurarEstadoChecklist();
        sincronizarContadoresVisuales();
      }
    });
  }

  const inputHorario = document.getElementById("input-horario");
  if (inputHorario) {
    inputHorario.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const textoHorario = document.getElementById("texto-horario");
      if (textoHorario) textoHorario.innerText = file.name;

      try {
        await parsearHorarioPDFConEstructura(file);
        const btnQuitarHorario = document.getElementById("btn-quitar-horario");
        if (btnQuitarHorario) btnQuitarHorario.classList.remove("hidden");
        sincronizarContadoresVisuales();
      } catch (err) {
        console.error("Error al procesar el Horario:", err);
        alert("Ocurrió un error al procesar el Horario PDF.");
      }
    });
  }
});