// ==========================================================================
// malla.js: TABLERO OFICIAL MALLA CURRICULAR ICOM 2021
// ==========================================================================

const CREDITOS_TOTALES_REQUERIDOS = 394;
let estadoMaterias = {};
let horarioSemanal = [];
let datosKardex = {};
let checklistRequisitos = {};

function obtenerClaveUsuario() {
  return localStorage.getItem("usuarioNombre") || "default";
}

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
      console.error("Error al leer JSON:", e);
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
  if (checklistRequisitos.ss === undefined && estadoMaterias["SS"]) {
    checklistRequisitos.ss = !!estadoMaterias["SS"].aprobada;
  }
  if (checklistRequisitos.ingles === undefined && estadoMaterias["ING_B1"]) {
    checklistRequisitos.ingles = !!estadoMaterias["ING_B1"].aprobada;
  }
  if (checklistRequisitos.pp === undefined && estadoMaterias["PP"]) {
    checklistRequisitos.pp = !!estadoMaterias["PP"].aprobada;
  }
  if (checklistRequisitos.pm === undefined && estadoMaterias["PROY_MOD"]) {
    checklistRequisitos.pm = !!estadoMaterias["PROY_MOD"].aprobada;
  }
  if (checklistRequisitos.egel === undefined && estadoMaterias["EGEL"]) {
    checklistRequisitos.egel = !!estadoMaterias["EGEL"].aprobada;
  }
}

function consultarEstado(clave) {
  if (!estadoMaterias || !clave) return null;
  if (estadoMaterias[clave]) return estadoMaterias[clave];

  let altClave = clave;
  if (clave.startsWith("I")) altClave = "1" + clave.substring(1);
  else if (clave.startsWith("1")) altClave = "I" + clave.substring(1);

  return estadoMaterias[altClave] || null;
}

function obtenerClaseCompetencia(categoria) {
  switch (categoria) {
    case "inicial": return "texto-inicial";
    case "intermedio": return "texto-intermedio";
    case "egreso": return "texto-egreso";
    case "lab": return "texto-lab";
    case "requisito": return "texto-requisito";
    default: return "texto-intermedio";
  }
}

// Retorna la lista de claves que faltan por aprobar
function obtenerPrerrequisitosFaltantes(clave) {
  if (typeof PRERREQUISITOS_ICOM_2021 === "undefined") return [];
  const reqs = PRERREQUISITOS_ICOM_2021[clave];
  if (!reqs || reqs.length === 0) return [];

  return reqs.filter(claveReq => {
    const estado = consultarEstado(claveReq);
    return !estado || !estado.aprobada;
  });
}

// Identifica cuáles módulos ya inició el alumno
function detectarModulosSeleccionados() {
  if (typeof MODULOS_ESPECIALIZACION === "undefined") return [];

  return MODULOS_ESPECIALIZACION.filter(modulo => {
    return modulo.materias.some(mat => {
      const info = consultarEstado(mat.clave);
      return info && (info.aprobada || info.enCurso);
    });
  });
}

// Sustituye UA1_1, UA2_1, UA3_1 o UA1_2, UA2_2, UA3_2 por las materias del módulo
function resolverMateriaUA(claveUA) {
  const match = claveUA.match(/^UA(\d)_(\d)$/);
  if (!match) return null;

  const nivelIdx = parseInt(match[1], 10) - 1; // 0: VI, 1: VII, 2: VIII
  const lineaIdx = parseInt(match[2], 10) - 1; // 0: Módulo línea 1, 1: Módulo línea 2

  const modulosElegidos = detectarModulosSeleccionados();
  const moduloAsignado = modulosElegidos[lineaIdx];

  if (!moduloAsignado || !moduloAsignado.materias[nivelIdx]) return null;

  return moduloAsignado.materias[nivelIdx];
}

