import * as mammoth from 'mammoth';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { PromptTemplate } from '@langchain/core/prompts';
import { documentSchema } from '@/lib/schema';
import { validateDocument } from '@/lib/validator';
import { getRuleById } from '@/lib/rules';

export interface ProcessOptions {
  file: File;
  ruleId: string;
  generationMode: 'both' | 'word' | 'gantt';
  model: string;
  apiKey: string;
  userPrompt?: string;
  onProgress?: (step: string) => void;
}

/** 
 * Limpia el texto extraído para reducir el conteo de tokens innecesarios 
 * eliminando espacios múltiples, saltos de línea redundantes y tabulaciones.
 */
function cleanExtractedText(text: string): string {
  return text
    .replace(/\s+/g, ' ')           // Colapsar múltiples espacios y saltos de línea
    .replace(/\t/g, ' ')             // Reemplazar tabulaciones por espacios
    .replace(/\n{3,}/g, '\n\n')      // Máximo 2 saltos de línea consecutivos
    .trim();
}

export async function processDocumentLocally(options: ProcessOptions) {
  const { file, ruleId, generationMode, model: modelId, apiKey, userPrompt, onProgress } = options;

  const rule = getRuleById(ruleId);
  if (!rule) {
    throw new Error('Regla no encontrada');
  }

  // 1. Extraer texto del Word
  onProgress?.('Extrayendo texto del Word...');
  const arrayBuffer = await file.arrayBuffer();
  const { value: rawText } = await mammoth.extractRawText({ arrayBuffer });

  // 2. Comprimir texto si es necesario
  onProgress?.('Optimizando contenido para procesamiento...');
  const text = cleanExtractedText(rawText);
  const textLength = text.length;
  
  // Advertencia de longitud si supera ~15k-20k tokens estimados (60k caracteres)
  const isTooLarge = textLength > 60000;

  // 3. Configurar IA
  // 3. Configurar IA con parámetros optimizados para documentos grandes
  onProgress?.('Analizando con IA (Esto puede tardar en archivos grandes)...');
  const model = new ChatGoogleGenerativeAI({
    apiKey: apiKey,
    model: modelId,
    maxOutputTokens: 8192,
    temperature: 0.1, // Más determinismo para JSON
  });

  const lengthWarning = isTooLarge 
    ? "IMPORTANTE: El documento fuente es MUY EXTENSO. Sé extremadamente conciso y directo en las secciones narrativas (introducción, justificación) para evitar que la respuesta sea truncada. Prioriza la calidad estructural sobre la extensión."
    : "";

  const promptTemplate = PromptTemplate.fromTemplate(`
    Actúa como un tutor académico experto y redactor de Informes de Práctica Profesional. 
    Tu único objetivo es generar un objeto JSON válido que contenga la redacción del informe.
    
    REGLA DE ORO: Devuelve ÚNICAMENTE el objeto JSON. No incluyas preámbulos ni explicaciones.
    Si el contenido es largo, sé conciso para no exceder el límite de tokens de salida.
    
    ${lengthWarning}

    REGLAS DE CONTENIDO:
    1. INTRODUCCIÓN: Redacción técnica de 300+ palabras.
    2. CAPÍTULOS I a IV: Mejora el texto del estudiante siguiendo normativas APA.
    3. BIBLIOGRAFÍA: Formato APA estricto.
    4. CRONOGRAMA: Estructura de 3 Niveles (Objetivo -> Actividad -> Tarea).

    {rulePrompt}
    {modeInstructions}
    {userInstructions}

    DOCUMENTO DEL ESTUDIANTE:
    ---
    {documentText}
    ---
    
    JSON ESPERADO (Respeta el esquema):
  `);

  const userInstructionsStr = userPrompt 
    ? `INSTRUCCIONES ESPECÍFICAS: ${userPrompt}`
    : "";

  let modeInstructions = "";
  if (generationMode === 'word') {
    modeInstructions = `ENFOQUE: Solo Informe Word. Deja diagramaGanttData vacío.`;
  } else if (generationMode === 'gantt') {
    modeInstructions = `ENFOQUE: Solo Diagrama de Gantt (3 niveles obligatorios).`;
  } else {
    modeInstructions = `ENFOQUE: Completo (Word + Gantt).`;
  }

  const formattedPrompt = await promptTemplate.format({
    rulePrompt: rule.prompt,
    documentText: text,
    modeInstructions: modeInstructions,
    userInstructions: userInstructionsStr,
  });

  // 4. Obtener y Procesar Respuesta
  try {
    const response = await model.invoke(formattedPrompt);
    const rawContent = response.content as string;
    
    onProgress?.('Extrayendo y reparando datos estructurados...');
    const documentData = extractAndRepairJSON(rawContent);

    // 5. Validar normativas
    onProgress?.('Validando normativas académicas...');
    const validation = validateDocument(documentData, { 
      skipGantt: generationMode === 'word' 
    });
    
    if (!validation.valid) {
      console.warn('Validación incompleta:', validation.errors);
    }

    return documentData;
  } catch (err: any) {
    if (err.message?.includes('JSON') || err.message?.includes('parse')) {
      throw new Error('El documento es demasiado grande y la IA no pudo terminar de escribir el resultado. Intenta con un archivo más corto o usa un modelo "Pro".');
    }
    throw err;
  }
}

/**
 * Extrae JSON de una cadena que puede contener markdown o estar truncada.
 */
function extractAndRepairJSON(text: string): any {
  // Limpiar bloques de markdown
  let cleaned = text.replace(/```json\n?|```/g, "").trim();
  
  // Si no empieza con {, buscar el primer {
  if (!cleaned.startsWith('{')) {
    const firstBrace = cleaned.indexOf('{');
    if (firstBrace !== -1) cleaned = cleaned.substring(firstBrace);
  }

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // Intento de reparación básica para JSON truncado
    console.log("JSON truncado detectado, intentando reparar...");
    let repaired = cleaned;
    
    // Contar aperturas y cierres
    const openBraces = (repaired.match(/{/g) || []).length;
    const closeBraces = (repaired.match(/}/g) || []).length;
    const openBrackets = (repaired.match(/\[/g) || []).length;
    const closeBrackets = (repaired.match(/]/g) || []).length;

    // Cerrar strings si quedaron abiertos
    if ((repaired.match(/"/g) || []).length % 2 !== 0) {
      repaired += '"';
    }

    // Cerrar corchetes y llaves faltantes
    for (let i = 0; i < openBrackets - closeBrackets; i++) repaired += ']';
    for (let i = 0; i < openBraces - closeBraces; i++) repaired += '}';

    try {
      return JSON.parse(repaired);
    } catch (finalError) {
      throw new Error('Error crítico de formato: La respuesta de la IA llegó incompleta y no pudo ser reparada.');
    }
  }
}
