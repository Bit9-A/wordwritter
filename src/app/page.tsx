'use client';

import { useState, useEffect } from 'react';
import { getRevisionRules, RevisionRule } from '@/lib/rules';
import { Upload, FileText, CheckCircle, ArrowRight, Loader2, Settings, Key, Eye, EyeOff, ExternalLink, Palette, ChevronRight, Download, AlertCircle, MessageSquare } from 'lucide-react';

export default function Home() {
  const [rules, setRules] = useState<RevisionRule[]>([]);
  const [selectedRuleId, setSelectedRuleId] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processedData, setProcessedData] = useState<any>(null);
  const [result, setResult] = useState<string | null>(null);
  const [includeGantt, setIncludeGantt] = useState(true);
  const [generationMode, setGenerationMode] = useState<'both' | 'word' | 'gantt'>('both');
  const [selectedModel, setSelectedModel] = useState('gemini-3-flash-preview');
  const [ganttTheme, setGanttTheme] = useState('institutional');
  const [apiKey, setApiKey] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  
  // Estados para la edición interactiva
  const [editableGanttData, setEditableGanttData] = useState<any[]>([]);
  const [signatures, setSignatures] = useState({
    tutorAcademico: '',
    tutorInstitucional: '',
    pasante: ''
  });

  useEffect(() => {
    setRules(getRevisionRules());
    if (getRevisionRules().length > 0) {
      setSelectedRuleId(getRevisionRules()[0].id);
    }
    
    // Cargar API Key de localStorage
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) setApiKey(savedKey);
    setIsMounted(true);

    // Inicializar anuncios de Google si existen en el DOM
    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch (e) {
      console.error("AdSense error:", e);
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

    try {
      const response = await fetch('/api/process', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al procesar el documento');
      }

      const data = await response.json();
      setProcessedData(data);
      
      // Inicializar datos editables
      setEditableGanttData(data.capitulo3.diagramaGanttData || []);
      setSignatures({
        tutorAcademico: data.firmasGantt?.tutorAcademico || '',
        tutorInstitucional: data.firmasGantt?.tutorInstitucional || '',
        pasante: data.firmasGantt?.pasante || `${data.portada.nombres} ${data.portada.apellidos}`
      });

      setResult(generationMode !== 'word'
        ? "Documento procesado. Ahora puedes ajustar el Cronograma de 3 Niveles." 
        : "Documento procesado exitosamente.");
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
    
    // Preparar data final con ediciones
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
      alert("Error al descargar el archivo: " + error.message);
    }
  };

  const selectedRule = rules.find(r => r.id === selectedRuleId);

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
            WordWritter
          </h1>
          <p className="text-lg text-gray-600">
            Revisión académica y generación de diagramas institucionales
          </p>
        </div>

        <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Columna Izquierda: Configuración */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <label className="flex items-center text-sm font-bold text-gray-700 uppercase tracking-wider">
                    <Settings className="w-4 h-4 mr-2 text-indigo-500" />
                    Regla de Revisión
                  </label>
                  <select
                    value={selectedRuleId}
                    onChange={(e) => setSelectedRuleId(e.target.value)}
                    className="block w-full pl-3 pr-10 py-3 text-base text-gray-900 border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm rounded-xl border appearance-none bg-white font-medium"
                  >
                    {rules.map((rule) => (
                      <option key={rule.id} value={rule.id} className="text-gray-900">
                        {rule.name}
                      </option>
                    ))}
                  </select>
                  {selectedRule && (
                    <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                      <p className="text-sm text-indigo-800 italic leading-relaxed">
                        {selectedRule.description}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <label className="flex items-center text-sm font-bold text-gray-700 uppercase tracking-wider">
                    <Loader2 className="w-4 h-4 mr-2 text-indigo-500" />
                    Inteligencia Artificial (Modelo)
                  </label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="block w-full pl-3 pr-10 py-3 text-base text-gray-900 border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm rounded-xl border appearance-none bg-white font-medium"
                  >
                    <optgroup label="Última Generación (Gemini 3)">
                      <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview</option>
                      <option value="gemini-3-flash-preview">gemini-3-flash-preview</option>
                      <option value="gemini-3.1-flash-lite-preview">gemini-3.1-flash-lite-preview</option>
                    </optgroup>
                    <optgroup label="Generación Anterior / Otros">
                      <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                      <option value="gemini-1.5-pro">gemini-1.5-pro</option>
                      <option value="gemini-1.5-flash">gemini-1.5-flash</option>
                    </optgroup>
                  </select>
                  <p className="text-[10px] text-gray-400 italic leading-tight">
                    * Pro es más lento pero más inteligente. Flash es optimizado para velocidad.
                  </p>
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center text-sm font-bold text-gray-700 uppercase tracking-wider">
                      <Key className="w-4 h-4 mr-2 text-yellow-500" />
                      Google Gemini API Key <span className="text-red-500 ml-1">*</span>
                    </label>
                    <a 
                      href="https://aistudio.google.com/app/apikey" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center bg-indigo-50 px-2 py-1 rounded-md"
                    >
                      <ExternalLink size={10} className="mr-1" />
                      OBTENER KEY
                    </a>
                  </div>
                  <div className="relative">
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={apiKey}
                      onChange={(e) => handleApiKeyChange(e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full pl-4 pr-12 py-3 text-sm text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-300"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                    >
                      {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-400 italic">
                    * Obligatorio para procesar el documento. Se guarda localmente.
                  </p>
                </div>

                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <label className="flex items-center text-sm font-bold text-gray-700 uppercase tracking-wider">
                    <MessageSquare className="w-4 h-4 mr-2 text-blue-500" />
                    Instrucciones Específicas
                  </label>
                  <textarea
                    value={userPrompt}
                    onChange={(e) => setUserPrompt(e.target.value.slice(0, 1000))}
                    placeholder="Ej: Mantén un tono formal, enfatiza la metodología técnica, etc."
                    className="w-full p-4 text-sm text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-25 resize-none"
                  />
                  <div className="flex justify-end">
                    <span className="text-[10px] text-gray-400 font-medium">
                      {userPrompt.length} / 1000 caracteres
                    </span>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <label className="flex items-center text-sm font-bold text-gray-700 uppercase tracking-wider">
                    <FileText className="w-4 h-4 mr-2 text-indigo-500" />
                    Modo de Procesamiento
                  </label>
                  
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={() => setGenerationMode('both')}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${generationMode === 'both' ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300'}`}
                    >
                      <div className="flex items-center">
                        <CheckCircle size={18} className="mr-2" />
                        <span className="text-sm font-bold">Word + Gantt</span>
                      </div>
                      {generationMode === 'both' && <div className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full uppercase font-black">Recomendado</div>}
                    </button>

                    <button
                      type="button"
                      onClick={() => setGenerationMode('word')}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${generationMode === 'word' ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300'}`}
                    >
                      <div className="flex items-center">
                        <FileText size={18} className="mr-2" />
                        <span className="text-sm font-bold">Solo Word</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setGenerationMode('gantt')}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${generationMode === 'gantt' ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300'}`}
                    >
                      <div className="flex items-center">
                        <Palette size={18} className="mr-2" />
                        <span className="text-sm font-bold">Solo Gantt</span>
                      </div>
                    </button>
                  </div>

                  {generationMode !== 'word' && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300 pt-2 border-t border-gray-50">
                      <label className="flex items-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        <Palette className="w-3 h-3 mr-1 text-indigo-500" />
                        Estilo Visual del Diagrama
                      </label>
                      <select
                        value={ganttTheme}
                        onChange={(e) => setGanttTheme(e.target.value)}
                        className="block w-full pl-3 pr-10 py-2 text-xs text-gray-900 border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg border appearance-none bg-white font-semibold"
                      >
                        <option value="institutional">Institucional (Clásico)</option>
                        <option value="corporate">Corporativo (Moderno)</option>
                        <option value="academic">Académico (Técnico)</option>
                        <option value="modern">Moderno (Premium)</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Bloque de Anuncio (Google AdSense) */}
                <div className="pt-6 border-t border-gray-100 flex justify-center overflow-hidden">
                  <div className="w-full max-w-xs bg-gray-50 rounded-xl overflow-hidden min-h-25 border border-gray-100 p-2">
                    {/* App */}
                    {isMounted && (
                      <ins className="adsbygoogle"
                           style={{ display: 'block' }}
                           data-ad-client="ca-pub-6219970220596393"
                           data-ad-slot="8730014249"
                           data-ad-format="auto"
                           data-full-width-responsive="true"></ins>
                    )}
                    <p className="text-[8px] text-gray-300 text-center mt-1 uppercase font-bold tracking-widest">Publicidad</p>
                  </div>
                </div>
              </div>

              {/* Columna Derecha: Archivo */}
              <div className="space-y-4">
                <label className="flex items-center text-sm font-bold text-gray-700 uppercase tracking-wider">
                  <FileText className="w-4 h-4 mr-2 text-indigo-500" />
                  Archivo Word (.docx)
                </label>
                <div className="mt-1 flex justify-center px-6 pt-10 pb-10 border-2 border-gray-200 border-dashed rounded-2xl hover:border-indigo-400 transition-all bg-gray-50/50">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-transparent rounded-md font-bold text-indigo-600 hover:text-indigo-500 focus-within:outline-none"
                      >
                        <span>Selecciona un documento</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".docx" onChange={handleFileChange} />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500">Solo archivos .docx universitarios</p>
                  </div>
                </div>
                {file && (
                  <div className="flex items-center space-x-2 text-sm text-indigo-600 font-medium bg-indigo-50 p-2 rounded-lg">
                    <CheckCircle className="w-4 h-4" />
                    <span>{file.name}</span>
                  </div>
                )}
              </div>
            </div>

            {isProcessing && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 space-y-4 animate-pulse">
                <div className="flex items-center justify-between text-sm font-bold text-indigo-900">
                  <span className="flex items-center">
                    <Loader2 className="animate-spin w-4 h-4 mr-2" />
                    ANALIZANDO DOCUMENTO...
                  </span>
                  <span>ESTO PUEDE TARDAR UN MOMENTO...</span>
                </div>
                <div className="w-full bg-indigo-200 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-full rounded-full animate-progress-indeterminate"
                  ></div>
                </div>
                <p className="text-xs text-indigo-600 text-center font-medium">
                  Estamos extrayendo objetivos, tareas y estructurando tu cronograma de 14 semanas. 
                  Por favor, mantén esta ventana abierta.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={!file || isProcessing}
              className={`w-full flex items-center justify-center py-4 px-4 rounded-xl shadow-lg text-lg font-bold text-white transition-all transform active:scale-95 ${
                !file || isProcessing ? 'bg-gray-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-200'
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" />
                  Trabajando...
                </>
              ) : (
                <>
                  Iniciar Procesamiento
                  <ArrowRight className="ml-2 h-6 w-6" />
                </>
              )}
            </button>
          </form>

          {/* Resultado y Editor de Gantt */}
          {processedData && (
            <div className="border-t border-gray-100 p-8 bg-indigo-50/50 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-green-100 p-2 rounded-full mr-3">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-xl font-black text-indigo-950">¡Análisis Completado!</h3>
                </div>
              </div>

              {generationMode !== 'word' && editableGanttData.length > 0 && (
                <div className="space-y-6">
                  {/* Editor de Firmas */}
                  <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm space-y-4">
                    <h4 className="text-sm font-bold text-indigo-900 uppercase">Validación Institucional</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Tutor Académico</label>
                        <input 
                          type="text" 
                          value={signatures.tutorAcademico} 
                          onChange={(e) => setSignatures({...signatures, tutorAcademico: e.target.value})}
                          placeholder="Nombre y Apellidos"
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Tutor Institucional</label>
                        <input 
                          type="text" 
                          value={signatures.tutorInstitucional} 
                          onChange={(e) => setSignatures({...signatures, tutorInstitucional: e.target.value})}
                          placeholder="Nombre y Apellidos"
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Pasante</label>
                        <input 
                          type="text" 
                          value={signatures.pasante} 
                          onChange={(e) => setSignatures({...signatures, pasante: e.target.value})}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Editor Jerárquico de Gantt */}
                  <div className="overflow-hidden bg-white rounded-2xl border border-indigo-100 shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 text-[10px]">
                        <thead className="bg-indigo-900 text-white">
                          <tr>
                            <th className="px-3 py-3 text-left font-bold uppercase w-48">Objetivo / Actividad / Tareas</th>
                            {Array.from({ length: 14 }, (_, i) => (
                              <th key={i} className="px-1 py-3 text-center border-l border-indigo-800 w-8">
                                S{i + 1}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                          {editableGanttData.map((obj: any, objIdx: number) => (
                            obj.actividades.map((act: any, actIdx: number) => (
                              act.tareas.map((tarea: any, tareaIdx: number) => (
                                <tr key={`${objIdx}-${actIdx}-${tareaIdx}`} className="hover:bg-indigo-50/50 transition-colors">
                                  <td className="px-3 py-2 border-r border-gray-50">
                                     {actIdx === 0 && tareaIdx === 0 && (
                                       <div className="font-bold text-indigo-900 mb-1 border-b border-indigo-50 pb-1">{obj.objetivo}</div>
                                     )}
                                     {tareaIdx === 0 && (
                                       <div className="font-semibold text-gray-700 mb-1 pl-1 italic">{act.descripcion}</div>
                                     )}
                                     <div className="text-gray-500 pl-3 border-l border-indigo-200">— {tarea.descripcion}</div>
                                  </td>
                                  {Array.from({ length: 14 }, (_, i) => {
                                    const isSelected = tarea.semanas.includes(i + 1);
                                    return (
                                      <td 
                                        key={i} 
                                        onClick={() => toggleWeek(objIdx, actIdx, tareaIdx, i + 1)}
                                        className={`cursor-pointer border-l border-gray-50 text-center transition-all ${isSelected ? 'bg-red-600 text-white' : 'hover:bg-red-50'}`}
                                      >
                                        {isSelected ? '●' : ''}
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
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {generationMode !== 'gantt' && (
                  <button
                    onClick={() => downloadFile('/api/export/word', `revisado_${file?.name || 'documento'}`)}
                    className="flex items-center justify-center py-4 px-4 bg-white border-2 border-indigo-100 rounded-xl text-indigo-900 font-bold hover:bg-gray-50 transition-all shadow-sm"
                  >
                    <FileText className="w-5 h-5 mr-2" />
                    Descargar Word FINAL
                  </button>
                )}
                
                {generationMode !== 'word' && (
                  <button
                    onClick={() => downloadFile('/api/export/excel', `gantt_${file?.name.replace('.docx', '') || 'plan'}.xlsx`)}
                    className="flex items-center justify-center py-4 px-4 bg-indigo-600 border-2 border-indigo-600 rounded-xl text-white font-bold hover:bg-indigo-700 transition-all shadow-md active:shadow-inner"
                  >
                    <FileText className="w-5 h-5 mr-2" />
                    Descargar Excel GANTT
                  </button>
                )}
              </div>

              {result && (
                <p className="text-center text-sm text-indigo-600 italic font-medium">
                  {result}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}