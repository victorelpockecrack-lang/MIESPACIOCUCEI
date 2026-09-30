/**
 * PLAN DE ESTUDIOS: INGENIERÍA EN COMPUTACIÓN (ICOM 2021)
 * Universidad de Guadalajara / CUCEI
 */

const PLAN_ESTUDIOS_ICOM_2021 = [
  {
    semestre: "I",
    materias: [
      { clave: "I5288", nombre: "FUNDAMENTOS DE PROGRAMACIÓN", hc: 80, creditos: 8, categoria: "inicial" },
      { clave: "I5247", nombre: "LÓGICA MATEMÁTICA", hc: 80, creditos: 8, categoria: "inicial" },
      { clave: "IG738", nombre: "PRECÁLCULO", hc: 80, creditos: 8, categoria: "inicial" },
      { clave: "IL340", nombre: "FUNDAMENTOS DE FÍSICA", hc: 80, creditos: 8, categoria: "inicial" },
      { clave: "IL342", nombre: "INTRODUCCIÓN A LA INGENIERÍA", hc: 80, creditos: 8, categoria: "inicial" },
      { clave: "IL341", nombre: "ÉTICA Y LEGISLACIÓN", hc: 80, creditos: 8, categoria: "inicial" },
      { clave: "V2455", nombre: "ANÁLISIS DE PROBLEMAS GLOBALES DEL SIGLO XXI", hc: 80, creditos: 0, categoria: "inicial" }
    ]
  },
  {
    semestre: "II",
    materias: [
      { clave: "IL352", nombre: "PROGRAMACIÓN ESTRUCTURADA", hc: 120, creditos: 10, categoria: "inicial" },
      { clave: "IL345", nombre: "MATEMÁTICAS DISCRETAS", hc: 80, creditos: 8, categoria: "inicial" },
      { clave: "IL344", nombre: "CÁLCULO DIFERENCIAL E INTEGRAL", hc: 100, creditos: 9, categoria: "inicial" },
      { clave: "IL343", nombre: "MECÁNICA", hc: 80, creditos: 8, categoria: "inicial" },
      { clave: "IL353", nombre: "ADMINISTRACIÓN DE PROYECTOS TECNOLÓGICOS", hc: 80, creditos: 8, categoria: "inicial" },
      { clave: "LT251", nombre: "EXPRESIÓN ORAL Y ESCRITA", hc: 60, creditos: 6, categoria: "inicial" }
    ]
  },
  {
    semestre: "III",
    materias: [
      { clave: "I5289", nombre: "PROGRAMACIÓN ORIENTADA A OBJETOS", hc: 80, creditos: 8, categoria: "inicial" },
      { clave: "IB056", nombre: "ÁLGEBRA LINEAL", hc: 80, creditos: 8, categoria: "inicial" },
      { clave: "IL347", nombre: "ECUACIONES DIFERENCIALES", hc: 80, creditos: 8, categoria: "inicial" },
      { clave: "IL346", nombre: "CIRCUITOS ELECTRÓNICOS Y ELECTROMAGNETISMO", hc: 80, creditos: 8, categoria: "inicial" },
      { clave: "IL363", nombre: "SISTEMAS DIGITALES", hc: 80, creditos: 8, categoria: "intermedio" },
      { clave: "IL350", nombre: "LIDERAZGO Y EMPRENDIMIENTO", hc: 80, creditos: 7, categoria: "intermedio" }
    ]
  },
  {
    semestre: "IV",
    materias: [
      { clave: "IL354", nombre: "ESTRUCTURA DE DATOS", hc: 120, creditos: 10, categoria: "intermedio" },
      { clave: "IB067", nombre: "PROBABILIDAD Y ESTADÍSTICA", hc: 80, creditos: 8, categoria: "inicial" },
      { clave: "IL348", nombre: "MÉTODOS NUMÉRICOS", hc: 80, creditos: 8, categoria: "inicial" },
      { clave: "IL365", nombre: "ARQUITECTURA DE COMPUTADORAS", hc: 80, creditos: 8, categoria: "intermedio" },
      { clave: "IL361", nombre: "FUNDAMENTOS DE INTELIGENCIA ARTIFICIAL", hc: 80, creditos: 8, categoria: "intermedio" },
      { clave: "IL349", nombre: "ADMINISTRACIÓN", hc: 80, creditos: 8, categoria: "intermedio" }
    ]
  },
  {
    semestre: "V",
    materias: [
      { clave: "IL355", nombre: "ANÁLISIS DE ALGORITMOS", hc: 80, creditos: 8, categoria: "intermedio" },
      { clave: "IL362", nombre: "PROGRAMACIÓN PARA INTERNET", hc: 80, creditos: 7, categoria: "intermedio" },
      { clave: "IL367", nombre: "INTERACCIÓN HUMANO COMPUTADORA", hc: 80, creditos: 8, categoria: "intermedio" },
      { clave: "IL366", nombre: "SISTEMAS OPERATIVOS", hc: 120, creditos: 10, categoria: "intermedio" },
      { clave: "IL364", nombre: "REDES DE COMPUTADORAS", hc: 80, creditos: 8, categoria: "intermedio" },
      { clave: "IL369", nombre: "SEMINARIO DE INTEGRACIÓN: PROTOCOLO", hc: 40, creditos: 4, categoria: "inicial" },
      { clave: "FI", nombre: "FORMACIÓN INTEGRAL", hc: 64, creditos: 4, categoria: "requisito", fila: 7 }
    ]
  },
  {
    semestre: "VI",
    materias: [
      { clave: "IL356", nombre: "BASES DE DATOS", hc: 120, creditos: 10, categoria: "inicial" },
      { clave: "IL351", nombre: "INNOVACIÓN Y TECNOLOGÍA", hc: 80, creditos: 8, categoria: "egreso" },
      { clave: "IL358", nombre: "PROGRAMACIÓN DE BAJO NIVEL", hc: 80, creditos: 8, categoria: "egreso" },
      { clave: "UA1_1", nombre: "UA 1 MÓDULO 1", hc: 80, creditos: 8, categoria: "intermedio" },
      { clave: "UA1_2", nombre: "UA 1 MÓDULO 2", hc: 80, creditos: 8, categoria: "intermedio" },
      { 
        clave: "SS_ING", 
        esCasillaDual: true,
        categoria: "requisito",
        fila: 7,
        subItems: [
          { clave: "SS", nombre: "SERVICIO SOCIAL", hc: "480H", creditos: 0 },
          { clave: "ING_B1", nombre: "ACREDITACIÓN INGLÉS", nota: "NIVEL B1", creditos: 0 }
        ]
      }
    ]
  },
  {
    semestre: "VII",
    materias: [
      { clave: "CB224", nombre: "INGENIERÍA DE SOFTWARE", hc: 80, creditos: 8, categoria: "intermedio" },
      { clave: "IL357", nombre: "TEORÍA DE LA COMPUTACIÓN", hc: 80, creditos: 8, categoria: "intermedio" },
      { clave: "IL372", nombre: "LABORATORIO ABIERTO: DISEÑO", hc: 80, creditos: 7, categoria: "lab" },
      { clave: "IL370", nombre: "SEMINARIO DE INTEGRACIÓN: DESARROLLO", hc: 60, creditos: 6, categoria: "intermedio" },
      { clave: "UA2_1", nombre: "UA 2 MÓDULO 1", hc: 80, creditos: 8, categoria: "intermedio" },
      { clave: "UA2_2", nombre: "UA 2 MÓDULO 2", hc: 80, creditos: 8, categoria: "intermedio" },
      { 
        clave: "PP", 
        nombre: "PRÁCTICAS PROFESIONALES", 
        hc: 300, 
        creditos: 6, 
        categoria: "requisito",
        colspan: 2,
        fila: 7
      }
    ]
  },
    {
    semestre: "VIII",
    materias: [
      { clave: "IL359", nombre: "COMPILADORES", hc: 80, creditos: 8, categoria: "intermedio" },
      { clave: "IL368", nombre: "SEGURIDAD EN LA INFORMACIÓN", hc: 80, creditos: 8, categoria: "egreso" },
      { clave: "IL373", nombre: "LABORATORIO ABIERTO: CONSTRUCCIÓN", hc: 80, creditos: 7, categoria: "lab" },
      { clave: "UA3_1", nombre: "UA 3 MÓDULO 1", hc: 80, creditos: 8, categoria: "egreso" },
      { clave: "UA3_2", nombre: "UA 3 MÓDULO 2", hc: 80, creditos: 8, categoria: "egreso" }
    ]
  },
  {
    semestre: "IX",
    materias: [
      { clave: "IL360", nombre: "PROGRAMACIÓN PARALELA Y CONCURRENTE", hc: 80, creditos: 8, categoria: "egreso" },
      { clave: "IL371", nombre: "SEMINARIO DE INTEGRACIÓN: COMUNICACIÓN", hc: 40, creditos: 4, categoria: "egreso" },
      { clave: "IL374", nombre: "LABORATORIO ABIERTO: PRUEBAS", hc: 80, creditos: 7, categoria: "lab" },
      {
        clave: "PM_EGEL",
        esCasillaDual: true,
        categoria: "requisito",
        fila: 7,
        subItems: [
          { clave: "PROY_MOD", nombre: "PROYECTO MODULAR", prerrequisito: "SEMINARIOS" },
          { clave: "EGEL", nombre: "CAPACITACIÓN EGEL", prerrequisito: "90_CREDITOS" }
        ]
      }
    ]
  }
];

