import { NextRequest, NextResponse } from 'next/server';
import { getRuleById } from '@/lib/rules';
import * as mammoth from 'mammoth';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { PromptTemplate } from '@langchain/core/prompts';
import { documentSchema, preliminaresSchema, capitulo1Schema, capitulo2Schema, capitulo3Schema, capitulo4Schema, conclusionesSchema } from '@/lib/schema';
import { validateDocument } from '@/lib/validator';
import { generateDocument } from '@/lib/docx-generator';
import { INTERNSHIP_GUIDELINES } from '@/config/internship-guidelines';

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

    // 2. Configurar IA (Capa 3 y estructurado Capa 2)
    const model = new ChatGoogleGenerativeAI({
      apiKey: userApiKey,
      model: selectedModel, 
    });

    let activeSchema: any = documentSchema;
    if (targetChapter === 'preliminares') activeSchema = preliminaresSchema;
    else if (targetChapter === 'cap1') activeSchema = capitulo1Schema;
    else if (targetChapter === 'cap2') activeSchema = capitulo2Schema;
    else if (targetChapter === 'cap3') activeSchema = capitulo3Schema;
    else if (targetChapter === 'cap4') activeSchema = capitulo4Schema;
    else if (targetChapter === 'conclusiones') activeSchema = conclusionesSchema;

    const structuredModel = model.withStructuredOutput(activeSchema);

    const promptTemplate = PromptTemplate.fromTemplate(`
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
      
      {internshipGuidelines}

      {currentDateInfo}

      {languageInstruction}
      {userInstructions}
      {modeInstructions}
      {targetChapterInstructions}
 
      Instrucciones adicionales de estilo:
      {rulePrompt}
 
      A continuación se presenta el contenido del documento borrador del estudiante:
      ---
      {documentText}
      ---
    `);

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
      El usuario ha solicitado ENFOCARSE EXCLUSIVAMENTE en **${chapterName}**.
      - SOLO debes estructurar y devolver datos para **${chapterName}**.
      - Ignora completamente cualquier otra sección del documento. Solo genera la estructura de la sección solicitada.
      `;
    }

    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleString(language === 'en' ? 'en-US' : 'es-ES', { month: 'long' });
    const currentYear = currentDate.getFullYear();
    const currentDateInfo = `INFORMACIÓN TEMPORAL: El año actual es ${currentYear} y el mes actual es ${currentMonth}. Usa estos valores cada vez que debas colocar fechas actuales para el documento.`;

    const formattedPrompt = await promptTemplate.format({
      rulePrompt: rule.prompt,
      documentText: text,
      modeInstructions: finalModeInstructions,
      userInstructions: userInstructions,
      languageInstruction: languageInstruction,
      targetChapterInstructions: targetChapterInstructions,
      internshipGuidelines: INTERNSHIP_GUIDELINES,
      currentDateInfo: currentDateInfo
    });

    // 3. Obtener respuesta estructurada de la IA (Capa 2)
    const documentData = await structuredModel.invoke(formattedPrompt);

    // 4. Validar las reglas de negocio (Capa 4)
    // Only validate the whole document if we are generating the entire document. 
    // Partial schemas might fail full validation because they don't have all fields.
    if (targetChapter === 'all') {
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