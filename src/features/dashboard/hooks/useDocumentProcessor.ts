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
import { processDocumentLocally } from '@/lib/processor-service';
import { generateDocument } from '@/lib/docx-generator';
import { generateGanttExcel } from '@/lib/excel-generator';
import type { RevisionRule } from '@/lib/rules';

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
  rules: RevisionRule[];
  t: { errors: { processError: string }; results: { ready: string; title: string } };
}

// buildFormData removed as it is no longer needed for local processing

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
      const selectedRule = deps.rules.find(r => r.id === selectedRuleId);
      if (!selectedRule) throw new Error("Rule not found");

      const data = await processDocumentLocally(file, selectedRule, {
        apiKey,
        model: deps.selectedModel,
        generationMode,
        userPrompt: deps.userPrompt,
        language: deps.lang,
        targetChapter: deps.targetChapter,
        onProgress: (msg: string) => setResult(msg)
      });

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

  const downloadFile = async (type: 'word' | 'excel', filename: string) => {
    if (!processedData) return;
    const payload = {
      ...processedData,
      capitulo3: { ...processedData.capitulo3, diagramaGanttData: editableGanttData },
      firmasGantt: signatures,
      ganttTheme,
    };

    try {
      let blob: Blob;
      if (type === 'word') {
        const buffer = await generateDocument(payload as any);
        blob = new Blob([new Uint8Array(buffer)], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      } else {
        const buffer = await generateGanttExcel(payload, ganttTheme);
        blob = new Blob([new Uint8Array(buffer as any)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      }
      triggerBrowserDownload(blob, filename);
    } catch (error: any) {
      alert('Error en la descarga: ' + error.message);
    }
  };

  return { handleSubmit, toggleWeek, downloadFile };
}
