// ============================================================
// SetupGrid — Bento Grid de Configuración (Setup State)
// Principio SRP: Solo renderiza las 4 cards de configuración inicial
// ============================================================
import { motion } from 'framer-motion';
import {
  Gear, Key, Eye, EyeSlash, FileArrowUp, ArrowRight,
  CheckCircle, FileText, ProjectorScreenChart, HardDrives,
  Lightning, Palette, Briefcase,
} from '@phosphor-icons/react';
import type { RevisionRule } from '@/lib/rules';
import type { TranslationDict } from '@/lib/i18n';
import type { GenerationMode, GanttTheme } from '@/types/dashboard';

interface SetupGridProps {
  t: TranslationDict;
  rules: RevisionRule[];
  selectedRuleId: string;
  selectedModel: string;
  apiKey: string;
  showApiKey: boolean;
  userPrompt: string;
  file: File | null;
  generationMode: GenerationMode;
  ganttTheme: GanttTheme;
  isProcessing: boolean;
  onRuleChange: (id: string) => void;
  onModelChange: (model: string) => void;
  onApiKeyChange: (key: string) => void;
  onToggleShowApiKey: () => void;
  onUserPromptChange: (prompt: string) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onModeChange: (mode: GenerationMode) => void;
  onThemeChange: (theme: GanttTheme) => void;
}

const GENERATION_MODES = [
  { id: 'both' as GenerationMode, labelKey: 'modeBoth', icon: CheckCircle },
  { id: 'word' as GenerationMode, labelKey: 'modeWord', icon: FileText },
  { id: 'gantt' as GenerationMode, labelKey: 'modeGantt', icon: ProjectorScreenChart },
];

const GANTT_THEMES = [
  { id: 'institutional' as GanttTheme, labelKey: 'themeInstitutional', icon: Briefcase },
  { id: 'modern' as GanttTheme, labelKey: 'themeModern', icon: Palette },
  { id: 'academic' as GanttTheme, labelKey: 'themeAcademic', icon: ProjectorScreenChart },
];

