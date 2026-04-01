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
      model: "gemini-2.5-flash", 
    });

    const structuredModel = model.withStructuredOutput(documentSchema);

    const promptTemplate = PromptTemplate.fromTemplate(`
      Eres un agente redactor Universitario. Al redactar o modificar el contenido, debes respetar estrictamente lo siguiente:
      1. Glosario: Todo término en la sección Glosario debe estar ordenado alfabéticamente de manera obligatoria.
      2. Bibliografía: Debes usar formato APA. Si una cita supera una línea de texto, debes aplicar un salto de párrafo simple, y entre cita y cita dejar un espacio de 1.5cm.
      3. Evidencias y Anexos: Al redactar la sección '3.2 Descripción de las Actividades', es obligatorio referenciar las evidencias. Cada anexo mencionado debe listarse al final con una descripción (Ejemplo: 'Anexo 1: Realizando Limpieza...') y estar enumerado.
      4. Imágenes y Tablas: A todas las imágenes, cuadros o mapas que proceses, debes asegurar que se les asigne un Autor, Fuente y Año en la parte inferior (Ejemplo: 'Fuente: Google Maps. (2025)').
      5. Todos los nombres y apellidos de la portada deben estar en MAYÚSCULAS en los campos correspondientes. El título del proyecto en la portada también debe estar íntegramente en MAYÚSCULAS.
      
      {userInstructions}

      CRÍTICO - DIAGRAMA DE GANTT (Solo si se solicita):
      {ganttInstructions}

      Instrucciones adicionales de estilo:
      {rulePrompt}

      A continuación se presenta el contenido del documento borrador del estudiante para procesar, limpiar y estructurar estrictamente según nuestro formato predefinido:
      ---
      {documentText}
      ---
    `);

    const userInstructions = userPrompt 
      ? `INSTRUCCIONES ESPECÍFICAS DEL USUARIO (Prioridad Alta): ${userPrompt}`
      : "";

    const ganttInstructions = includeGantt 
      ? `Para la sección de Cronograma (Capítulo 3):
         - DEBES extraer o proponer exactamente 3 Actividades por cada Objetivo Específico encontrado en el documento.
         - Por cada una de esas Actividades, DEBES desglosar exactamente 3 Tareas específicas.
         - Distribuye estas tareas de manera lógica a lo largo de 14 semanas (1 a 14).
         - Si el documento no tiene suficiente detalle, INVENTA tareas coherentes con los objetivos técnicos planteados.`
      : "NO extraigas datos estructurados para el Diagrama de Gantt. Deja diagramaGanttData como un array vacío.";

    const formattedPrompt = await promptTemplate.format({
      rulePrompt: rule.prompt,
      documentText: text,
      ganttInstructions: ganttInstructions,
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