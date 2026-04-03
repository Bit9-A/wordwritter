// ============================================================
// page.tsx — Orquestador Principal del Dashboard
// Principio SRP: Solo compone hooks y componentes, zero lógica interna
// Principio OCP: Agregar nuevas vistas no requiere tocar este archivo
// ============================================================
'use client';

import { AnimatePresence } from 'framer-motion';
import { useDashboardState } from '@/features/dashboard/hooks/useDashboardState';
import { useDocumentProcessor } from '@/features/dashboard/hooks/useDocumentProcessor';
import { DashboardHeader } from '@/features/dashboard/components/DashboardHeader';
import { SetupGrid } from '@/features/dashboard/components/SetupGrid';
import { ProcessingView } from '@/features/dashboard/components/ProcessingView';
import { ResultsView } from '@/features/dashboard/components/ResultsView';
import { AdBanner } from '@/features/dashboard/components/AdBanner';
import type { Language } from '@/lib/i18n';
import type { GanttTheme } from '@/types/dashboard';

export default function Home() {
  const state = useDashboardState();
  const {
    t, rules, selectedRuleId, file, isProcessing, isMounted, lang,
    processedData, generationMode, selectedModel, ganttTheme,
    apiKey, userPrompt, showApiKey, editableGanttData, signatures,
    targetChapter,
    setSelectedRuleId, setFile, setIsProcessing, setLang,
    setProcessedData, setResult, setGenerationMode, setSelectedModel,
    setGanttTheme, setUserPrompt, setShowApiKey,
    setEditableGanttData, setSignatures, setTargetChapter, handleApiKeyChange,
  } = state;

  const { handleSubmit, toggleWeek, downloadFile } = useDocumentProcessor({
    file, selectedRuleId, apiKey, generationMode, selectedModel,
    userPrompt, lang, targetChapter, processedData, editableGanttData,
    signatures, ganttTheme,
    setIsProcessing, setResult, setProcessedData,
    setEditableGanttData, setSignatures, t,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setProcessedData(null);
    }
  };

  if (!isMounted) return null;

  return (
    <main className="relative min-h-dvh flex flex-col items-center py-12 px-4 sm:px-8 selection:bg-accent/30 selection:text-accent">
      {/* Background ambient orbs */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/10 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-emerald-700/10 blur-[100px] rounded-full pointer-events-none z-0" />

      <div className="z-10 w-full max-w-6xl">
        <DashboardHeader lang={lang} onLangChange={(l: Language) => setLang(l)} />

        <AnimatePresence mode="wait">
          {!processedData && !isProcessing ? (
            <SetupGrid
              t={t}
              rules={rules}
              selectedRuleId={selectedRuleId}
              selectedModel={selectedModel}
              apiKey={apiKey}
              showApiKey={showApiKey}
              userPrompt={userPrompt}
              file={file}
              generationMode={generationMode}
              ganttTheme={ganttTheme}
              targetChapter={targetChapter}
              isProcessing={isProcessing}
              onRuleChange={setSelectedRuleId}
              onModelChange={setSelectedModel}
              onApiKeyChange={handleApiKeyChange}
              onToggleShowApiKey={() => setShowApiKey(!showApiKey)}
              onUserPromptChange={setUserPrompt}
              onFileChange={handleFileChange}
              onSubmit={handleSubmit}
              onModeChange={setGenerationMode}
              onThemeChange={(theme) => setGanttTheme(theme as GanttTheme)}
              onTargetChapterChange={setTargetChapter}
            />
          ) : isProcessing ? (
            <ProcessingView t={t} />
          ) : processedData && (
            <ResultsView
              t={t}
              processedData={processedData}
              generationMode={generationMode}
              ganttTheme={ganttTheme}
              editableGanttData={editableGanttData}
              signatures={signatures}
              fileName={file?.name ?? 'document.docx'}
              onReset={() => setProcessedData(null)}
              onDownload={downloadFile}
              onThemeChange={(theme) => setGanttTheme(theme as GanttTheme)}
              onSignaturesChange={setSignatures}
              onToggleWeek={toggleWeek}
            />
          )}
        </AnimatePresence>

        {/* Footer */}
        <footer className="mt-24 pt-12 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-8 text-zinc-600">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase tracking-[0.3em]">Core Version</span>
              <span className="text-[10px] font-medium">3.4.1-alpha (Premium)</span>
            </div>
            <div className="flex flex-col border-l border-zinc-800 pl-6">
              <span className="text-[8px] font-black uppercase tracking-[0.3em]">Institutional</span>
              <span className="text-[10px] font-medium">Standard Validated</span>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-full max-w-xs overflow-hidden opacity-30 grayscale hover:grayscale-0 transition-all">
              <AdBanner />
            </div>
          </div>

          <p className="text-[8px] font-black uppercase tracking-[0.4em] opacity-20">
            {t.header.title} // {t.header.version} // {lang === 'es' ? 'PROTOCOLO DE DISEÑO ALTO' : 'HIGH END DESIGN PROTOCOL'}
          </p>
        </footer>
      </div>
    </main>
  );
}