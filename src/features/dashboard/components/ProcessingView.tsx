// ============================================================
// ProcessingView — Estado de Carga Animado
// Principio SRP: Solo renderiza la pantalla de procesamiento
// ============================================================
import { motion } from 'framer-motion';
import { CircleNotch } from '@phosphor-icons/react';
import { AdScriptLoader } from './AdScriptLoader';
import type { TranslationDict } from '@/lib/i18n';

interface ProcessingViewProps {
  t: TranslationDict;
}

const STATUS_TAGS = ['Core.v3', 'Analytic_Active', 'Hierarchical_Map'];

export function ProcessingView({ t }: ProcessingViewProps) {
  return (
    <motion.div
      key="processing"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -40 }}
      className="flex flex-col items-center justify-center py-24 gap-12"
    >
      {/* Animated spinner */}
      <div className="relative">
        <div className="absolute inset-0 bg-accent/20 blur-[100px] rounded-full scale-150 animate-pulse" />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          className="relative w-48 h-48 rounded-full border-4 border-zinc-800 flex items-center justify-center"
        >
          <div className="absolute top-0 w-4 h-4 bg-accent rounded-full -translate-y-2 shadow-[0_0_15px_rgba(16,185,129,1)]" />
          <CircleNotch size={80} className="text-zinc-600 animate-spin" />
        </motion.div>
      </div>

      {/* Status text */}
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">{t.loading.title}</h2>
        <p className="text-zinc-500 font-medium max-w-sm mx-auto text-xs uppercase tracking-widest">
          {t.loading.subtitle}
        </p>
      </div>

      {/* Ad Unit (Moved here for better visibility) */}
      <div className="w-full max-w-lg p-4 glass rounded-2xl border-zinc-800 flex flex-col items-center justify-center min-h-[100px]">
        <AdScriptLoader scriptUrl="//selfassured-celebration.com/bxX/VZs.djGSlM0JYuWDcd/he/mD9mu/ZZUPl_kyPZTpYb5TMwjAY/5bMEzHcBt/NkjxkVyzNhjmkt0CM/QT" />
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-md bg-zinc-900/50 border border-zinc-800 rounded-2xl p-1 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 15, ease: 'easeInOut' }}
          className="h-2 bg-accent shadow-[0_0_10px_rgba(16,185,129,0.5)] rounded-full"
        />
      </div>

      {/* Debug tags */}
      <div className="flex gap-8 text-[10px] font-black text-zinc-700 uppercase tracking-[0.2em] animate-pulse">
        {STATUS_TAGS.map((tag) => <span key={tag}>{tag}</span>)}
      </div>
    </motion.div>
  );
}