// MÓDULOS DE ESPECIALIZACIÓN (1 y 2 intermedio, 3 egreso)
const MODULOS_ESPECIALIZACION = [
  {
    titulo: "MÓDULO 1. REDES",
    materias: [
      { clave: "IL378", nombre: "ADMINISTRACIÓN DE REDES", creditos: 8, hc: 80, categoria: "intermedio" },
      { clave: "IL379", nombre: "PROGRAMACIÓN DE APLICACIONES DE REDES", creditos: 8, hc: 80, categoria: "intermedio" },
      { clave: "IL380", nombre: "INTERCONEXIÓN DE REDES", creditos: 8, hc: 80, categoria: "egreso" }
    ]
  },
  {
    titulo: "MÓDULO 2. SOFTWARE DE SISTEMAS",
    materias: [
      { clave: "IL375", nombre: "PROGRAMACIÓN PARALELA Y EN TIEMPO REAL", creditos: 8, hc: 80, categoria: "intermedio" },
      { clave: "IL376", nombre: "PROGRAMACIÓN DE SISTEMAS EMBEBIDOS", creditos: 8, hc: 80, categoria: "intermedio" },
      { clave: "IL377", nombre: "PROGRAMACIÓN DE SISTEMAS AVANZADOS", creditos: 8, hc: 80, categoria: "egreso" }
    ]
  },
  {
    titulo: "MÓDULO 3. SISTEMAS INTELIGENTES",
    materias: [
      { clave: "IL381", nombre: "APRENDIZAJE MÁQUINA", creditos: 8, hc: 80, categoria: "intermedio" },
      { clave: "IL382", nombre: "ALGORITMOS METAHEURÍSTICOS", creditos: 8, hc: 80, categoria: "intermedio" },
      { clave: "IL383", nombre: "REDES NEURONALES ARTIFICIALES Y APRENDIZAJE PROFUNDO", creditos: 8, hc: 80, categoria: "egreso" }
    ]
  },
  {
    titulo: "MÓDULO 4. DESARROLLO DE VIDEOJUEGOS",
    materias: [
      { clave: "IL384", nombre: "DISEÑO DE VIDEOJUEGOS", creditos: 8, hc: 80, categoria: "intermedio" },
      { clave: "IL385", nombre: "PROGRAMACIÓN DE GRÁFICOS 3D", creditos: 8, hc: 80, categoria: "intermedio" },
      { clave: "IL386", nombre: "VIDEOJUEGOS EN RED", creditos: 8, hc: 80, categoria: "egreso" }
    ]
  },
  {
    titulo: "MÓDULO 5. TEMAS EMERGENTES",
    materias: [
      { clave: "IL390", nombre: "SELECTIVA I", creditos: 8, hc: 80, categoria: "intermedio" },
      { clave: "IL391", nombre: "SELECTIVA II", creditos: 8, hc: 80, categoria: "intermedio" },
      { clave: "IL392", nombre: "SELECTIVA III", creditos: 8, hc: 80, categoria: "egreso" }
    ]
  }
];

