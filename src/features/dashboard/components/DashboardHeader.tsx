// ============================================================
// DashboardHeader — Componente Presentacional Puro
// Principio SRP: Solo renderiza el header, no tiene estado propio
// ============================================================
import { motion } from 'framer-motion';
import type { Language } from '@/lib/i18n';

interface DashboardHeaderProps {
  lang: Language;
  onLangChange: (lang: Language) => void;
}

const spring = { type: 'spring' as const, stiffness: 100, damping: 20 };

export function DashboardHeader({ lang, onLangChange }: DashboardHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
      className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-16"
    >
      <div>
        <h1 className="text-5xl sm:text-7xl font-black tracking-tighter text-white uppercase italic">
          Word<span className="text-secondary opacity-50 block sm:inline">Writter</span>
        </h1>
        <p className="mt-2 text-zinc-400 font-medium max-w-md uppercase tracking-widest text-[10px]">
          Advanced Academic Engine // Technical Schedule Synthesizer
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        {/* Status Badge */}
        <div className="flex items-center gap-2 px-4 py-2 glass rounded-full border-zinc-800">
          <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
          <span className="text-[10px] font-black tracking-widest text-zinc-500 uppercase">Active</span>
        </div>

        {/* Language Switcher */}
        <div className="flex items-center glass rounded-full p-1 border-zinc-800">
          {(['es', 'en'] as Language[]).map((l) => (
            <button
              key={l}
              onClick={() => onLangChange(l)}
              className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full transition-all ${
                lang === l ? 'bg-accent text-zinc-950' : 'text-zinc-500 hover:text-white'
              }`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </motion.header>
  );
}
