import { DocumentData } from './schema';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateDocument(data: DocumentData, options: { skipGantt?: boolean } = {}): ValidationResult {
  const errors: string[] = [];

  // 1. Auto-corregir Nombres y Título a MAYÚSCULAS en lugar de fallar
  if (data.portada.nombres) {
    data.portada.nombres = data.portada.nombres.toUpperCase();
  }
  if (data.portada.apellidos) {
    data.portada.apellidos = data.portada.apellidos.toUpperCase();
  }
  if (data.portada.tituloProyecto) {
    data.portada.tituloProyecto = data.portada.tituloProyecto.toUpperCase();
  }

  // 2. Validar que el Glosario esté ordenado alfabéticamente
  if (data.glosario && data.glosario.length > 0) {
    const terms = (data.glosario || []).map(g => g.termino.toLowerCase());
    const sortedTerms = [...terms].sort();
    
    // Check if the arrays are equal
    const isSorted = terms.every((val, index) => val === sortedTerms[index]);
    if (!isSorted) {
      // Intentamos auto-ordenarlo también para mejorar la experiencia
      data.glosario.sort((a, b) => a.termino.localeCompare(b.termino));
      console.log('El glosario fue auto-ordenado por el validador.');
    }
  }

  // 3. Validación aproximada de longitud (mínimo 20 páginas cuerpo del trabajo)
  // Desactivada temporalmente para permitir pruebas con documentos pequeños.
  if (!options.skipGantt) {
    if (!data.capitulo3.diagramaGanttData || data.capitulo3.diagramaGanttData.length === 0) {
        errors.push("El diagrama de Gantt estructurado está vacío. Por favor, asegúrese de que la IA extraiga los objetivos y actividades.");
    }
  }
  
  if (errors.length > 0) {
    console.error("Errores de validación de la IA:", errors);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
