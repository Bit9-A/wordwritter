import { NextRequest, NextResponse } from 'next/server';
import { getRuleById } from '@/lib/rules';
import * as mammoth from 'mammoth';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { PromptTemplate } from '@langchain/core/prompts';
import { documentSchema } from '@/lib/schema';
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

    const structuredModel = model.withStructuredOutput(documentSchema);

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
      
      {userInstructions}
      {modeInstructions}

      Instrucciones adicionales de estilo:
      {rulePrompt}

      A continuación se presenta el contenido del documento borrador del estudiante:
      ---
      {documentText}
      ---
    `);

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
      userInstructions: userInstructions
    });

    // 3. Obtener respuesta estructurada de la IA (Capa 2)
    const documentData = await structuredModel.invoke(formattedPrompt);

    // 4. Validar las reglas de negocio (Capa 4)
    const validation = validateDocument(documentData);
    if (!validation.valid) {
      return NextResponse.json({ error: 'La IA no pudo cumplir con todas las normativas estrictas de validación.', detalles: validation.errors }, { status: 400 });
    }

    // 5. Retornar los datos estructurados para que el cliente decida qué exportar
    return NextResponse.json(documentData);
  } catch (error: any) {
    console.error('Error en el procesamiento:', error);
    return NextResponse.json({ error: 'Error al procesar el documento: ' + error.message }, { status: 500 });
  }
}