// Genera la matriz de 7 filas x 9 columnas con las sustituciones dinámicas
function construirMatrizDesdePlanEstudios() {
  const matriz = Array.from({ length: 7 }, () => Array(9).fill(null));
  if (typeof PLAN_ESTUDIOS_ICOM_2021 === "undefined") return matriz;

  const mapaSemestres = { "I": 0, "II": 1, "III": 2, "IV": 3, "V": 4, "VI": 5, "VII": 6, "VIII": 7, "IX": 8 };

  PLAN_ESTUDIOS_ICOM_2021.forEach(semObj => {
    const colIdx = mapaSemestres[semObj.semestre];
    if (colIdx === undefined) return;

    const filasAsignadas = (typeof FILAS_MALLA_ICOM_2021 !== "undefined")
      ? (FILAS_MALLA_ICOM_2021[colIdx] || [])
      : [];

    semObj.materias.forEach((mat, idx) => {
      const filaDestino = filasAsignadas[idx];
      if (filaDestino !== undefined && filaDestino < 7) {
        let materiaFinal = mat;
        if (mat.clave && /^UA\d_\d$/.test(mat.clave)) {
          const sust = resolverMateriaUA(mat.clave);
          if (sust) materiaFinal = sust;
        }
        matriz[filaDestino][colIdx] = materiaFinal;
      }
    });
  });

  return matriz;
}

