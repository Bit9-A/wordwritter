import { NextRequest, NextResponse } from 'next/server';
import { getRuleById } from '@/lib/rules';
import * as mammoth from 'mammoth';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { PromptTemplate } from '@langchain/core/prompts';
import { 
  documentSchema, 
  preliminaresSchema, 
  capitulo1Schema, 
  capitulo2Schema, 
  capitulo3Schema, 
  capitulo4Schema, 
  extrasSchema 
} from '@/lib/schema';
import { validateDocument } from '@/lib/validator';
import { generateDocument } from '@/lib/docx-generator';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const ruleId = formData.get('ruleId') as string;
    const includeGantt = formData.get('includeGantt') === 'true';
    const generationMode = formData.get('generationMode') as string || 'both';
    const selectedModel = formData.get('model') as string || 'gemini-3-flash-preview';
    const userApiKey = formData.get('apiKey') as string;
    const userPrompt = formData.get('userPrompt') as string || '';
    const language = formData.get('language') as string || 'es';
    const targetChapter = formData.get('targetChapter') as string || 'all';
    const isIsolated = targetChapter !== 'all';

    if (!file || !ruleId) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
    }

    if (!userApiKey) {
      return NextResponse.json({ error: 'La API Key de Gemini es obligatoria para procesar.' }, { status: 400 });
    }

    const rule = getRuleById(ruleId);
    if (!rule) {
      return NextResponse.json({ error: 'Regla no encontrada' }, { status: 404 });
    }

    // 1. Extraer texto del Word
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const { value: text } = await mammoth.extractRawText({ buffer });

    // 2. Configurar IA con esquema dinámico (True Isolation)
    const model = new ChatGoogleGenerativeAI({
      apiKey: userApiKey,
      model: selectedModel, 
    });

    const getSchema = (chapter: string) => {
      switch (chapter) {
        case 'preliminares': return preliminaresSchema;
        case 'cap1': return capitulo1Schema;
        case 'cap2': return capitulo2Schema;
        case 'cap3': return capitulo3Schema;
        case 'cap4': return capitulo4Schema;
        case 'conclusiones': return extrasSchema;
        default: return documentSchema;
      }
    };

    const activeSchema = getSchema(targetChapter);
    const structuredModel = model.withStructuredOutput(activeSchema);

    const promptTemplate = PromptTemplate.fromTemplate(`
       System: Eres un experto en redacción de informes de práctica pre-profesional.
       Reglas específicas: {rulePrompt}
       Instrucciones de modo: {modeInstructions}
       Idioma: {languageInstruction}
       Usuario: {userInstructions}
       
       {isolationInstruction}
       
       A continuación se presenta el contenido del documento borrador del estudiante:
       ---
       {documentText}
       ---
    `);

     const isolationInstruction = isIsolated 
       ? `CRÍTICO (MODO ENFOQUE SECCIÓN): Tu misión es generar CONTENIDO DE ALTA CALIDAD, EXTENSO Y PROFESIONAL exclusivamente para la sección: ${targetChapter}. 
          - No escatimes en detalles ni en la cantidad de palabras para esta sección específica.
          - Tu redacción debe ser rica, técnica y detallada, siguiendo los estándares de un informe de ingeniería.
          - Mantén la coherencia con el resto del borrador proporcionado por el estudiante.
          - Ignora o deja los campos de OTRAS secciones como valores por defecto (ej. strings vacíos o arrays vacíos), para no sobreescribir el trabajo existente de otras partes del documento.`
       : `MODO COMPLETO: Genera el informe completo siguiendo todas las secciones con la máxima calidad, profundidad y extensión posible.`;

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

    const finalModeInstructions = `${modeInstructions}\n\n${ganttInstructions}`;

    const formattedPrompt = await promptTemplate.format({
      rulePrompt: rule.prompt,
      documentText: text,
      modeInstructions: finalModeInstructions,
      userInstructions: userInstructions,
      languageInstruction: languageInstruction,
      isolationInstruction: isolationInstruction
    });

    // 3. Obtener respuesta estructurada de la IA (Capa 2)
    const documentData = await structuredModel.invoke(formattedPrompt);

    // 4. Validar las reglas de negocio (Capa 4) - Solo en modo completo
    if (!isIsolated) {
      const validation = validateDocument(documentData as any, { 
        skipGantt: generationMode === 'word' 
      });
      if (!validation.valid) {
        return NextResponse.json({ error: 'La IA no pudo cumplir con todas las normativas estrictas de validación.', detalles: validation.errors }, { status: 400 });
      }
    }

    // 5. Retornar los datos estructurados para que el cliente decida qué exportar
    return NextResponse.json(documentData);
  } catch (error: any) {
    console.error('Error en el procesamiento:', error);
    return NextResponse.json({ error: 'Error al procesar el documento: ' + error.message }, { status: 500 });
  }
}