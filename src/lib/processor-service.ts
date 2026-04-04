import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import * as mammoth from 'mammoth';
import { INTERNSHIP_GUIDELINES } from '@/config/internship-guidelines';
import type { ProcessedDocumentData, TargetChapter, GenerationMode } from '@/types/dashboard';
import type { RevisionRule } from '@/lib/rules';

/**
 * Processor Service — Client-side logic for document generation.
 * This replaces the /api/process route for Tauri compatibility.
 */

export async function processDocumentLocally(
  file: File,
  rule: RevisionRule,
  config: {
    apiKey: string;
    model: string;
    generationMode: GenerationMode;
    userPrompt: string;
    language: string;
    targetChapter: TargetChapter;
  }
): Promise<ProcessedDocumentData> {
  const { apiKey, model, generationMode, userPrompt, language, targetChapter } = config;

  // 1. Extract text from Word (mammoth works in browser)
  const arrayBuffer = await file.arrayBuffer();
  const { value: text } = await mammoth.extractRawText({ arrayBuffer });

  // 2. Initialize Gemini
  const genAI = new GoogleGenerativeAI(apiKey);
  const aiModel = genAI.getGenerativeModel({ 
    model,
    generationConfig: {
      responseMimeType: "application/json",
      maxOutputTokens: 8192,
      temperature: 0.7,
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          portada: {
            type: SchemaType.OBJECT,
            properties: {
              tituloProyecto: { type: SchemaType.STRING },
              nombres: { type: SchemaType.STRING },
              apellidos: { type: SchemaType.STRING },
              cedula: { type: SchemaType.STRING },
              institucion: { type: SchemaType.STRING },
              ciudad: { type: SchemaType.STRING },
              fechaMes: { type: SchemaType.STRING },
              fechaAno: { type: SchemaType.STRING },
            },
            required: ["tituloProyecto", "nombres", "apellidos", "cedula", "institucion", "ciudad", "fechaMes", "fechaAno"],
          },
          actasEvaluacion: {
            type: SchemaType.OBJECT,
            properties: {
              actaInstitucional: { type: SchemaType.STRING },
              actaAcademica: { type: SchemaType.STRING },
              actaEvaluador: { type: SchemaType.STRING },
            },
            required: ["actaInstitucional", "actaAcademica", "actaEvaluador"],
          },
          introduccion: { type: SchemaType.STRING },
          capitulo1: {
            type: SchemaType.OBJECT,
            properties: {
              ubicacionGeografica: { type: SchemaType.STRING },
              resenaHistorica: { type: SchemaType.STRING },
              mision: { type: SchemaType.STRING },
              vision: { type: SchemaType.STRING },
              valores: { type: SchemaType.STRING },
              objetivosInstitucion: {
                type: SchemaType.OBJECT,
                properties: {
                  general: { type: SchemaType.STRING },
                  especificos: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                },
                required: ["general", "especificos"],
              },
              estructuraOrganizativa: { type: SchemaType.STRING },
              descripcionDepartamento: { type: SchemaType.STRING },
              nombreJefe: { type: SchemaType.STRING },
              funcionesDepartamento: { type: SchemaType.STRING },
            },
            required: ["ubicacionGeografica", "resenaHistorica", "mision", "vision", "valores", "objetivosInstitucion", "estructuraOrganizativa", "descripcionDepartamento", "nombreJefe", "funcionesDepartamento"],
          },
          capitulo2: {
            type: SchemaType.OBJECT,
            properties: {
              tituloProyecto: { type: SchemaType.STRING },
              planteamientoProblema: { type: SchemaType.STRING },
              objetivos: {
                type: SchemaType.OBJECT,
                properties: {
                  general: { type: SchemaType.STRING },
                  especificos: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                },
                required: ["general", "especificos"],
              },
              justificacion: { type: SchemaType.STRING },
              alcance: { type: SchemaType.STRING },
              limitaciones: { type: SchemaType.STRING },
            },
            required: ["tituloProyecto", "planteamientoProblema", "objetivos", "justificacion", "alcance", "limitaciones"],
          },
          capitulo3: {
            type: SchemaType.OBJECT,
            properties: {
              diagramaGanttText: { type: SchemaType.STRING },
              diagramaGanttData: {
                type: SchemaType.ARRAY,
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    objetivo: { type: SchemaType.STRING },
                    actividades: {
                      type: SchemaType.ARRAY,
                      items: {
                        type: SchemaType.OBJECT,
                        properties: {
                          descripcion: { type: SchemaType.STRING },
                          tareas: {
                            type: SchemaType.ARRAY,
                            items: {
                              type: SchemaType.OBJECT,
                              properties: {
                                descripcion: { type: SchemaType.STRING },
                                semanas: { type: SchemaType.ARRAY, items: { type: SchemaType.NUMBER } },
                              },
                              required: ["descripcion", "semanas"],
                            }
                          }
                        },
                        required: ["descripcion", "tareas"],
                      }
                    }
                  },
                  required: ["objetivo", "actividades"],
                }
              },
              descripcionActividadesSemanas: {
                type: SchemaType.ARRAY,
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    semana: { type: SchemaType.STRING },
                    descripcion: { type: SchemaType.STRING },
                  },
                  required: ["semana", "descripcion"],
                }
              },
              logrosActividades: { type: SchemaType.STRING },
            },
            required: ["diagramaGanttText", "diagramaGanttData", "descripcionActividadesSemanas", "logrosActividades"],
          },
          capitulo4: {
            type: SchemaType.OBJECT,
            properties: {
              conocimientosAdquiridos: { type: SchemaType.STRING },
            },
            required: ["conocimientosAdquiridos"],
          },
          conclusiones: { type: SchemaType.STRING },
          recomendaciones: {
            type: SchemaType.OBJECT,
            properties: {
              universidad: { type: SchemaType.STRING },
              institucion: { type: SchemaType.STRING },
              nuevosPasantes: { type: SchemaType.STRING },
            },
            required: ["universidad", "institucion", "nuevosPasantes"],
          },
          glosario: { 
            type: SchemaType.ARRAY, 
            items: { 
              type: SchemaType.OBJECT,
              properties: {
                termino: { type: SchemaType.STRING },
                definicion: { type: SchemaType.STRING },
              },
              required: ["termino", "definicion"],
            } 
          },
          bibliografia: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          anexosText: { type: SchemaType.STRING },
        },
        required: [
          "portada", "actasEvaluacion", "introduccion", "capitulo1", "capitulo2", "capitulo3",
          "capitulo4", "conclusiones", "recomendaciones", "glosario", "bibliografia", "anexosText"
        ],
      }
    }
  });

  const languageInstruction = language === 'en'
    ? `CRITICAL: The entire output MUST be in ENGLISH.`
    : `CRÍTICO: Todo el resultado DEBE estar en ESPAÑOL.`;

  const userInstructions = userPrompt 
    ? `INSTRUCCIONES ESPECÍFICAS DEL USUARIO (Prioridad Alta): ${userPrompt}`
    : "";

  let modeInstructions = "";
  if (generationMode === 'word') {
    modeInstructions = `ENFOQUE: Solo Informe Word. Ignora la sección de cronograma. Deja diagramaGanttData como un array vacío.`;
  } else if (generationMode === 'gantt') {
    modeInstructions = `ENFOQUE: Solo Diagrama de Gantt. Prioridad absoluta es la estructura de 3 niveles para el cronograma.`;
  } else {
    modeInstructions = `ENFOQUE: Completo (Word + Gantt).`;
  }

  const ganttInstructions = (generationMode !== 'word')
    ? `Para la sección de Cronograma:
       - Estructura en 3 Niveles: Objetivo Específico -> Actividad -> Tarea.
       - Cada Objetivo Específico = 3 Actividades.
       - Cada Actividad = 3 Tareas operativas.
       - Distribuye las tareas en 14 semanas.`
    : "";

  let targetChapterInstructions = "";
  if (targetChapter !== 'all') {
    const chapterMap: Record<string, string> = {
      'preliminares': 'las Páginas Preliminares (Portada, Actas, Dedicatoria, Introducción)',
      'cap1': 'el Capítulo I (La Empresa)',
      'cap2': 'el Capítulo II (El Problema)',
      'cap3': 'el Capítulo III (La Solución / Cronograma)',
      'cap4': 'el Capítulo IV (Conocimientos Adquiridos)',
      'conclusiones': 'las Conclusiones, Recomendaciones, Glosario y Bibliografía',
    };
    const chapterName = chapterMap[targetChapter] || targetChapter;
    targetChapterInstructions = `
      INSTRUCCIÓN CRÍTICA DE AISLAMIENTO:
      El usuario solicita ENFOCARSE EXCLUSIVAMENTE en **${chapterName}**.
      - SOLO modifica/mejora el contenido de **${chapterName}**.
      - Para el resto de capítulos, COPIA FIELMENTE el texto del borrador sin alterar absolutamente nada.
    `;
  }

  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleString(language === 'en' ? 'en-US' : 'es-ES', { month: 'long' });
  const currentYear = currentDate.getFullYear();
  const currentDateInfo = `INFORMACIÓN TEMPORAL: Año ${currentYear}, Mes ${currentMonth}.`;

  const prompt = `
    Actúa como un tutor académico experto y redactor de Informes de Práctica Profesional de Alto Nivel.
    Tu objetivo es redactar un informe EXHAUSTIVO, EXTENSO y con MÁXIMO DETALLE TÉCNICO. 
    El documento final debe ser comparable a un trabajo especial de grado en profundidad.

    REGLAS DE EXTENSIÓN Y DETALLE (CRÍTICO):
    1. VERBOSIDAD: No resumas. Explica cada concepto, proceso y herramienta con total detalle.
    2. INTRODUCCIÓN: Redacción académica profunda de MÍNIMO 600-1000 palabras.
    3. CAPÍTULO 1 (LA EMPRESA): Describe la historia, misión, visión y valores de forma enciclopédica y densa.
    4. CAPÍTULO 2 (EL PROBLEMA): El planteamiento debe ser extenso (mín. 4-6 párrafos antes de las causas/consecuencias).
    5. CAPÍTULO 3 (LA SOLUCIÓN): Detalla cada paso técnico, diagrama y metodología. Explica la arquitectura y flujos de datos.
    6. CAPÍTULO 4 (CONOCIMIENTOS): No escatimes en detalles sobre el aprendizaje técnico y profesional logrado.
    7. GLOSARIO: Definiciones técnicas completas y detalladas.
    8. BIBLIOGRAFÍA: Formato APA estricto.
    9. EVIDENCIAS: Referencia obligatoria a "Anexo X" en la sección de actividades.

    REQUERIMIENTOS INSTITUCIONALES:
    ${INTERNSHIP_GUIDELINES}

    ${currentDateInfo}
    ${languageInstruction}
    ${userInstructions}
    ${modeInstructions}
    ${ganttInstructions}
    ${targetChapterInstructions}
    ${rule.prompt}

    A continuación el contenido del documento borrador del estudiante:
    ---
    ${text}
    ---
  `;

  const result = await aiModel.generateContent(prompt);
  const response = await result.response;
  return JSON.parse(response.text()) as ProcessedDocumentData;
}