function renderizarTableroMalla() {
  const matrizContainer = document.getElementById("malla-matriz-cucei");
  if (!matrizContainer) return;
  matrizContainer.innerHTML = "";

  const matriz = construirMatrizDesdePlanEstudios();

  matriz.forEach(fila => {
    fila.forEach(celda => {
      if (!celda) {
        const vacio = document.createElement("div");
        vacio.className = "materia-vacia";
        matrizContainer.appendChild(vacio);
        return;
      }

      // ====================================================================
      // CASILLA DUAL (SERVICIO SOCIAL / INGLÉS  ó  PROYECTO MODULAR / EGEL)
      // ====================================================================
      if (celda.esCasillaDual && celda.subItems) {
        const dualDiv = document.createElement("div");
        dualDiv.className = "celda-materia justify-between p-1 bg-white overflow-hidden";

        let creditosPuros = 0;
        if (typeof PLAN_ESTUDIOS_ICOM_2021 !== "undefined") {
          PLAN_ESTUDIOS_ICOM_2021.forEach(sem => {
            sem.materias.forEach(mat => {
              if (mat.esCasillaDual || mat.clave === "FI" || mat.clave === "PP") return;
              let claveCheck = mat.clave;
              if (/^UA\d_\d$/.test(mat.clave)) {
                const s = resolverMateriaUA(mat.clave);
                if (s) claveCheck = s.clave;
              }
              const info = consultarEstado(claveCheck);
              if (info && info.aprobada) creditosPuros += Number(mat.creditos || 0);
            });
          });
        }
        const pctCreditos = (creditosPuros / CREDITOS_TOTALES_REQUERIDOS) * 100;

        const seminariosCompletos = ["IL369", "IL370", "IL371"].every(s => {
          const info = consultarEstado(s);
          return info && info.aprobada;
        });

        const subItemsHtml = celda.subItems.map((sub, i) => {
          let cumplido = false;
          let bloqueado = false;
          let textoEstado = "PENDIENTE";
          let claseFondoSub = "bg-rose-50/70 border-rose-200 text-rose-700";

          if (sub.clave === "SS") {
            cumplido = !!checklistRequisitos.ss;
            bloqueado = !cumplido && pctCreditos < 60;
          } else if (sub.clave === "ING_B1") {
            cumplido = !!checklistRequisitos.ingles;
            bloqueado = false;
          } else if (sub.clave === "PROY_MOD") {
            cumplido = !!checklistRequisitos.pm;
            bloqueado = !cumplido && !seminariosCompletos;
          } else if (sub.clave === "EGEL") {
            cumplido = !!checklistRequisitos.egel;
            bloqueado = !cumplido && pctCreditos < 90;
          }

          if (cumplido) {
            claseFondoSub = "bg-emerald-50 border-emerald-300 text-emerald-800";
            textoEstado = "✓ CUMPLIDO";
          } else if (bloqueado) {
            claseFondoSub = "bg-slate-100 border-slate-300 text-slate-500";
            textoEstado = "BLOQUEADO";
          }

          return `
            <div class="${i > 0 ? 'mt-1 pt-1 border-t border-slate-200' : ''} p-1 rounded-md border ${claseFondoSub} flex flex-col justify-between transition-colors">
              <div class="flex justify-between items-center text-[7.5px] font-bold">
                <span class="font-black uppercase tracking-tight">${sub.nombre}</span>
                <span class="opacity-80">${sub.hc || sub.nota || ''}</span>
              </div>
              <div class="text-right mt-0.5">
                <span class="text-[7px] font-black uppercase tracking-wider">${textoEstado}</span>
              </div>
            </div>
          `;
        }).join('');

        dualDiv.innerHTML = `
          <div class="flex flex-col gap-0.5 my-auto w-full">
            ${subItemsHtml}
          </div>
          <div class="w-full h-1.5 bg-[#7e22ce] rounded-full mt-1"></div>
        `;
        matrizContainer.appendChild(dualDiv);
        return;
      }

      // ====================================================================
      // REQUISITO UNITARIO (FORMACIÓN INTEGRAL  ó  PRÁCTICAS PROFESIONALES)
      // ====================================================================
      if (celda.categoria === "requisito") {
        const reqDiv = document.createElement("div");

        let creditosPuros = 0;
        if (typeof PLAN_ESTUDIOS_ICOM_2021 !== "undefined") {
          PLAN_ESTUDIOS_ICOM_2021.forEach(sem => {
            sem.materias.forEach(mat => {
              if (mat.esCasillaDual || mat.clave === "FI" || mat.clave === "PP") return;
              let claveCheck = mat.clave;
              if (/^UA\d_\d$/.test(mat.clave)) {
                const s = resolverMateriaUA(mat.clave);
                if (s) claveCheck = s.clave;
              }
              const info = consultarEstado(claveCheck);
              if (info && info.aprobada) creditosPuros += Number(mat.creditos || 0);
            });
          });
        }
        const pctCreditos = (creditosPuros / CREDITOS_TOTALES_REQUERIDOS) * 100;

        let cumplido = false;
        let bloqueado = false;

        if (celda.clave === "FI") {
          cumplido = !!checklistRequisitos.fi;
          bloqueado = false;
        } else if (celda.clave === "PP") {
          cumplido = !!checklistRequisitos.pp;
          bloqueado = !cumplido && pctCreditos < 80;
        }

        let claseEstado = "materia-disponible";
        let textoEstado = "PENDIENTE";
        let claseTexto = "text-rose-600 font-bold";

        if (cumplido) {
          claseEstado = "materia-aprobada";
          textoEstado = "✓ CUMPLIDO";
          claseTexto = "text-emerald-700 font-black";
        } else if (bloqueado) {
          claseEstado = "materia-bloqueada";
          textoEstado = "BLOQUEADA";
          claseTexto = "text-slate-500 font-bold";
        }

        reqDiv.className = `celda-materia ${claseEstado}`;
        reqDiv.innerHTML = `
          <div class="flex justify-between items-center text-[8px] font-bold text-slate-600 px-0.5">
            <span>${celda.hc}H</span>
            <span>${celda.creditos}C</span>
          </div>
          <div class="text-center my-auto px-0.5">
            <span class="text-[8.5px] font-black uppercase text-slate-900 leading-tight block">
              ${celda.nombre}
            </span>
          </div>
          <div class="flex justify-between items-center pt-1 border-t border-black/10 text-[7.5px] font-extrabold uppercase">
            <span class="${claseTexto}">${textoEstado}</span>
            <span class="text-purple-700 font-bold">REQ</span>
          </div>
          <div class="w-full h-1.5 bg-[#7e22ce] rounded-full mt-0.5"></div>
        `;
        matrizContainer.appendChild(reqDiv);
        return;
      }

      // ====================================================================
      // MATERIA REGULAR (TRONCO COMÚN O MÓDULO SUSTITUIDO)
      // ====================================================================
      const info = consultarEstado(celda.clave);
      const aprobada = info && info.aprobada;
      const enCurso = info && info.enCurso && !aprobada;
      const reqsFaltantes = obtenerPrerrequisitosFaltantes(celda.clave);
      const puedeCursar = reqsFaltantes.length === 0;
      const esOpcional = celda.clave === "V2455";

      let estadoFondo = "materia-disponible";
      let textoEstadoPie = esOpcional ? "OPCIONAL" : "PENDIENTE";
      let claseTextoPie = esOpcional ? "text-slate-500 font-bold" : "text-rose-600 font-bold";
      let textoRequisitoHtml = "";

      if (aprobada) {
        estadoFondo = "materia-aprobada";
        textoEstadoPie = `✓ ${info.calificacion || 'AC'}`;
        claseTextoPie = "text-emerald-700 font-black";
      } else if (enCurso) {
        estadoFondo = "materia-en-curso";
        textoEstadoPie = "EN CURSO";
        claseTextoPie = "text-orange-600 font-black";
      } else if (!puedeCursar) {
        estadoFondo = "materia-bloqueada";
        textoEstadoPie = "BLOQUEADA";
        claseTextoPie = "text-slate-500 font-bold";
        // Mostrar cuál clave requiere
        textoRequisitoHtml = `<span class="text-[7.5px] font-extrabold text-slate-900 truncate mx-1" title="Requiere ${reqsFaltantes.join(', ')}">Requiere ${reqsFaltantes.join(', ')}</span>`;
      }

      const claseColorLetras = obtenerClaseCompetencia(celda.categoria);
      const nombreMostrar = esOpcional 
        ? `${celda.nombre} <span class="text-[7.5px] lowercase font-semibold text-slate-500 block">(opcional)</span>`
        : celda.nombre;

      const divMat = document.createElement("div");
      divMat.className = `celda-materia ${estadoFondo}`;
      divMat.innerHTML = `
        <div class="clave-texto ${claseColorLetras}">
          ${celda.clave}
        </div>
        <div class="flex justify-between items-center text-[8px] font-bold text-slate-700 px-0.5">
          <span>${celda.hc}H</span>
          <span>${celda.creditos}C</span>
        </div>
        <div class="text-center my-auto px-0.5">
          <span class="text-[8.5px] font-black uppercase text-slate-800 leading-tight line-clamp-2">
            ${nombreMostrar}
          </span>
        </div>
        <div class="flex justify-between items-center pt-1 border-t border-black/10 text-[7.5px] font-extrabold uppercase">
          <span class="${claseTextoPie}">${textoEstadoPie}</span>
          ${textoRequisitoHtml}
          <span class="text-slate-400 font-bold shrink-0">${celda.categoria === 'inicial' ? 'INI' : celda.categoria === 'intermedio' ? 'INT' : celda.categoria === 'egreso' ? 'EGR' : celda.categoria === 'lab' ? 'LAB' : ''}</span>
        </div>
      `;
      matrizContainer.appendChild(divMat);
    });
  });

  actualizarBannerMetricas();
}

