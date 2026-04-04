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
    onProgress?: (msg: string) => void;
  }
): Promise<ProcessedDocumentData> {
  const { apiKey, model, generationMode, userPrompt, language, targetChapter, onProgress } = config;

  // 1. Extract text from Word (mammoth works in browser)
  const arrayBuffer = await file.arrayBuffer();
  const { value: text } = await mammoth.extractRawText({ arrayBuffer });

  // 2. Initialize Gemini
  const genAI = new GoogleGenerativeAI(apiKey);
  const aiModel = genAI.getGenerativeModel({ 
    model,
    generationConfig: {
      responseMimeType: "application/json",
      maxOutputTokens: 16384, // Aumentado para soportar documentos largos
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
    ? `CRITICAL: The entire output MUST be in ENGLISH. This includes but is not limited to: Preliminary pages, Introductions, Chapters, Glossary, Bibliography, and the Gantt Chart (Objectives, Activities, Tasks).`
    : `CRÍTICO: Todo el resultado DEBE estar en ESPAÑOL. Esto incluye pero no se limita a: Páginas preliminares, Introducción, Capítulos, Glosario, Bibliografía y el Diagrama de Gantt (Objetivos, Actividades, Tareas).`;

  const userInstructions = userPrompt 
    ? `INSTRUCCIONES ESPECÍFICAS DEL USUARIO (Prioridad Alta): ${userPrompt}`
    : "";

  let modeInstructions = "";
  if (generationMode === 'word') {
    modeInstructions = `ENFOQUE: Solo Informe Word. Ignora la sección de cronograma. Deja diagramaGanttData como un array vacío.`;
  } else if (generationMode === 'gantt') {
    modeInstructions = `ENFOQUE: Solo Diagrama de Gantt. Aunque debes llenar la estructura del documento, tu prioridad absoluta es extraer y proponer una estructura perfecta de 3 niveles para el cronograma (Objetivo -> Actividad -> Tarea).`;
  } else {
    modeInstructions = `ENFOQUE: Completo (Word + Gantt). Procesa el informe y genera la estructura de 3 niveles para el cronograma.`;
  }

  const ganttInstructions = (generationMode !== 'word')
    ? `Para la sección de Cronograma (Capítulo 3):
       - DEBES estructurar la respuesta en exactamente 3 Niveles: Objetivo Específico -> Actividad -> Tarea.
       - Para cada Objetivo Específico encontrado, DEBES proponer exactamente 3 Actividades de alto nivel.
       - Por cada una de esas Actividades, DEBES proponer exactamente 3 Tareas operativas detalladas.
       - Distribuye las tareas lógicamente a lo largo de 14 semanas.`
    : "";

  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleString(language === 'en' ? 'en-US' : 'es-ES', { month: 'long' });
  const currentYear = currentDate.getFullYear();
  const currentDateInfo = `INFORMACIÓN TEMPORAL: El año actual es ${currentYear} y el mes actual es ${currentMonth}. Usa estos valores cada vez que debas colocar fechas actuales para el documento.`;

  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  async function generateChapterLocally(chap: TargetChapter, retries = 2): Promise<ProcessedDocumentData> {
    let targetChapterInstructions = "";
    if (chap !== 'all') {
      const chapterMap: Record<string, string> = {
        'preliminares': 'las Páginas Preliminares (Portada, Actas, Dedicatoria, Introducción)',
        'cap1': 'el Capítulo I (La Empresa)',
        'cap2': 'el Capítulo II (El Problema)',
        'cap3': 'el Capítulo III (La Solución / Cronograma)',
        'cap4': 'el Capítulo IV (Conocimientos Adquiridos)',
        'conclusiones': 'las Conclusiones, Recomendaciones, Glosario y Bibliografía',
      };
      
      const chapterName = chapterMap[chap] || chap;
      targetChapterInstructions = `
      INSTRUCCIÓN CRÍTICA DE AISLAMIENTO:
      El usuario ha solicitado ENFOCARSE EXCLUSIVAMENTE en **${chapterName}**.
      - SOLO puedes modificar, mejorar, generar o alterar el texto correspondiente a **${chapterName}**.
      - Para TODAS LAS DEMÁS SECCIONES y capítulos, debes copiar fielmente el texto proveído por el usuario como SOLO LECTURA sin alterar absolutamente nada, excepto si necesitas llenar una estructura obligatoria vacía (en cuyo caso pon "No provisto").
      `;
    }

    const prompt = `
    Actúa como un tutor académico experto y redactor de Informes de Práctica Profesional. Tu único objetivo es redactar, estructurar y corregir informes de pasantías basándote estrictamente en las normativas proporcionadas.
    Adaptarás el contenido a cualquier carrera y tema, manteniendo un tono formal, técnico y en tercera persona.

    REGLAS DE CONTENIDO Y ESTRUCTURA:
    1. PÁGINAS PRELIMINARES: Genera contenido para Portada, Actas de Evaluación (Institucional, Académico, Evaluador), Dedicatoria e Introducción.
    2. INTRODUCCIÓN: Debe ser una redacción técnica y fluida que presente el proyecto (mínimo 300 palabras).
    3. CAPÍTULO I a IV: Procesa y mejora el texto del estudiante siguiendo la numeración exacta (1.1, 1.2... 2.1... 3.1... 4.1).
    4. GLOSARIO: Ordenado ALFABÉTICAMENTE de forma obligatoria.
    5. BIBLIOGRAFÍA: Formato APA, con sangría francesa (simulada en el texto) y espacio de 1.5cm entre citas.
    6. EVIDENCIAS: En la sección 3.2, es obligatorio referenciar "Anexo 1", "Anexo 2", etc.

    ORIENTACIÓN DE ESTILO:
    - Tono formal y técnico.
    - Evita repeticiones.
    - Si falta información (como misión, visión o coordenadas), GENERA información coherente con el tipo de empresa mencionado.
    
    ${INTERNSHIP_GUIDELINES}

    ${currentDateInfo}

    ${languageInstruction}
    ${userInstructions}
    ${modeInstructions}
    ${ganttInstructions}
    ${targetChapterInstructions}

    Instrucciones adicionales de estilo:
    ${rule.prompt}

    A continuación se presenta el contenido del documento borrador del estudiante:
    ---
    ${text}
    ---
  `;

    try {
      const result = await aiModel.generateContent(prompt);
      const response = await result.response;
      const rawText = response.text();

      try {
        const cleanedJson = extractJsonFromText(rawText);
        return JSON.parse(cleanedJson) as ProcessedDocumentData;
      } catch (e: any) {
        console.warn("⚠️ [Auto-Heal] JSON truncado por la IA. Iniciando reparación automática de emergencia...", e.message);
        
        try {
          const repairedJson = repairTruncatedJson(extractJsonFromText(rawText));
          const finalJson = JSON.parse(repairedJson) as ProcessedDocumentData;
          console.warn("✅ [Auto-Heal] ¡Reparación de JSON exitosa! Salvando los datos generados.");
          return finalJson;
        } catch (repairError) {
          console.error("Automated JSON repair failed.");
        }

        if (e.message.includes("Unterminated string") || e.message.includes("Unexpected end of JSON input") || rawText.length > 15000) {
          throw new Error("El documento es demasiado extenso para ser procesado de una vez. Por favor, intenta procesarlo seleccionando un 'Capítulo Específico' en lugar de 'Todo el Documento'.");
        }
        throw new Error("La respuesta de la IA llegó con problemas de formato JSON. Intenta de nuevo.");
      }
    } catch (apiError: any) {
      if (apiError.message?.includes("503") || apiError.message?.includes("429") || apiError.message?.toLowerCase().includes("overloaded") || apiError.message?.toLowerCase().includes("quota")) {
        if (retries > 0) {
          onProgress?.(`Mucha demanda detectada. Reintentando automáticamente en 10s...`);
          await delay(10000); // 10 segundos antes del reintento de emergencia
          return await generateChapterLocally(chap, retries - 1);
        } else {
          console.warn(`[API] Se agotaron los reintentos para ${chap}. Rellenando con datos vacíos.`);
          return {} as ProcessedDocumentData;
        }
      }
      throw apiError;
    }
  }

  if (targetChapter === 'all') {
    onProgress?.("Iniciando procesamiento fase por fase...");
    // Sequential generation
    const chapters: TargetChapter[] = ['preliminares', 'cap1', 'cap2', 'cap3', 'cap4', 'conclusiones'];
    const mergedData: Partial<ProcessedDocumentData> = {};

    // Si es solo "gantt", no hace falta generar todos los de word, ahorramos créditos.
    const partsToProcess = generationMode === 'gantt' ? ['cap3'] as TargetChapter[] : chapters;

    for (let i = 0; i < partsToProcess.length; i++) {
      const chap = partsToProcess[i];
      if (i > 0) {
        onProgress?.(`Enfriando API pacíficamente (Evitando sanción por Google)... `);
        await delay(6000); // 6 segundos naturales entre llamadas masivas
      }
      onProgress?.(`Generando: ${chap}... (Esto tardará unos segundos)`);
      
      const partialData = await generateChapterLocally(chap);
      
      if (chap === 'preliminares') {
        mergedData.portada = partialData.portada;
        mergedData.actasEvaluacion = partialData.actasEvaluacion;
        mergedData.introduccion = partialData.introduccion;
      } else if (chap === 'cap1') {
        mergedData.capitulo1 = partialData.capitulo1;
      } else if (chap === 'cap2') {
        mergedData.capitulo2 = partialData.capitulo2;
      } else if (chap === 'cap3') {
        mergedData.capitulo3 = partialData.capitulo3;
      } else if (chap === 'cap4') {
        mergedData.capitulo4 = partialData.capitulo4;
      } else if (chap === 'conclusiones') {
        mergedData.conclusiones = partialData.conclusiones;
        mergedData.recomendaciones = partialData.recomendaciones;
        mergedData.glosario = partialData.glosario;
        mergedData.bibliografia = partialData.bibliografia;
        mergedData.anexosText = partialData.anexosText;
      }
    }
    
    // Si algo faltó llenar en gantt mode (portada, etc), lo agregamos dummy
    if (generationMode === 'gantt' && !mergedData.portada) {
      const dummy = await generateChapterLocally('preliminares'); // Solo para satisfacer TS/Schema superficialmente
      mergedData.portada = dummy.portada;
      mergedData.actasEvaluacion = dummy.actasEvaluacion;
      mergedData.introduccion = dummy.introduccion;
      //... otras propiedades dummy no críticas
    }

    onProgress?.("¡Ensamblaje del documento masivo completado!");
    return mergedData as ProcessedDocumentData;
  } else {
    onProgress?.(`Procesando capítulo específico: ${targetChapter}...`);
    return await generateChapterLocally(targetChapter);
  }
}

/**
 * Robustly extracts JSON from a string without cutting off truncated code.
 */
function extractJsonFromText(text: string): string {
  let candidate = text.trim();
  
  // Eliminar bloques markdown si existen
  const jsonMatch = candidate.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    candidate = jsonMatch[1].trim();
  } else if (candidate.startsWith("```")) {
    // Puede que tenga el bloque abierto y se truncó antes de cerrarlo
    candidate = candidate.replace(/^```(?:json)?\s*/, '').trim();
  }
  
  // NO usamos lastIndexOf('}') porque si el string está truncado, 
  // destruiremos toda la información valiosa generada hasta ese punto.
  return candidate;
}

/**
 * Intelligent JSON repair for truncated responses (closes open strings and brackets safely).
 */
function repairTruncatedJson(json: string): string {
  let inString = false;
  let escapeNext = false;
  const stack: ('{' | '[')[] = [];
  
  // Lexer: recorremos el JSON carácter por carácter para ignorar estructuras dentro de strings
  for (let i = 0; i < json.length; i++) {
    const char = json[i];
    
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      escapeNext = true;
      continue;
    }
    
    if (char === '"') {
      inString = !inString;
      continue;
    }
    
    if (!inString) {
      if (char === '{') stack.push('{');
      else if (char === '[') stack.push('[');
      else if (char === '}') stack.pop();
      else if (char === ']') stack.pop();
    }
  }
  
  let repaired = json;
  
  // 1. Si la cadena de texto quedó a medias, la cerramos
  if (inString) {
    repaired += '"';
  }
  
  // 2. Limpiamos caracteres colgantes (comas, dos puntos)
  repaired = repaired.trim();
  if (repaired.endsWith(',')) {
    repaired = repaired.slice(0, -1);
  } else if (repaired.endsWith(':')) {
    repaired += 'null'; // Agregamos un valor nulo para que sea un objeto/campo válido
  }
  
  // 3. Cerramos todas las estructuras apiladas, en estricto orden LIFO
  while (stack.length > 0) {
    const bracket = stack.pop();
    repaired += bracket === '{' ? '}' : ']';
  }
  
  return repaired;
}
