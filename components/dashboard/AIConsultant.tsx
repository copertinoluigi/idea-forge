'use client'

import React, { useState } from 'react'
import { Sparkles, Loader2, BrainCircuit, ChevronRight, ChevronDown, History, FileText, Coins, Download, CheckCircle2, Zap, Plus, Info, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { generateAnalysis } from '@/app/actions-ai'
import { addTask } from '@/app/actions' 
import { toast } from 'sonner'

interface AIConsultantProps {
  dict: any;
  history?: any[];
  credits: number; // Saldo crediti passato dal genitore
}

interface ActionableTask {
    title: string;
    project_id: string;
    priority: 'high' | 'medium' | 'low';
    reason: string;
}

export default function AIConsultant({ dict, history = [], credits }: AIConsultantProps) {
  const [loading, setLoading] = useState(false)
  const [addingTask, setAddingTask] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null)

  // --- LOGICA DI PARSING (Preservata al 100% - ES2017 Compatibile) ---
  const parseAnalysis = (content: string) => {
    const startTag = '[ACTIONABLE_SUGGESTIONS_START]';
    const endTag = '[ACTIONABLE_SUGGESTIONS_END]';
    
    const startIndex = content.indexOf(startTag);
    const endIndex = content.indexOf(endTag);

    if (startIndex !== -1 && endIndex !== -1) {
        const jsonContent = content.substring(startIndex + startTag.length, endIndex).trim();
        const cleanText = content.replace(/\[ACTIONABLE_SUGGESTIONS_START\][\s\S]*?\[ACTIONABLE_SUGGESTIONS_END\]/g, '').trim();
        
        try {
            const suggestions: ActionableTask[] = JSON.parse(jsonContent);
            return { cleanText, suggestions };
        } catch (e) {
            console.error("Failed to parse AI suggestions JSON", e);
            return { cleanText: content, suggestions: [] };
        }
    }
    return { cleanText: content, suggestions: [] };
  }

  // --- AZIONE INIEZIONE TASK (Preservata al 100%) ---
  const handleAddTask = async (task: ActionableTask) => {
    setAddingTask(task.title);
    try {
        const formData = new FormData();
        formData.append('title', task.title);
        formData.append('projectId', task.project_id); 
        formData.append('priority', task.priority);
        
        const result = await addTask(formData);

        if (result?.success) {
            toast.success(`Directive injected: ${task.title}`);
        } else {
            toast.error(`Injection failed: ${result?.error || 'Database constraint violation'}`);
        }
    } catch (error) {
        toast.error("Network error during node injection");
    } finally {
        setAddingTask(null);
    }
  }

  // --- DOWNLOAD MEMO (Preservata al 100%) ---
  const downloadMemo = (content: string, date: string) => {
    const { cleanText } = parseAnalysis(content);
    const blob = new Blob([cleanText], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const cleanDate = date.split('T')[0] || 'today'
    a.download = `MindHub-Strategic-Memo-${cleanDate}.txt`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // --- GENERAZIONE (Preservata al 100%) ---
  const handleGenerate = async () => {
    setLoading(true)
    try {
      const text = await generateAnalysis('en')
      setAnalysis(text)
      toast.success("Strategic analysis complete")
    } catch (error: any) {
      if (error.message === 'NO_CREDITS') toast.error(dict.insufficient || "No credits left")
      else toast.error(dict.error || "AI service error")
    } finally {
      setLoading(false)
    }
  }

  // --- HELPER VISIVO (OTTIMIZZATO PER LEGGIBILITÀ) ---
  const ReportDisplay = ({ content }: { content: string }) => {
    const { cleanText, suggestions } = parseAnalysis(content);
    
    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Il testo ora usa 'text-inherit' per ereditare il bianco quando è nel box nero, o slate quando è nel bianco */}
            <pre className="whitespace-pre-wrap font-sans text-sm md:text-base leading-relaxed opacity-90 p-6 rounded-2xl border border-current/10 shadow-inner bg-current/5">
                {cleanText}
            </pre>

            {suggestions.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-rose-500 font-black uppercase tracking-widest text-[10px]">
                        <Zap className="h-4 w-4 fill-current" /> Strategic Directives Injected
                    </div>
                    <div className="grid gap-3">
                        {suggestions.map((task: any, idx: number) => (
                            <div key={idx} className="group bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all hover:border-rose-500/50">
                                <div className="space-y-1 text-left">
                                    <div className="flex items-center gap-2">
                                        <span className={`h-1.5 w-1.5 rounded-full ${task.priority === 'high' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]' : 'bg-amber-500'}`} />
                                        <p className="font-bold text-sm uppercase tracking-tight">{task.title}</p>
                                    </div>
                                    <p className="text-[10px] opacity-60 font-medium italic pl-3.5">
                                        {task.reason || "Operational necessity identified."}
                                    </p>
                                </div>
                                <Button 
                                    size="sm" 
                                    disabled={addingTask === task.title}
                                    onClick={() => handleAddTask(task)}
                                    className="bg-rose-600 hover:bg-rose-500 text-white font-black text-[10px] uppercase tracking-widest px-6 rounded-xl h-10 shadow-lg active:scale-95 transition-all shrink-0"
                                >
                                    {addingTask === task.title ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} className="mr-1.5" />}
                                    Inject
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
  }

  return (
    <div className="space-y-6 font-sans">
      <Card className="bg-white border-2 border-rose-50 rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden">
        {/* Glow decorativo per dare profondità */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
        
        {/* HEADER UNIFICATO */}
        <div className="flex flex-row items-start justify-between gap-4 mb-8">
            <div className="space-y-1">
                <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-slate-900 italic uppercase tracking-tighter leading-none">Co-Founder Insights</h3>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-100 text-rose-700 text-[9px] font-bold uppercase tracking-tighter shadow-sm">
                        <Coins size={10} className="fill-rose-500/20" /> {credits} Credits
                    </div>
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">STRATEGIC CONTEXT ANALYSIS</p>
            </div>
            <div className="shrink-0 p-2.5 bg-rose-600 rounded-xl text-white shadow-lg shadow-rose-200 animate-pulse">
                <BrainCircuit size={18} />
            </div>
        </div>

        <div className="space-y-8 relative z-10 text-center"> {/* Aggiunto text-center */}
            <p className="text-sm text-slate-500 leading-relaxed max-w-xl mx-auto font-medium"> {/* mx-auto per centrare testo */}
                {dict.how_desc || 'Real-time strategic analysis of your burn rate, velocity and project margins.'}
            </p>
            
            {/* Bottone centrato e stilizzato */}
            <div className="flex justify-center pt-2">
                <Button 
                    onClick={handleGenerate} 
                    disabled={loading} 
                    className="h-20 px-12 bg-rose-600 hover:bg-slate-900 text-white rounded-3xl font-black uppercase tracking-[0.2em] text-xs shadow-[0_20px_50px_rgba(225,29,72,0.2)] transition-all active:scale-95 group/btn border-b-4 border-rose-800 active:border-b-0"
                >
                    {loading ? <Loader2 className="mr-3 animate-spin" /> : <Sparkles className="mr-3 fill-rose-300" />}
                    {loading ? "Decrypting Data..." : "Generate Board Report"}
                </Button>
            </div>

            {analysis && <div className="mt-10 pt-10 border-t border-slate-100 text-left"><ReportDisplay content={analysis} /></div>}
        </div>

        <div className="mt-8 flex items-start gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest border-t border-slate-50 pt-4 opacity-70 italic">
            <Info className="h-3.5 w-3.5 shrink-0 text-indigo-400" />
            <p>Each execution consumes 1 AI Credit. Data remains private and ephemeral.</p>
        </div>
      </Card>

      {/* 2. HISTORY LIST (DNA: CRITICAL INITIATIVES STYLE) */}
      {history && history.length > 0 && (
        <div className="space-y-4 pt-4 font-sans">
          <div className="flex items-center justify-between px-4">
            <h3 className="text-sm font-bold uppercase italic tracking-tighter text-slate-400 flex items-center gap-2">
              <History className="h-4 w-4" /> Strategy Archive
            </h3>
          </div>

          <div className="grid gap-3">
            {history.slice(0, 5).map((report) => {
              const isExpanded = expandedReportId === report.id
              return (
                <div key={report.id} className="space-y-2">
                  <Card 
                    className={`bg-white border-slate-100 rounded-3xl transition-all hover:border-indigo-100 ${isExpanded ? 'shadow-lg ring-1 ring-indigo-100' : 'shadow-sm'}`}
                  >
                    <CardContent className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-colors ${isExpanded ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-50 text-slate-400'}`}>
                          <FileText size={20} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 uppercase tracking-tight italic">
                             Memo: {new Date(report.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 opacity-60">
                            Authorized at {new Date(report.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setExpandedReportId(isExpanded ? null : report.id)}
                        className={`rounded-xl text-[10px] font-black uppercase tracking-widest h-10 px-4 transition-all ${isExpanded ? 'text-slate-500 bg-slate-100' : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white'}`}
                      >
                        {isExpanded ? <>Close <ChevronDown className="h-3.5 w-3.5" /></> : <>Review <ChevronRight className="h-3.5 w-3.5" /></>}
                      </Button>
                    </CardContent>
                  </Card>
                  {isExpanded && (
    <div className="p-8 bg-slate-900 rounded-[2.5rem] animate-in zoom-in-95 duration-200 border border-white/5 mx-2 shadow-2xl text-slate-100"> {/* Aggiunto text-slate-100 qui */}
        <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-6">
            <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-rose-400" />
                <span className="text-[10px] font-black uppercase text-white/40 tracking-widest italic">Historical Strategy Context</span>
            </div>
             <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => downloadMemo(report.content, report.created_at)}
                className="text-[10px] font-bold h-8 rounded-lg text-white hover:bg-white/10 gap-2 border border-white/10"
             >
                <Download className="h-3 w-3" /> Export Memo
             </Button>
        </div>
        <ReportDisplay content={report.content} />
    </div>
)}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