// ==========================================================================
// RENDERIZADO DE MÓDULOS DE ESPECIALIZACIÓN (PARTE BAJA)
// ==========================================================================
function renderizarModulosEspecializacion() {
  const contenedor = document.getElementById("contenedor-modulos-especializacion");
  if (!contenedor || typeof MODULOS_ESPECIALIZACION === "undefined") return;

  contenedor.innerHTML = "";

  const modulosElegidos = detectarModulosSeleccionados();
  const limiteModulosAlcanzado = modulosElegidos.length >= 2;

  MODULOS_ESPECIALIZACION.forEach(modulo => {
    const bloque = document.createElement("div");
    bloque.className = "card-modulo-contenedor";

    const esModuloIniciado = modulo.materias.some(mat => {
      const info = consultarEstado(mat.clave);
      return info && (info.aprobada || info.enCurso);
    });

    const moduloDescartado = limiteModulosAlcanzado && !esModuloIniciado;

    const header = document.createElement("div");
    header.className = `modulo-header-titulo ${moduloDescartado ? 'opacity-50' : ''}`;
    header.innerText = modulo.titulo;
    bloque.appendChild(header);

    const listaMats = document.createElement("div");
    listaMats.className = "flex flex-col gap-1.5";

    modulo.materias.forEach(mat => {
      const info = consultarEstado(mat.clave);
      const aprobada = info && info.aprobada;
      const enCurso = info && info.enCurso && !aprobada;
      const reqsFaltantes = obtenerPrerrequisitosFaltantes(mat.clave);
      const puedeCursar = reqsFaltantes.length === 0;

      let estadoFondo = "materia-disponible";
      let textoEstadoPie = "PENDIENTE";
      let claseTextoPie = "text-rose-600 font-bold";
      let textoRequisitoHtml = "";

      if (aprobada) {
        estadoFondo = "materia-aprobada";
        textoEstadoPie = `✓ ${info.calificacion || 'AC'}`;
        claseTextoPie = "text-emerald-700 font-black";
      } else if (enCurso) {
        estadoFondo = "materia-en-curso";
        textoEstadoPie = "EN CURSO";
        claseTextoPie = "text-orange-600 font-black";
      } else if (moduloDescartado || !puedeCursar) {
        estadoFondo = "materia-bloqueada";
        textoEstadoPie = "BLOQUEADA";
        claseTextoPie = "text-slate-500 font-bold";
        if (!puedeCursar && reqsFaltantes.length > 0) {
          textoRequisitoHtml = `<span class="text-[7px] font-extrabold text-slate-900 truncate mx-1" title="Requiere ${reqsFaltantes.join(', ')}">Requiere ${reqsFaltantes.join(', ')}</span>`;
        }
      }

      const esEgreso = mat.categoria === "egreso";
      const claseColorClave = esEgreso ? "texto-egreso" : "texto-intermedio";
      const textoTipoNivel = esEgreso ? "EGR" : "INT";

      const card = document.createElement("div");
      card.className = `celda-materia-modulo ${estadoFondo}`;
      card.innerHTML = `
        <div class="clave-texto ${claseColorClave}">
          ${mat.clave}
        </div>
        <div class="flex justify-between items-center text-[7.5px] font-bold text-slate-600 px-0.5">
          <span>${mat.hc || 80}H</span>
          <span>${mat.creditos || 8}C</span>
        </div>
        <div class="text-center my-auto px-0.5">
          <span class="text-[8px] font-black uppercase text-slate-800 leading-tight line-clamp-2">
            ${mat.nombre}
          </span>
        </div>
        <div class="flex justify-between items-center pt-0.5 border-t border-black/10 text-[7px] font-extrabold uppercase">
          <span class="${claseTextoPie}">${textoEstadoPie}</span>
          ${textoRequisitoHtml}
          <span class="${esEgreso ? 'text-emerald-600' : 'text-sky-600'} font-bold shrink-0">${textoTipoNivel}</span>
        </div>
      `;
      listaMats.appendChild(card);
    });

    bloque.appendChild(listaMats);
    contenedor.appendChild(bloque);
  });
}

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
        if (/^UA\d_\d$/.test(mat.clave)) {
          const s = resolverMateriaUA(mat.clave);
          if (s) claveCheck = s.clave;
        }
        const info = consultarEstado(claveCheck);
        if (info) {
          if (info.aprobada) {
            aprobadas++;
            creditosTotal += Number(mat.creditos || 0);
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

  const btnHorario = document.getElementById("btn-ver-clases");
  if (btnHorario) {
    if (horarioSemanal && horarioSemanal.length > 0) {
      btnHorario.classList.remove("hidden");
    } else {
      btnHorario.classList.add("hidden");
    }
  }
}

function limpiarDatosAcademicos() {
  const usuario = obtenerClaveUsuario();

  estadoMaterias = {};
  horarioSemanal = [];
  checklistRequisitos = {};
  datosKardex = { 
    situacion: "Sin archivo", 
    admision: "Sin archivo", 
    ultimoCiclo: "Sin archivo" 
  };

  const raw = localStorage.getItem(`academico_data_${usuario}`);
  if (raw) {
    try {
      const data = JSON.parse(raw);
      data.estadoMaterias = {};
      data.horarioClasesSemanal = [];
      data.nombreKardex = "Sin archivo";
      data.nombreHorario = "Sin archivo";
      data.datosKardexEstudiante = { situacion: "Sin archivo", admision: "Sin archivo", ultimoCiclo: "Sin archivo" };
      data.creditosExtraRequisitos = { fi: 0, pp: 0 };
      localStorage.setItem(`academico_data_${usuario}`, JSON.stringify(data));
    } catch (e) {
      localStorage.removeItem(`academico_data_${usuario}`);
    }
  }

  localStorage.removeItem(`checklist_requisitos_${usuario}`);

  renderizarTableroMalla();
  renderizarModulosEspecializacion();
  actualizarBannerMetricas();
  actualizarTextosPerfilUI();

  cerrarModalConfiguracion();
}

// Modales y menús
function toggleMenuPrincipal() {
  const menu = document.getElementById('menuLateralOpciones');
  if (menu) menu.classList.toggle('hidden');
}

function abrirModalHorario() {
  const modal = document.getElementById("modal-horario");
  if (!modal) return;
  renderizarHorarioSemanal();
  modal.classList.remove("hidden");
}

function cerrarModalHorario() {
  const modal = document.getElementById("modal-horario");
  if (modal) modal.classList.add("hidden");
}

function renderizarHorarioSemanal() {
  const container = document.getElementById("grid-dias-horario");
  const elTotal = document.getElementById("total-asignaciones");
  if (!container) return;

  container.innerHTML = "";
  const diasSemana = ["LU", "MA", "MI", "JU", "VI", "SA", "DO"];
  let total = 0;

  diasSemana.forEach(diaKey => {
    const col = document.createElement("div");
    col.className = "flex flex-col gap-2 bg-slate-900/50 p-2 rounded-xl border border-slate-800 min-h-[200px]";

    const header = document.createElement("div");
    header.className = "bg-[#1e293b] text-white font-bold text-center py-1 rounded text-xs";
    header.innerText = diaKey;
    col.appendChild(header);

    const clases = horarioSemanal.filter(c => c.dia === diaKey);
    total += clases.length;

    if (clases.length === 0) {
      const v = document.createElement("div");
      v.className = "text-[10px] text-slate-500 text-center py-4 italic";
      v.innerText = "Libre";
      col.appendChild(v);
    } else {
      clases.forEach(c => {
        const item = document.createElement("div");
        item.className = "bg-white border border-sky-300 rounded-lg p-2 text-left shadow-sm";
        item.innerHTML = `
          <div class="flex justify-between items-center">
            <span class="text-[9px] font-black text-sky-700">${c.clave}</span>
            <span class="text-[8px] bg-sky-100 text-sky-800 px-1 rounded">${c.horario}</span>
          </div>
          <p class="text-[9px] font-bold text-slate-800 truncate mt-1">${c.nombre}</p>
          <p class="text-[8px] text-slate-500 mt-0.5">🏢 ${c.edificio} • 📍 ${c.aula}</p>
        `;
        col.appendChild(item);
      });
    }
    container.appendChild(col);
  });

  if (elTotal) elTotal.innerText = `${total} clases a la semana`;
}

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

function cerrarModalPerfil() {
  const modal = document.getElementById('modal-perfil-usuario');
  if (modal) modal.classList.add('hidden');
}

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

function cerrarModalConfiguracion() {
  const modal = document.getElementById('modal-configuracion');
  if (modal) modal.classList.add('hidden');
}

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

function eliminarFotoPerfil() {
  localStorage.removeItem(`fotoPerfil_${obtenerClaveUsuario()}`);
  cargarFotoPerfilUI();
}

function cerrarSesionUsuario() {
  localStorage.removeItem('usuarioNombre');
  window.location.href = 'index.html';
}

window.onclick = function(e) {
  if (!e.target.closest('#btnMenuPrincipal') && !e.target.closest('#menuLateralOpciones')) {
    const menu = document.getElementById('menuLateralOpciones');
    if (menu && !menu.classList.contains('hidden')) menu.classList.add('hidden');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const usuario = obtenerClaveUsuario();
  const elSaludo = document.getElementById('saludoUsuario');
  if (elSaludo && usuario !== "default") {
    let clean = usuario.includes('@') ? usuario.split('@')[0] : usuario;
    clean = clean.charAt(0).toUpperCase() + clean.slice(1);
    elSaludo.innerText = `Malla Curricular de ${clean}`;
  }

  cargarFotoPerfilUI();
  cargarDatosAcademicos();
  renderizarTableroMalla();
  renderizarModulosEspecializacion();
});