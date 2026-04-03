// ============================================================
// ResultsView — Vista de Resultados con Exportación y Editor Gantt
// Principio SRP: Solo renderiza la pantalla de resultados exitosos
// ============================================================
import { motion } from 'framer-motion';
import { CheckCircle, FileText, ProjectorScreenChart, ArrowRight } from '@phosphor-icons/react';
import type { TranslationDict } from '@/lib/i18n';
import type {
  GenerationMode, GanttTheme, GanttObjective,
  ProcessedDocumentData, Signatures,
} from '@/types/dashboard';
import { GanttEditor } from './GanttEditor';

interface ResultsViewProps {
  t: TranslationDict;
  processedData: ProcessedDocumentData;
  generationMode: GenerationMode;
  ganttTheme: GanttTheme;
  editableGanttData: GanttObjective[];
  signatures: Signatures;
  fileName: string;
  onReset: () => void;
  onDownload: (type: 'word' | 'excel', filename: string) => void;
  onThemeChange: (theme: string) => void;
  onSignaturesChange: (sigs: Signatures) => void;
  onToggleWeek: (objIdx: number, actIdx: number, tareaIdx: number, week: number) => void;
}

const spring = { type: 'spring' as const, stiffness: 100, damping: 20 };

export function ResultsView({
  t, processedData, generationMode, ganttTheme,
  editableGanttData, signatures, fileName,
  onReset, onDownload, onThemeChange, onSignaturesChange, onToggleWeek,
}: ResultsViewProps) {
  const displayName = processedData.portada?.nombres
    ? `${processedData.portada.nombres} ${processedData.portada.apellidos}`
    : t.results.title;

  return (
    <motion.div
      key="results"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
      className="space-y-8"
    >
      {/* Success Header */}
      <div className="glass rounded-3xl p-8 border-emerald-500/20 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-emerald-500/10 rounded-2xl">
            <CheckCircle size={32} className="text-accent" weight="duotone" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight uppercase">{displayName}</h2>
            <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest mt-1">{t.results.subtitle}</p>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap justify-center gap-3">
          {generationMode !== 'gantt' && (
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onDownload('word', `final_${fileName}`)}
              className="px-6 py-4 bg-white text-zinc-950 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2"
            >
              <FileText size={18} />
              {t.actions.exportWord}
            </motion.button>
          )}
          {generationMode !== 'word' && (
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onDownload('excel', `gantt_${fileName.replace('.docx', '')}.xlsx`)}
              className="px-6 py-4 bg-accent text-zinc-950 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2"
            >
              <ProjectorScreenChart size={18} />
              {t.actions.exportExcel}
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={onReset}
            className="p-4 glass rounded-2xl text-zinc-400 border-zinc-800 hover:text-white"
          >
            <ArrowRight size={18} className="rotate-180" />
          </motion.button>
        </div>
      </div>

      {/* Gantt Interactive Editor */}
      {generationMode !== 'word' && editableGanttData.length > 0 && (
        <GanttEditor
          t={t}
          ganttTheme={ganttTheme}
          editableGanttData={editableGanttData}
          signatures={signatures}
          onThemeChange={onThemeChange}
          onSignatureChange={onSignaturesChange}
          onToggleWeek={onToggleWeek}
        />
      )}
    </motion.div>
  );
}
