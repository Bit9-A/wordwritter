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
      // We define the schema manually or use a subset for better reliability
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          portada: {
            type: SchemaType.OBJECT,
            properties: {
              titulo: { type: SchemaType.STRING },
              nombres: { type: SchemaType.STRING },
              apellidos: { type: SchemaType.STRING },
              empresa: { type: SchemaType.STRING },
              ciudad: { type: SchemaType.STRING },
              mes: { type: SchemaType.STRING },
              anio: { type: SchemaType.STRING },
            },
            required: ["titulo", "nombres", "apellidos", "empresa", "ciudad", "mes", "anio"],
          },
          introduccion: { type: SchemaType.STRING },
          capitulo1: {
            type: SchemaType.OBJECT,
            properties: {
              secciones: {
                type: SchemaType.ARRAY,
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    titulo: { type: SchemaType.STRING },
                    contenido: { type: SchemaType.STRING },
                  },
                  required: ["titulo", "contenido"],
                }
              }
            },
            required: ["secciones"],
          },
          capitulo2: {
            type: SchemaType.OBJECT,
            properties: {
              secciones: {
                type: SchemaType.ARRAY,
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    titulo: { type: SchemaType.STRING },
                    contenido: { type: SchemaType.STRING },
                  },
                  required: ["titulo", "contenido"],
                }
              }
            },
            required: ["secciones"],
          },
          capitulo3: {
            type: SchemaType.OBJECT,
            properties: {
              secciones: {
                type: SchemaType.ARRAY,
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    titulo: { type: SchemaType.STRING },
                    contenido: { type: SchemaType.STRING },
                  },
                  required: ["titulo", "contenido"],
                }
              }
            },
            required: ["secciones"],
          },
          capitulo4: {
            type: SchemaType.OBJECT,
            properties: {
              secciones: {
                type: SchemaType.ARRAY,
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    titulo: { type: SchemaType.STRING },
                    contenido: { type: SchemaType.STRING },
                  },
                  required: ["titulo", "contenido"],
                }
              }
            },
            required: ["secciones"],
          },
          conclusiones: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          recomendaciones: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
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
          diagramaGanttData: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                id: { type: SchemaType.STRING },
                titulo: { type: SchemaType.STRING },
                actividades: {
                  type: SchemaType.ARRAY,
                  items: {
                    type: SchemaType.OBJECT,
                    properties: {
                      id: { type: SchemaType.STRING },
                      titulo: { type: SchemaType.STRING },
                      tareas: {
                        type: SchemaType.ARRAY,
                        items: {
                          type: SchemaType.OBJECT,
                          properties: {
                            id: { type: SchemaType.STRING },
                            titulo: { type: SchemaType.STRING },
                            semanas: { type: SchemaType.ARRAY, items: { type: SchemaType.NUMBER } },
                          },
                          required: ["id", "titulo", "semanas"],
                        }
                      }
                    },
                    required: ["id", "titulo", "tareas"],
                  }
                }
              },
              required: ["id", "titulo", "actividades"],
            }
          },
        },
        required: [
          "portada", "introduccion", "capitulo1", "capitulo2", "capitulo3",
          "capitulo4", "conclusiones", "recomendaciones", "glosario", "bibliografia",
          "diagramaGanttData"
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
    Tu objetivo es redactar, estructurar y corregir informes de pasantías basándote en normativas institucionales.

    REGLAS DE CONTENIDO:
    1. INTRODUCCIÓN: Redacción técnica de mín. 300 palabras.
    2. ENTORNOS: Mejora el texto siguiendo numeración exacta (1.1, 1.2...).
    3. GLOSARIO: Ordenado alfabéticamente.
    4. BIBLIOGRAFÍA: Formato APA estricto.
    5. EVIDENCIAS: Referencia obligatoria a "Anexo X" en la sección 3.2.

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
