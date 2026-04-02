// ============================================================
// GanttEditor — Editor Interactivo del Cronograma de Gantt
// Principio SRP: Solo maneja la edición visual del diagrama
// ============================================================
import { motion } from 'framer-motion';
import {
  User, Briefcase, Lightning, TerminalWindow, CaretRight,
} from '@phosphor-icons/react';
import type { TranslationDict } from '@/lib/i18n';
import type { GanttObjective, GanttTheme, Signatures } from '@/types/dashboard';

interface GanttEditorProps {
  t: TranslationDict;
  ganttTheme: GanttTheme;
  editableGanttData: GanttObjective[];
  signatures: Signatures;
  onThemeChange: (theme: string) => void;
  onSignatureChange: (sigs: Signatures) => void;
  onToggleWeek: (objIdx: number, actIdx: number, tareaIdx: number, week: number) => void;
}

const THEME_COLORS: Record<GanttTheme, string> = {
  modern: 'bg-emerald-500 shadow-emerald-500/50',
  institutional: 'bg-blue-600 shadow-blue-600/50',
  academic: 'bg-red-600 shadow-red-600/50',
};

const THEME_BG_COLORS: Record<GanttTheme, string> = {
  modern: 'bg-emerald-500/20',
  institutional: 'bg-blue-600/20',
  academic: 'bg-red-600/20',
};

const SIGNATURE_FIELDS = [
  { key: 'tutorAcademico' as keyof Signatures, icon: User },
  { key: 'tutorInstitucional' as keyof Signatures, icon: Briefcase },
  { key: 'pasante' as keyof Signatures, icon: Lightning },
];

const SIGNATURE_LABELS: Record<string, { es: string; en: string }> = {
  tutorAcademico: { es: 'Tutor Académico', en: 'Academic Tutor' },
  tutorInstitucional: { es: 'Tutor Institucional', en: 'Institutional Tutor' },
  pasante: { es: 'Pasante', en: 'Intern' },
};

export function GanttEditor({
  t, ganttTheme, editableGanttData, signatures,
  onThemeChange, onSignatureChange, onToggleWeek,
}: GanttEditorProps) {
  const isEnglish = t.results.nodeIdentity === 'Node Identity';
  const weeks = t.results.weeks.split(' ');

  return (
    <div className="space-y-6">
      {/* Signatures Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {SIGNATURE_FIELDS.map(({ key, icon: Icon }) => {
          const labels = SIGNATURE_LABELS[key];
          const label = isEnglish ? labels.en : labels.es;
          const placeholder = isEnglish ? 'Legal Name' : 'Nombre Completo';

          return (
            <div key={key} className="glass rounded-2xl p-6 border-zinc-800 space-y-3">
              <div className="flex items-center gap-2">
                <Icon size={14} className="text-accent" />
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{label}</label>
              </div>
              <input
                type="text"
                value={signatures[key]}
                onChange={(e) => onSignatureChange({ ...signatures, [key]: e.target.value })}
                placeholder={placeholder}
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-xs font-bold text-white focus:ring-1 focus:ring-accent outline-none"
              />
            </div>
          );
        })}
      </div>

      {/* Gantt Grid */}
      <div className="glass rounded-3xl border-zinc-800 overflow-hidden">
        {/* Grid Header */}
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <TerminalWindow size={20} className="text-zinc-500" />
            <h3 className="text-xs font-black text-white uppercase tracking-widest">{t.results.subtitle}</h3>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-sm ${THEME_COLORS[ganttTheme].split(' ')[0]}`} />
              <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Active Slot</span>
            </div>
            <select
              value={ganttTheme}
              onChange={(e) => onThemeChange(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-[9px] font-black text-zinc-400 uppercase tracking-widest focus:ring-1 focus:ring-accent outline-none cursor-pointer"
            >
              <option value="institutional">{t.config.themeInstitutional}</option>
              <option value="modern">{t.config.themeModern}</option>
              <option value="academic">{t.config.themeAcademic}</option>
            </select>
          </div>
        </div>

        {/* Grid Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-900/50">
                <th className="p-4 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] min-w-[300px]">
                  {t.results.nodeIdentity}
                </th>
                {weeks.map((week, i) => (
                  <th key={i} className="p-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center border-l border-zinc-800 w-10">
                    {week}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {editableGanttData.map((obj, objIdx) =>
                obj.actividades.map((act, actIdx) =>
                  act.tareas.map((tarea, tareaIdx) => (
                    <tr key={`${objIdx}-${actIdx}-${tareaIdx}`} className="group hover:bg-zinc-800/20 transition-colors">
                      <td className="p-4 space-y-2">
                        {actIdx === 0 && tareaIdx === 0 && (
                          <div className="flex items-center gap-2 text-[10px] font-black text-accent uppercase tracking-widest mb-1">
                            <CaretRight size={10} weight="bold" />
                            {obj.objetivo}
                          </div>
                        )}
                        {tareaIdx === 0 && (
                          <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1 pl-4 opacity-70">
                            {act.descripcion}
                          </div>
                        )}
                        <div className="text-[11px] font-medium text-zinc-300 pl-8 flex items-center gap-2">
                          <div className="w-1 h-3 bg-zinc-700 rounded-full" />
                          {tarea.descripcion}
                        </div>
                      </td>
                      {Array.from({ length: 14 }, (_, weekIdx) => {
                        const isSelected = tarea.semanas.includes(weekIdx + 1);
                        return (
                          <td
                            key={weekIdx}
                            onClick={() => onToggleWeek(objIdx, actIdx, tareaIdx, weekIdx + 1)}
                            className={`cursor-pointer border-l border-zinc-800 transition-all relative ${
                              isSelected ? THEME_BG_COLORS[ganttTheme] : 'hover:bg-accent/5'
                            }`}
                          >
                            {isSelected && (
                              <motion.div
                                layoutId={`blob-${objIdx}-${actIdx}-${tareaIdx}-${weekIdx}`}
                                className={`absolute inset-2 rounded-sm shadow-lg ${THEME_COLORS[ganttTheme]}`}
                              />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
