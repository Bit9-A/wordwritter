export const translations = {
  es: {
    header: {
      title: "WordWritter",
      subtitle: "Draft to Logic",
      version: "v3.0.0 Premium"
    },
    config: {
      title: "Engine Config",
      subtitle: "AI Persistence",
      modelLabel: "Modelo Gemini",
      apiKeyLabel: "Gemini API Key",
      apiKeyPlaceholder: "Introduce tu API Key...",
      userPromptLabel: "Instrucciones Adicionales (Opcional)",
      userPromptPlaceholder: "Ej: Enfócate más en el Capítulo 3...",
      generationMode: "Modo de Generación",
      modeBoth: "Completo (Word + Gantt)",
      modeWord: "Solo Informe Word",
      modeGantt: "Solo Diagrama de Gantt"
    },
    upload: {
      title: "Draft Upload",
      subtitle: "Source (.docx)",
      dropzone: "Selecciona o arrastra tu archivo .docx",
      ruleLabel: "Normativa de Revisión",
      ruleDescription: "Selecciona la universidad o reglamento académico"
    },
    actions: {
      process: "Inicializar Síntesis Lógica",
      processing: "Sintetizando estructura...",
      exportWord: "Exportar Word (.docx)",
      exportExcel: "Exportar Excel (.xlsx)",
      reset: "Nueva Carga"
    },
    loading: {
      title: "Sintetizando Lógica",
      subtitle: "Mapeando objetivos institucionales // Refinando estructuras semánticas // Generando cronograma a 3 niveles"
    },
    results: {
      title: "Repositorio de Síntesis",
      subtitle: "Diagrama de Gantt Estructurado",
      nodeIdentity: "Identidad de Nodo",
      weeks: "S1 S2 S3 S4 S5 S6 S7 S8 S9 S10 S11 S12 S13 S14",
      ready: "Listo para Síntesis"
    },
    errors: {
      missingFile: "Por favor selecciona un archivo .docx",
      missingApiKey: "La API Key de Gemini es obligatoria",
      processError: "Sucedió un error al procesar el archivo",
      validationIncomplete: "La validación por IA ha sido incompleta"
    },
    aiInstructions: {
      outputLanguage: "Idioma de Salida Sugerido: Español",
      role: "Actúa como un tutor académico experto...",
      rules: "Reglas de contenido..."
    }
  },
  en: {
    header: {
      title: "WordWritter",
      subtitle: "Draft to Logic",
      version: "v3.0.0 Premium"
    },
    config: {
      title: "Engine Config",
      subtitle: "AI Persistence",
      modelLabel: "Gemini Model",
      apiKeyLabel: "Gemini API Key",
      apiKeyPlaceholder: "Enter your API Key...",
      userPromptLabel: "Additional Instructions (Optional)",
      userPromptPlaceholder: "Ex: Focus more on Chapter 3...",
      generationMode: "Generation Mode",
      modeBoth: "Complete (Word + Gantt)",
      modeWord: "Word Report Only",
      modeGantt: "Gantt Diagram Only"
    },
    upload: {
      title: "Draft Upload",
      subtitle: "Source (.docx)",
      dropzone: "Select or drag your .docx file",
      ruleLabel: "Review Guidelines",
      ruleDescription: "Select the university or academic regulation"
    },
    actions: {
      process: "Initialize Logic Synthesis",
      processing: "Synthesizing structure...",
      exportWord: "Export Word (.docx)",
      exportExcel: "Export Excel (.xlsx)",
      reset: "New Upload"
    },
    loading: {
      title: "Synthesizing Logic",
      subtitle: "Mapping institutional goals // Refining semantic structures // Generating 3-level schedule"
    },
    results: {
      title: "Synthesis Repository",
      subtitle: "Structured Gantt Diagram",
      nodeIdentity: "Node Identity",
      weeks: "W1 W2 W3 W4 W5 W6 W7 W8 W9 W10 W11 W12 W13 W14",
      ready: "Ready for Synthesis"
    },
    errors: {
      missingFile: "Please select a .docx file",
      missingApiKey: "Gemini API Key is mandatory",
      processError: "An error occurred while processing the file",
      validationIncomplete: "AI validation was incomplete"
    },
    aiInstructions: {
      outputLanguage: "High Priority Output Language: English",
      role: "Act as an expert academic tutor...",
      rules: "Content rules..."
    }
  }
};

export type Language = keyof typeof translations;
export type TranslationDict = typeof translations.es;