// MAPA OFICIAL DE PRERREQUISITOS SEGÚN CATÁLOGO SIIAU / CUCEI
const PRERREQUISITOS_ICOM_2021 = {
  // Tronco común obligatorio
  "IL352": ["I5288"],  // Progr. Estructurada <- Fund. de Progr.
  "I5289": ["I5288"],  // POO <- Fund. de Progr.
  "IL355": ["IL354"],  // Análisis de Algoritmos <- Estructuras de Datos
  "IL359": ["IL357"],  // Compiladores <- Teoría de la Computación
  "IL365": ["IL363"],  // Arq. de Computadoras <- Sistemas Digitales
  "IL344": ["IG738"],  // Cálculo Dif. e Int. <- Precálculo
  "IL347": ["IL344"],  // Ecuaciones Dif. <- Cálculo Dif. e Int.
  "IL348": ["IL347"],  // Métodos Numéricos <- Ecuaciones Dif.
  "IL345": ["I5247"],  // Mat. Discretas <- Lógica Matemática
  "IL343": ["IL340"],  // Mecánica <- Fund. de Física

  // SERIACIÓN INTERNA DE LOS 5 MÓDULOS (1ª libre, 2ª requiere 1ª, 3ª requiere 2ª)
  "IL379": ["IL378"],
  "IL380": ["IL379"],

  "IL376": ["IL375"],
  "IL377": ["IL376"],

  "IL382": ["IL381"],
  "IL383": ["IL382"],

  "IL385": ["IL384"],
  "IL386": ["IL385"],

  "IL391": ["IL390"],
  "IL392": ["IL391"]
};