const GEMINI_MODELS = [
  { group: 'Premier Models (3.x)', options: [
    { value: 'gemini-3-flash-preview', label: 'Gemini 3 Flash (Fast & Native)' },
    { value: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro (Technical Heavy)' },
    { value: 'gemini-3.1-flash-lite-preview', label: 'Gemini 3.1 Flash Lite' },
  ]},
  { group: 'Balanced Models (2.5)', options: [
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  ]},
];

const selectClass = 'w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs font-medium text-white focus:ring-1 focus:ring-accent outline-none appearance-none cursor-pointer';
const labelClass = 'text-[10px] font-black text-zinc-500 uppercase tracking-widest';

const spring = { type: 'spring' as const, stiffness: 100, damping: 20 };

export function SetupGrid({
  t, rules, selectedRuleId, selectedModel, apiKey, showApiKey,
  userPrompt, file, generationMode, ganttTheme, isProcessing,
  onRuleChange, onModelChange, onApiKeyChange, onToggleShowApiKey,
  onUserPromptChange, onFileChange, onSubmit, onModeChange, onThemeChange,
}: SetupGridProps) {
  const selectedRule = rules.find((r) => r.id === selectedRuleId);

  return (
    <motion.div
      key="setup"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={spring}
      className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:grid-rows-2"
    >
      {/* Card 1: Engine Config */}
      <motion.div
        whileHover={{ y: -4 }}
        className="lg:col-span-4 glass rounded-2xl p-6 border-zinc-800 flex flex-col gap-6"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-zinc-800 rounded-lg"><Gear size={20} className="text-accent" /></div>
          <h3 className="font-bold text-sm tracking-tight text-white uppercase">{t.config.title}</h3>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className={labelClass}>{t.upload.ruleLabel}</label>
            <select value={selectedRuleId} onChange={(e) => onRuleChange(e.target.value)} className={selectClass}>
              {rules.map((rule) => (
                <option key={rule.id} value={rule.id}>{rule.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className={labelClass}>{t.config.modelLabel}</label>
            <select value={selectedModel} onChange={(e) => onModelChange(e.target.value)} className={selectClass}>
              {GEMINI_MODELS.map(({ group, options }) => (
                <optgroup key={group} label={group} className="bg-zinc-950 text-accent font-bold">
                  {options.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>

        {selectedRule && (
          <div className="mt-auto p-4 bg-accent/5 rounded-xl border border-accent/10">
            <p className="text-[11px] text-zinc-400 italic leading-relaxed">"{selectedRule.description}"</p>
          </div>
        )}
      </motion.div>

      {/* Card 2: Security & Prompt */}
      <motion.div
        whileHover={{ y: -4 }}
        className="lg:col-span-4 glass rounded-2xl p-6 border-zinc-800 flex flex-col gap-6"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-zinc-800 rounded-lg"><Key size={20} className="text-accent" /></div>
          <h3 className="font-bold text-sm tracking-tight text-white uppercase">{t.config.subtitle}</h3>
        </div>

        <div className="space-y-4 flex-1 flex flex-col">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className={labelClass}>{t.config.apiKeyLabel}</label>
              <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-[9px] font-black text-accent hover:opacity-70 transition-opacity">GET KEY</a>
            </div>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => onApiKeyChange(e.target.value)}
                placeholder="••••••••••••••••"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-4 pr-10 py-3 text-xs font-mono text-white focus:ring-1 focus:ring-accent outline-none"
              />
              <button onClick={onToggleShowApiKey} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors">
                {showApiKey ? <EyeSlash size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="space-y-2 flex-1 flex flex-col">
            <label className={labelClass}>{t.config.userPromptLabel}</label>
            <textarea
              value={userPrompt}
              onChange={(e) => onUserPromptChange(e.target.value.slice(0, 1000))}
              placeholder={t.config.userPromptPlaceholder}
              className="flex-1 w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-xs font-medium text-white focus:ring-1 focus:ring-accent outline-none resize-none transition-all placeholder:text-zinc-700"
            />
          </div>
        </div>
      </motion.div>

      {/* Card 3: Upload (spans 2 rows) */}
      <motion.div
        whileHover={{ y: -4 }}
        className="lg:col-span-4 lg:row-span-2 glass-accent rounded-3xl p-8 border-emerald-500/20 flex flex-col items-center justify-center text-center gap-8 group"
      >
        <div className="relative">
          <div className="absolute inset-0 bg-accent/20 blur-3xl rounded-full scale-150 animate-pulse" />
          <div className="relative w-24 h-24 bg-zinc-950 rounded-full border border-emerald-500/30 flex items-center justify-center">
            <FileArrowUp size={48} className="text-accent group-hover:-translate-y-1 transition-transform" weight="duotone" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">{t.results.ready}</h2>
          <p className="text-xs text-zinc-500 font-medium px-4">{t.upload.dropzone}</p>
        </div>

        <div className="w-full space-y-4">
          <label className="block w-full cursor-pointer">
            <div className="w-full py-4 glass border-zinc-800 rounded-2xl text-xs font-black uppercase tracking-widest text-zinc-300 hover:bg-zinc-800 transition-colors">
              {file ? file.name : t.upload.title}
            </div>
            <input type="file" accept=".docx" onChange={onFileChange} className="hidden" />
          </label>

          <motion.button
            disabled={!file || !apiKey}
            onClick={onSubmit}
            whileTap={{ scale: 0.95 }}
            className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all ${
              !file || !apiKey
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-50'
                : 'bg-accent text-zinc-950 shadow-[0_0_40px_-10px_rgba(16,185,129,0.5)] hover:scale-[1.02]'
            }`}
          >
            {isProcessing ? t.actions.processing : t.actions.process}
            <ArrowRight size={20} weight="bold" />
          </motion.button>
        </div>

        <div className="flex gap-4 mt-4">
          <div className="flex items-center gap-1">
            <HardDrives size={12} className="text-zinc-600" />
            <span className="text-[9px] font-black text-zinc-600 uppercase">DOCX STABLE</span>
          </div>
          <div className="flex items-center gap-1">
            <Lightning size={12} className="text-zinc-600" />
            <span className="text-[9px] font-black text-zinc-600 uppercase">GPU TURBO</span>
          </div>
        </div>
      </motion.div>

      {/* Card 4: Mode + Theme */}
      <motion.div
        whileHover={{ y: -4 }}
        className="lg:col-span-8 glass rounded-2xl p-6 border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-8"
      >
        <div className="flex flex-col gap-1">
          <label className={labelClass}>{t.config.generationMode}</label>
          <p className="text-xs text-zinc-400 font-medium">{t.upload.ruleDescription}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {GENERATION_MODES.map(({ id, labelKey, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onModeChange(id)}
              className={`px-5 py-3 rounded-xl flex items-center gap-2 text-xs font-bold transition-all border ${
                generationMode === id
                  ? 'bg-accent border-accent text-zinc-950'
                  : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-600'
              }`}
            >
              <Icon size={16} />
              {t.config[labelKey as keyof typeof t.config] as string}
            </button>
          ))}
        </div>

        <div className="md:h-12 w-px bg-zinc-800 hidden md:block" />

        <div className="flex flex-col gap-1">
          <label className={labelClass}>{t.config.ganttThemeLabel}</label>
          <div className="flex gap-2">
            {GANTT_THEMES.map(({ id, labelKey, icon: Icon }) => (
              <button
                key={id}
                onClick={() => onThemeChange(id)}
                className={`p-3 rounded-xl flex items-center gap-2 text-[10px] font-bold transition-all border ${
                  ganttTheme === id
                    ? 'bg-zinc-800 border-accent text-accent'
                    : 'bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                }`}
                title={t.config[labelKey as keyof typeof t.config] as string}
              >
                <Icon size={14} />
                <span className="hidden lg:inline">{t.config[labelKey as keyof typeof t.config] as string}</span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
