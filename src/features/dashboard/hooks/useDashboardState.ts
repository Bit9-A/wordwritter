// ============================================================
// useDashboardState — Estado Centralizado del Dashboard
// Principio SRP: Solo gestiona estado, no tiene lógica de negocio ni JSX
// Principio DRY: Un único hook para todos los estados relacionados
// ============================================================
'use client';

import { useState, useEffect } from 'react';
import { getRevisionRules } from '@/lib/rules';
import { translations, type Language } from '@/lib/i18n';
import type {
  DashboardState,
  GenerationMode,
  GanttTheme,
  GanttObjective,
  Signatures,
  TargetChapter,
} from '@/types/dashboard';

interface UseDashboardStateReturn extends DashboardState {
  t: typeof translations.es;
  setSelectedRuleId: (id: string) => void;
  setFile: (file: File | null) => void;
  setIsProcessing: (v: boolean) => void;
  setLang: (lang: Language) => void;
  setProcessedData: (data: any) => void;
  setResult: (r: string | null) => void;
  setGenerationMode: (mode: GenerationMode) => void;
  setSelectedModel: (model: string) => void;
  setGanttTheme: (theme: GanttTheme) => void;
  setApiKey: (key: string) => void;
  setUserPrompt: (prompt: string) => void;
  setShowApiKey: (v: boolean) => void;
  setEditableGanttData: (data: GanttObjective[]) => void;
  setSignatures: (sigs: Signatures) => void;
  setTargetChapter: (chapter: TargetChapter) => void;
  handleApiKeyChange: (value: string) => void;
}

export function useDashboardState(): UseDashboardStateReturn {
  const [rules, setRules] = useState(getRevisionRules());
  const [selectedRuleId, setSelectedRuleId] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [lang, setLang] = useState<Language>('es');
  const [processedData, setProcessedData] = useState<any>(null);
  const [result, setResult] = useState<string | null>(null);
  const [generationMode, setGenerationMode] = useState<GenerationMode>('both');
  const [selectedModel, setSelectedModel] = useState('gemini-3-flash-preview');
  const [ganttTheme, setGanttTheme] = useState<GanttTheme>('institutional');
  const [apiKey, setApiKey] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [editableGanttData, setEditableGanttData] = useState<GanttObjective[]>([]);
  const [signatures, setSignatures] = useState<Signatures>({
    tutorAcademico: '',
    tutorInstitucional: '',
    pasante: '',
  });
  const [targetChapter, setTargetChapter] = useState<TargetChapter>('all');

  useEffect(() => {
    const allRules = getRevisionRules();
    setRules(allRules);
    if (allRules.length > 0) {
      setSelectedRuleId(allRules[0].id);
    }
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) setApiKey(savedKey);
    setIsMounted(true);

    // AdSense initialization - non-critical
    try {
      if ((window as any).adsbygoogle) {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      }
    } catch {
      console.warn('AdSense pending or blocked.');
    }
  }, []);

  // Persists API key to localStorage automatically
  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    localStorage.setItem('gemini_api_key', value);
  };

  const t = translations[lang];

  return {
    rules, selectedRuleId, setSelectedRuleId,
    file, setFile,
    isProcessing, setIsProcessing,
    isMounted,
    lang, setLang,
    processedData, setProcessedData,
    result, setResult,
    generationMode, setGenerationMode,
    selectedModel, setSelectedModel,
    ganttTheme, setGanttTheme,
    apiKey, setApiKey,
    userPrompt, setUserPrompt,
    showApiKey, setShowApiKey,
    editableGanttData, setEditableGanttData,
    signatures, setSignatures,
    targetChapter, setTargetChapter,
    handleApiKeyChange,
    t,
  };
}
