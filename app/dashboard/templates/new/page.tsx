'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Loader2, Save, Sparkles, BookOpen, PenTool, ChevronRight, Search, Filter } from 'lucide-react'
import { toast } from 'sonner'
import { createTemplateAction } from '@/app/actions'
import { getDictionary } from '@/lib/translations'
import { PLAYBOOK_LIBRARY } from '@/lib/constants/playbooks'
import StrategicPulseSidebar from '@/components/dashboard/StrategicPulseSidebar'

function NewTemplateForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [view, setView] = useState<'selection' | 'library' | 'form'>('selection')
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [formData, setFormData] = useState({ title: '', content: '', category: 'General' })

  
  // 1. ASCOLTA I PARAMETRI URL (Per iniezione dalla pagina lista)
  useEffect(() => {
    const injectTitle = searchParams.get('inject');
    if (injectTitle) {
        const found = PLAYBOOK_LIBRARY.flatMap(c => c.items.map(i => ({...i, cat: c.category})))
                       .find(i => i.title === injectTitle);
        if (found) {
            setFormData({ title: found.title, content: found.content, category: found.cat });
            setView('form');
        }
    }
  }, [searchParams]);

  const selectBlueprint = (item: any, cat: string) => {
    setFormData({ title: item.title, content: item.content, category: cat })
    setView('form')
    toast.success("Structure injected")
  }

  const filteredLibrary = PLAYBOOK_LIBRARY.map(cat => ({
    ...cat,
    items: cat.items.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.desc.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.items.length > 0)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    const result = await createTemplateAction(fd)
    if (!result.success) {
        toast.error(result.error || "Initialization failed")
        setLoading(false)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start animate-in slide-in-from-bottom-4 duration-500 pb-20">
        
        {/* SIDEBAR SINISTRA (Solo in vista Library) */}
        {view === 'library' && (
            <div className="w-full lg:w-64 space-y-2 lg:sticky lg:top-10 shrink-0">
                <div className="flex items-center gap-2 mb-4 px-2 text-slate-400">
                    <Filter size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Categories</span>
                </div>
                {PLAYBOOK_LIBRARY.map((cat, idx) => (
                    <button key={idx} onClick={() => document.getElementById(`cat-${idx}`)?.scrollIntoView({ behavior: 'smooth' })}
                        className="w-full text-left px-4 py-3 rounded-xl text-xs font-bold text-slate-500 hover:bg-white hover:text-indigo-600 transition-all flex items-center justify-between group">
                        {cat.category} <ChevronRight size={12} className="opacity-0 group-hover:opacity-100" />
                    </button>
                ))}
            </div>
        )}

        {/* FEED CENTRALE */}
        <div className="flex-1 space-y-8 w-full">
            {view === 'selection' && (
                <div className="grid md:grid-cols-2 gap-8 pt-6">
                    <Card onClick={() => setView('form')} className="group p-10 bg-white border border-slate-100 rounded-[2.5rem] shadow-xl hover:border-indigo-500 transition-all cursor-pointer text-center space-y-6">
                        <div className="h-20 w-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto group-hover:bg-indigo-50"><PenTool className="h-10 w-10 text-slate-400 group-hover:text-indigo-600" /></div>
                        <h3 className="text-xl font-black italic uppercase tracking-tight">Manual Input</h3>
                      <p className="text-sm text-slate-500 mt-2 font-medium">Start with a blank canvas and define everything from scratch.</p>
                        <Button variant="outline" className="rounded-full font-bold uppercase tracking-widest text-[10px]">Start Empty</Button>
                    </Card>
                    <Card onClick={() => setView('library')} className="group p-10 bg-slate-900 text-white rounded-[2.5rem] shadow-2xl hover:ring-4 hover:ring-indigo-500/20 transition-all cursor-pointer text-center space-y-6 relative overflow-hidden">
                        <Sparkles className="absolute -top-10 -right-10 h-40 w-40 text-indigo-500/10 rotate-12" />
                        <div className="h-20 w-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto backdrop-blur-xl group-hover:bg-indigo-600"><BookOpen className="h-10 w-10 text-indigo-400 group-hover:text-white" /></div>
                        <h3 className="text-xl font-black italic uppercase tracking-tight">Browse Library</h3>
                      <p className="text-sm text-slate-400 mt-2 font-medium">Use pre-configured templates, 110+ available now.</p>
                        <Button className="bg-indigo-600 hover:bg-white hover:text-indigo-600 text-white rounded-full font-bold uppercase tracking-widest text-[10px]">Open Modules</Button>
                    </Card>
                </div>
            )}

            {view === 'library' && (
                <div className="space-y-12">
                    <div className="relative group">
                        <Search className="absolute left-4 top-4 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                        <input type="text" placeholder="Search 110+ modules..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold shadow-sm focus:border-indigo-500 outline-none transition-all" />
                    </div>
                    <div className="grid gap-20">
                        {filteredLibrary.map((cat, idx) => (
                            <div key={idx} id={`cat-${idx}`} className="space-y-8 scroll-mt-10">
                                <div className="flex items-center gap-4"><div className="h-10 w-1.5 bg-indigo-600 rounded-full shadow-[0_0_15px_rgba(79,70,229,0.3)]" /><h3 className="text-lg font-black uppercase tracking-[0.2em] text-slate-800 italic">{cat.category}</h3></div>
                                <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-4">
                                    {cat.items.map((item, i) => (
                                        <div key={i} onClick={() => selectBlueprint(item, cat.category)} className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:border-indigo-500 hover:shadow-xl transition-all cursor-pointer group">
                                            <h4 className="font-bold text-slate-900 text-base mb-2 group-hover:text-indigo-600 transition-colors">{item.title}</h4>
                                            <p className="text-[11px] text-slate-500 font-medium leading-relaxed line-clamp-2">{item.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {view === 'form' && (
                <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white">
                    <CardContent className="p-10">
                        <div className="mb-10 pb-6 border-b border-slate-50 flex items-center justify-between">
                            <Button variant="ghost" onClick={() => setView('selection')} className="text-slate-400 font-bold text-xs p-0 hover:bg-transparent hover:text-indigo-600"><ArrowLeft className="mr-2 h-4 w-4" /> Reset Settings</Button>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 italic">Editor Mode</span>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="grid md:grid-cols-2 gap-8">
                                <input name="title" required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="Title" className="w-full h-14 rounded-2xl border border-slate-200 px-5 font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none" />
                                <input name="category" required value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} placeholder="Category" className="w-full h-14 rounded-2xl border border-slate-200 px-5 font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none" />
                            </div>
                            <textarea name="content" required rows={15} value={formData.content} onChange={(e) => setFormData({...formData, content: e.target.value})} className="w-full p-8 rounded-[2.5rem] border border-slate-200 font-mono text-sm leading-relaxed outline-none focus:ring-4 focus:ring-indigo-500/10 bg-slate-50/30" />
                            <Button type="submit" className="w-full h-20 bg-slate-900 hover:bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-2xl transition-all" disabled={loading}>
                                {loading ? <Loader2 className="animate-spin" /> : <Save className="mr-2" />} Secure Playbook
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}
        </div>

        {/* 3. SIDEBAR DESTRA: STRATEGIC PULSE (Componente Universale) */}
        <StrategicPulseSidebar onInject={selectBlueprint} />
    </div>
  )
}

export default function NewTemplatePage() {
  return (
    <div className="max-w-7xl mx-auto space-y-10 py-10 px-4">
      <Suspense fallback={<Loader2 className="animate-spin" />}>
        <NewTemplateForm />
      </Suspense>
    </div>
  )
}