// DISTRIBUCIÓN DE FILAS (0 A 6) EN EL TABLERO DE 7x9
const FILAS_MALLA_ICOM_2021 = {
  0: [0, 1, 2, 3, 4, 5, 6],    // Semestre I: filas 1 a 7 (todas ocupadas)
  1: [0, 1, 2, 3, 4, 5],       // Semestre II: filas 1 a 6 (fila 7 vacía)
  2: [0, 1, 2, 3, 4, 5],       // Semestre III: filas 1 a 6 (fila 7 vacía)
  3: [0, 1, 2, 3, 4, 5],       // Semestre IV: filas 1 a 6 (fila 7 vacía)
  4: [0, 1, 2, 3, 4, 5, 6],    // Semestre V: filas 1 a 6 + FI en fila 7
  5: [0, 1, 2, 4, 5, 6],       // Semestre VI: fila 4 vacía, UA1_1 en 5, UA1_2 en 6, SS en 7
  6: [0, 1, 2, 3, 4, 5, 6],    // Semestre VII: CB224(1), IL357(2), IL372(3), IL370(4), UA2_1(5), UA2_2(6), PP(7)
  7: [0, 1, 2, 4, 5],          // Semestre VIII: IL359(1), IL368(2), IL373(3), UA3_1(5), UA3_2(6) (filas 4 y 7 vacías)
  8: [0, 1, 2, 6]              // Semestre IX: IL360(1), IL371(2), IL374(3), PM_EGEL(7) (filas 4, 5 y 6 vacías)
};

// Función auxiliar global para consultar prerrequisitos
function verificarCumplimientoPrerrequisitos(clave, funcionConsultaEstado) {
  const reqs = PRERREQUISITOS_ICOM_2021[clave];
  if (!reqs || reqs.length === 0) return true;
  return reqs.every(claveReq => {
    const estado = funcionConsultaEstado(claveReq);
    return estado && estado.aprobada;
  });
}