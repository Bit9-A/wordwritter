'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileArrowUp, 
  Gear, 
  Key, 
  Lightning, 
  FileText, 
  CheckCircle, 
  ArrowRight, 
  CircleNotch, 
  Eye, 
  EyeSlash, 
  Palette, 
  DownloadSimple, 
  WarningCircle, 
  ChatTeardropText,
  CaretRight,
  TerminalWindow,
  Briefcase,
  User,
  ProjectorScreenChart,
  HardDrives,
  Translate
} from '@phosphor-icons/react';
import { getRevisionRules, RevisionRule } from '@/lib/rules';
import { translations, Language } from '@/lib/i18n';

// Spring physics for all animations
const spring = { type: "spring" as const, stiffness: 100, damping: 20 };

export default function Home() {
  const [rules, setRules] = useState<RevisionRule[]>([]);
  const [selectedRuleId, setSelectedRuleId] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [lang, setLang] = useState<Language>('es');
  const [processedData, setProcessedData] = useState<any>(null);
  const [result, setResult] = useState<string | null>(null);
  const [generationMode, setGenerationMode] = useState<'both' | 'word' | 'gantt'>('both');
  const [selectedModel, setSelectedModel] = useState('gemini-3-flash-preview');
  const [ganttTheme, setGanttTheme] = useState('institutional');
  const [apiKey, setApiKey] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  
  // States for Gantt Editor
  const [editableGanttData, setEditableGanttData] = useState<any[]>([]);
  const [signatures, setSignatures] = useState({
    tutorAcademico: '',
    tutorInstitucional: '',
    pasante: ''
  });
  
  const t = translations[lang];

  useEffect(() => {
    setRules(getRevisionRules());
    if (getRevisionRules().length > 0) {
      setSelectedRuleId(getRevisionRules()[0].id);
    }
    
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) setApiKey(savedKey);
    setIsMounted(true);

    try {
      if ((window as any).adsbygoogle) {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      }
    } catch (e) {
      console.warn("AdSense pending or blocked.");
    }
  }, []);

  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    localStorage.setItem('gemini_api_key', value);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setProcessedData(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !selectedRuleId || !apiKey) return;

    setIsProcessing(true);
    setResult(null);
    setProcessedData(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('ruleId', selectedRuleId);
    formData.append('includeGantt', String(generationMode !== 'word'));
    formData.append('generationMode', generationMode);
    formData.append('model', selectedModel);
    formData.append('apiKey', apiKey);
    formData.append('userPrompt', userPrompt);
    formData.append('language', lang);

    try {
      const response = await fetch('/api/process', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || t.errors.processError);
      }

      const data = await response.json();
      setProcessedData(data);
      
      setEditableGanttData(data.capitulo3?.diagramaGanttData || []);
      setSignatures({
        tutorAcademico: data.firmasGantt?.tutorAcademico || '',
        tutorInstitucional: data.firmasGantt?.tutorInstitucional || '',
        pasante: data.firmasGantt?.pasante || `${data.portada.nombres} ${data.portada.apellidos}`
      });

      setResult(generationMode !== 'word'
        ? t.results.ready 
        : t.results.title);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleWeek = (objIdx: number, actIdx: number, tareaIdx: number, week: number) => {
    const newData = [...editableGanttData];
    const tarea = newData[objIdx].actividades[actIdx].tareas[tareaIdx];
    if (tarea.semanas.includes(week)) {
      tarea.semanas = tarea.semanas.filter((w: number) => w !== week);
    } else {
      tarea.semanas = [...tarea.semanas, week].sort((a, b) => a - b);
    }
    setEditableGanttData(newData);
  };

  const downloadFile = async (endpoint: string, filename: string) => {
    if (!processedData) return;
    
    const finalData = {
      ...processedData,
      capitulo3: {
        ...processedData.capitulo3,
        diagramaGanttData: editableGanttData
      },
      firmasGantt: signatures,
      ganttTheme: ganttTheme
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalData),
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      alert("Error en la descarga: " + error.message);
    }
  };

  const selectedRule = rules.find(r => r.id === selectedRuleId);

  if (!isMounted) return null;

  return (
    <main className="relative min-h-dvh flex flex-col items-center py-12 px-4 sm:px-8 selection:bg-accent/30 selection:text-accent">
      
      {/* Background Orbs */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/10 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-emerald-700/10 blur-[100px] rounded-full pointer-events-none z-0" />

      <div className="z-10 w-full max-w-6xl">
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
            <div className="flex items-center gap-2 px-4 py-2 glass rounded-full border-zinc-800">
              <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
              <span className="text-[10px] font-black tracking-widest text-zinc-500 uppercase">Active</span>
            </div>

            {/* Language Switcher */}
            <div className="flex items-center glass rounded-full p-1 border-zinc-800">
               <button 
                onClick={() => setLang('es')}
                className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full transition-all ${lang === 'es' ? 'bg-accent text-zinc-950' : 'text-zinc-500 hover:text-white'}`}
               >
                 ES
               </button>
               <button 
                onClick={() => setLang('en')}
                className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full transition-all ${lang === 'en' ? 'bg-accent text-zinc-950' : 'text-zinc-500 hover:text-white'}`}
               >
                 EN
               </button>
            </div>
          </div>
        </motion.header>

        <AnimatePresence mode="wait">
          {!processedData && !isProcessing ? (
            <motion.div
              key="setup"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={spring}
              className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:grid-rows-2"
            >
              {/* Card 1: Configuration (Bento 4 cols) */}
              <motion.div 
                whileHover={{ y: -4 }}
                className="lg:col-span-4 glass rounded-2xl p-6 border-zinc-800 flex flex-col gap-6"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-zinc-800 rounded-lg">
                    <Gear size={20} className="text-accent" />
                  </div>
                  <h3 className="font-bold text-sm tracking-tight text-white uppercase">{t.config.title}</h3>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t.upload.ruleLabel}</label>
                    <select
                      value={selectedRuleId}
                      onChange={(e) => setSelectedRuleId(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs font-medium text-white focus:ring-1 focus:ring-accent outline-none appearance-none cursor-pointer"
                    >
                      {rules.map((rule) => (
                        <option key={rule.id} value={rule.id}>{rule.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t.config.modelLabel}</label>
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs font-medium text-white focus:ring-1 focus:ring-accent outline-none appearance-none cursor-pointer"
                    >
                      <optgroup label="Premier Models (3.x)" className="bg-zinc-950 text-accent font-bold">
                        <option value="gemini-3-flash-preview">Gemini 3 Flash (Fast & Native)</option>
                        <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Technical Heavy)</option>
                        <option value="gemini-3.1-flash-lite-preview">Gemini 3.1 Flash Lite</option>
                      </optgroup>
                      <optgroup label="Balanced Models (2.5)" className="bg-zinc-950 text-zinc-400">
                        <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                      </optgroup>
                    </select>
                  </div>
                </div>

                {selectedRule && (
                  <div className="mt-auto p-4 bg-accent/5 rounded-xl border border-accent/10">
                    <p className="text-[11px] text-zinc-400 italic leading-relaxed">
                      "{selectedRule.description}"
                    </p>
                  </div>
                )}
              </motion.div>

              {/* Card 2: Security & Prompt (Bento 4 cols) */}
              <motion.div 
                whileHover={{ y: -4 }}
                className="lg:col-span-4 glass rounded-2xl p-6 border-zinc-800 flex flex-col gap-6"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-zinc-800 rounded-lg">
                    <Key size={20} className="text-accent" />
                  </div>
                  <h3 className="font-bold text-sm tracking-tight text-white uppercase">{t.config.subtitle}</h3>
                </div>

                <div className="space-y-4 flex-1 flex flex-col">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t.config.apiKeyLabel}</label>
                      <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-[9px] font-black text-accent hover:opacity-70 transition-opacity">GET KEY</a>
                    </div>
                    <div className="relative">
                      <input
                        type={showApiKey ? "text" : "password"}
                        value={apiKey}
                        onChange={(e) => handleApiKeyChange(e.target.value)}
                        placeholder="••••••••••••••••"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-4 pr-10 py-3 text-xs font-mono text-white focus:ring-1 focus:ring-accent outline-none"
                      />
                      <button 
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                      >
                        {showApiKey ? <EyeSlash size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 flex-1 flex flex-col">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t.config.userPromptLabel}</label>
                    <textarea
                      value={userPrompt}
                      onChange={(e) => setUserPrompt(e.target.value.slice(0, 1000))}
                      placeholder={t.config.userPromptPlaceholder}
                      className="flex-1 w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-xs font-medium text-white focus:ring-1 focus:ring-accent outline-none resize-none transition-all placeholder:text-zinc-700"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Card 3: Upload Central (Bento 4 cols, 2 rows height) */}
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
                    <input type="file" accept=".docx" onChange={handleFileChange} className="hidden" />
                  </label>

                  <motion.button
                    disabled={!file || !apiKey}
                    onClick={handleSubmit}
                    whileTap={{ scale: 0.95 }}
                    className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all ${
                      !file || !apiKey ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-50' : 'bg-accent text-zinc-950 shadow-[0_0_40px_-10px_rgba(16,185,129,0.5)] hover:scale-[1.02]'
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

              {/* Card 4: Mode Selection (Bento 8 cols) */}
              <motion.div 
                whileHover={{ y: -4 }}
                className="lg:col-span-8 glass rounded-2xl p-6 border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-8"
              >
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t.config.generationMode}</label>
                  <p className="text-xs text-zinc-400 font-medium">{t.upload.ruleDescription}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'both', label: t.config.modeBoth, icon: CheckCircle },
                    { id: 'word', label: t.config.modeWord, icon: FileText },
                    { id: 'gantt', label: t.config.modeGantt, icon: ProjectorScreenChart },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => setGenerationMode(mode.id as any)}
                      className={`px-5 py-3 rounded-xl flex items-center gap-2 text-xs font-bold transition-all border ${
                        generationMode === mode.id 
                        ? 'bg-accent border-accent text-zinc-950' 
                        : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-600'
                      }`}
                    >
                      <mode.icon size={16} />
                      {mode.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          ) : isProcessing ? (
            <motion.div
              key="processing"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              className="flex flex-col items-center justify-center py-24 gap-12"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-accent/20 blur-[100px] rounded-full scale-150 animate-pulse" />
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="relative w-48 h-48 rounded-full border-4 border-zinc-800 flex items-center justify-center"
                >
                  <div className="absolute top-0 w-4 h-4 bg-accent rounded-full -translate-y-2 shadow-[0_0_15px_rgba(16,185,129,1)]" />
                  <CircleNotch size={80} className="text-zinc-600 animate-spin" />
                </motion.div>
              </div>

              <div className="text-center space-y-4">
                <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">{t.loading.title}</h2>
                <p className="text-zinc-500 font-medium max-w-sm mx-auto text-xs uppercase tracking-widest">
                  {t.loading.subtitle}
                </p>
              </div>

              <div className="w-full max-w-md bg-zinc-900/50 border border-zinc-800 rounded-2xl p-1 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 15, ease: "easeInOut" }}
                  className="h-2 bg-accent shadow-[0_0_10px_rgba(16,185,129,0.5)] rounded-full"
                />
              </div>

              <div className="flex gap-8 text-[10px] font-black text-zinc-700 uppercase tracking-[0.2em] animate-pulse">
                <span>Core.v3</span>
                <span>Analytic_Active</span>
                <span>Hierarchical_Map</span>
              </div>
            </motion.div>
          ) : (
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
                    <h2 className="text-2xl font-black text-white tracking-tight uppercase">{processedData.portada?.nombres ? `${processedData.portada.nombres} ${processedData.portada.apellidos}` : t.results.title}</h2>
                    <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest mt-1">{t.results.subtitle}</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap justify-center gap-3">
                  {generationMode !== 'gantt' && (
                    <motion.button
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => downloadFile('/api/export/word', `final_${file?.name}`)}
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
                      onClick={() => downloadFile('/api/export/excel', `gantt_${file?.name.replace('.docx', '')}.xlsx`)}
                      className="px-6 py-4 bg-accent text-zinc-950 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2"
                    >
                      <ProjectorScreenChart size={18} />
                      {t.actions.exportExcel}
                    </motion.button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={() => setProcessedData(null)}
                    className="p-4 glass rounded-2xl text-zinc-400 border-zinc-800 hover:text-white"
                  >
                    <ArrowRight size={18} className="rotate-180" />
                  </motion.button>
                </div>
              </div>
              {/* Gantt Interactive Editor */}
              {generationMode !== 'word' && editableGanttData.length > 0 && (
                <div className="space-y-6">
                  {/* Firmas / Personal Details Card */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { key: 'tutorAcademico', label: t.results.nodeIdentity === 'Identity' ? 'Academic Tutor' : 'Tutor Académico', icon: User },
                      { key: 'tutorInstitucional', label: t.results.nodeIdentity === 'Identity' ? 'Institutional Tutor' : 'Tutor Institucional', icon: Briefcase },
                      { key: 'pasante', label: t.results.nodeIdentity === 'Identity' ? 'Intern' : 'Pasante', icon: Lightning }
                    ].map((sig) => (
                      <div key={sig.key} className="glass rounded-2xl p-6 border-zinc-800 space-y-3">
                        <div className="flex items-center gap-2">
                           <sig.icon size={14} className="text-accent" />
                           <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{sig.label}</label>
                        </div>
                        <input 
                          type="text" 
                          value={(signatures as any)[sig.key]} 
                          onChange={(e) => setSignatures({...signatures, [sig.key]: e.target.value})}
                          placeholder={t.results.nodeIdentity === 'Identity' ? 'Legal Name' : 'Nombre Completo'}
                          className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-xs font-bold text-white focus:ring-1 focus:ring-accent outline-none"
                        />
                      </div>
                    ))}
                  </div>

                  {/* The Technical Grid Component */}
                  <div className="glass rounded-3xl border-zinc-800 overflow-hidden">
                    <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <TerminalWindow size={20} className="text-zinc-500" />
                        <h3 className="text-xs font-black text-white uppercase tracking-widest">{t.results.subtitle}</h3>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-600 rounded-sm" />
                          <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Active Slot</span>
                        </div>
                        <select
                          value={ganttTheme}
                          onChange={(e) => setGanttTheme(e.target.value)}
                          className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-[9px] font-black text-zinc-400 uppercase tracking-widest focus:ring-1 focus:ring-accent outline-none"
                        >
                          <option value="institutional">System Minimal</option>
                          <option value="corporate">Corporate Bold</option>
                          <option value="academic">Academic High</option>
                          <option value="modern">Modern Liquid</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-zinc-900/50">
                            <th className="p-4 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] min-w-75">{t.results.nodeIdentity}</th>
                            {t.results.weeks.split(' ').map((week, i) => (
                              <th key={i} className="p-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center border-l border-zinc-800 w-10">
                                {week}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                          {editableGanttData.map((obj: any, objIdx: number) => (
                            obj.actividades.map((act: any, actIdx: number) => (
                              act.tareas.map((tarea: any, tareaIdx: number) => (
                                <tr key={`${objIdx}-${actIdx}-${tareaIdx}`} className="group hover:bg-zinc-800/20 transition-colors">
                                  <td className="p-4 space-y-2">
                                     {actIdx === 0 && tareaIdx === 0 && (
                                       <div className="flex items-center gap-2 text-[10px] font-black text-accent uppercase tracking-widest mb-1">
                                          <CaretRight size={10} weight="bold" />
                                          {obj.objetivo}
                                       </div>
                                     )}
                                     {tareaIdx === 0 && (
                                       <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1 pl-4 opacity-70">{act.descripcion}</div>
                                     )}
                                     <div className="text-[11px] font-medium text-zinc-300 pl-8 flex items-center gap-2">
                                        <div className="w-1 h-3 bg-zinc-700 rounded-full" />
                                        {tarea.descripcion}
                                     </div>
                                  </td>
                                  {Array.from({ length: 14 }, (_, i) => {
                                    const isSelected = tarea.semanas.includes(i + 1);
                                    return (
                                      <td 
                                        key={i} 
                                        onClick={() => toggleWeek(objIdx, actIdx, tareaIdx, i + 1)}
                                        className={`cursor-pointer border-l border-zinc-800 transition-all relative ${isSelected ? 'bg-red-600/20' : 'hover:bg-accent/5'}`}
                                      >
                                        {isSelected && (
                                          <motion.div 
                                            layoutId={`blob-${objIdx}-${actIdx}-${tareaIdx}-${i}`}
                                            className="absolute inset-2 bg-red-600 rounded-sm shadow-[0_0_10px_rgba(220,38,38,0.5)]" 
                                          />
                                        )}
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))
                            ))
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer / Info */}
        <motion.footer 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-24 pt-12 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-8 text-zinc-600"
        >
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
                {/* AdSense Space */}
                <ins className="adsbygoogle"
                     style={{ display: 'block' }}
                     data-ad-client="ca-pub-6219970220596393"
                     data-ad-slot="8730014249"
                     data-ad-format="auto"
                     data-full-width-responsive="true"></ins>
             </div>
          </div>

          <p className="text-[8px] font-black uppercase tracking-[0.4em] opacity-20">
            {t.header.title} // {t.header.version} // {lang === 'es' ? 'PROTOCOLO DE DISEÑO ALTO' : 'HIGH END DESIGN PROTOCOL'}
          </p>
        </motion.footer>
      </div>
    </main>
  );
}