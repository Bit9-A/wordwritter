// ============================================================
// useDocumentProcessor — Lógica de Negocio del Dashboard
// Principio SRP: Solo contiene efectos y operaciones de documentos
// Principio OCP: Abierto a extensión (nuevos endpoints) sin modificar page.tsx
// ============================================================
'use client';

import type { Language } from '@/lib/i18n';
import type {
  GenerationMode,
  GanttObjective,
  GanttTheme,
  ProcessedDocumentData,
  Signatures,
  TargetChapter,
} from '@/types/dashboard';

interface ProcessorDeps {
  file: File | null;
  selectedRuleId: string;
  apiKey: string;
  generationMode: GenerationMode;
  selectedModel: string;
  userPrompt: string;
  lang: Language;
  targetChapter: TargetChapter;
  processedData: ProcessedDocumentData | null;
  editableGanttData: GanttObjective[];
  signatures: Signatures;
  ganttTheme: GanttTheme;
  setIsProcessing: (v: boolean) => void;
  setResult: (r: string | null) => void;
  setProcessedData: (d: ProcessedDocumentData | null) => void;
  setEditableGanttData: (d: GanttObjective[]) => void;
  setSignatures: (s: Signatures) => void;
  t: { errors: { processError: string }; results: { ready: string; title: string } };
}

function buildFormData(deps: ProcessorDeps): FormData {
  const { file, selectedRuleId, generationMode, selectedModel, apiKey, userPrompt, lang, targetChapter } = deps;
  const formData = new FormData();
  formData.append('file', file!);
  formData.append('ruleId', selectedRuleId);
  formData.append('includeGantt', String(generationMode !== 'word'));
  formData.append('generationMode', generationMode);
  formData.append('model', selectedModel);
  formData.append('apiKey', apiKey);
  formData.append('userPrompt', userPrompt);
  formData.append('language', lang);
  formData.append('targetChapter', targetChapter);
  return formData;
}

function triggerBrowserDownload(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(anchor);
}

export function useDocumentProcessor(deps: ProcessorDeps) {
  const {
    file, selectedRuleId, apiKey,
    generationMode, processedData, editableGanttData,
    signatures, ganttTheme,
    setIsProcessing, setResult, setProcessedData,
    setEditableGanttData, setSignatures, t,
  } = deps;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !selectedRuleId || !apiKey) return;

    setIsProcessing(true);
    setResult(null);
    setProcessedData(null);

    try {
      const formData = buildFormData(deps);
      const response = await fetch('/api/process', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t.errors.processError);
      }

      const data: ProcessedDocumentData = await response.json();
      setProcessedData(data);
      setEditableGanttData(data.capitulo3?.diagramaGanttData ?? []);
      setSignatures({
        tutorAcademico: data.firmasGantt?.tutorAcademico ?? '',
        tutorInstitucional: data.firmasGantt?.tutorInstitucional ?? '',
        pasante: data.firmasGantt?.pasante ?? `${data.portada.nombres} ${data.portada.apellidos}`,
      });
      setResult(generationMode !== 'word' ? t.results.ready : t.results.title);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleWeek = (objIdx: number, actIdx: number, tareaIdx: number, week: number) => {
    const newData = structuredClone(editableGanttData);
    const tarea = newData[objIdx].actividades[actIdx].tareas[tareaIdx];
    tarea.semanas = tarea.semanas.includes(week)
      ? tarea.semanas.filter((w) => w !== week)
      : [...tarea.semanas, week].sort((a, b) => a - b);
    setEditableGanttData(newData);
  };

  const downloadFile = async (endpoint: string, filename: string) => {
    if (!processedData) return;
    const payload = {
      ...processedData,
      capitulo3: { ...processedData.capitulo3, diagramaGanttData: editableGanttData },
      firmasGantt: signatures,
      ganttTheme,
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const blob = await response.blob();
      triggerBrowserDownload(blob, filename);
    } catch (error: any) {
      alert('Error en la descarga: ' + error.message);
    }
  };

  return { handleSubmit, toggleWeek, downloadFile };
}
