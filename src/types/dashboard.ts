// ============================================================
// WordWritter — Dashboard Types & Contracts
// Principio SRP: Centraliza todos los tipos del feature en un solo lugar
// ============================================================

import type { RevisionRule } from '@/lib/rules';
import type { Language } from '@/lib/i18n';

export type GenerationMode = 'both' | 'word' | 'gantt';

export type GanttTheme = 'institutional' | 'modern' | 'academic';

export interface Signatures {
  tutorAcademico: string;
  tutorInstitucional: string;
  pasante: string;
}

export interface GanttTask {
  descripcion: string;
  semanas: number[];
}

export interface GanttActivity {
  descripcion: string;
  tareas: GanttTask[];
}

export interface GanttObjective {
  objetivo: string;
  actividades: GanttActivity[];
}

export interface Portada {
  nombres: string;
  apellidos: string;
  [key: string]: string;
}

export interface ProcessedDocumentData {
  portada: Portada;
  firmasGantt?: Signatures;
  capitulo3?: {
    diagramaGanttData: GanttObjective[];
    [key: string]: unknown;
  };
  ganttTheme?: GanttTheme;
  [key: string]: unknown;
}

// State shape for the dashboard hook
export interface DashboardState {
  rules: RevisionRule[];
  selectedRuleId: string;
  file: File | null;
  isProcessing: boolean;
  isMounted: boolean;
  lang: Language;
  processedData: ProcessedDocumentData | null;
  result: string | null;
  generationMode: GenerationMode;
  selectedModel: string;
  ganttTheme: GanttTheme;
  apiKey: string;
  userPrompt: string;
  showApiKey: boolean;
  editableGanttData: GanttObjective[];
  signatures: Signatures;
}
