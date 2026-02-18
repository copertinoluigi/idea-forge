'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { 
    ArrowLeft, Loader2, Save, Briefcase, User, CheckSquare, 
    Rocket, LineChart, LayoutGrid, PenTool, Sparkles, ChevronRight,
    Globe, ShoppingCart, Smartphone, Megaphone
} from 'lucide-react'
import { toast } from 'sonner'
import { getDictionary } from '@/lib/translations'
import { createProject } from '@/app/actions'
import ProtocolDirective from '@/components/dashboard/ProtocolDirective'

// --- 1. DEFINIZIONE BLUEPRINTS (L'intelligenza pre-caricata) ---
const PROJECT_BLUEPRINTS = [
    {
        id: 'saas-mvp',
        title: 'SaaS Launchpad',
        icon: <Rocket className="text-indigo-500" />,
        description: 'Perfect for building and launching a software-as-a-service.',
        phases: ["Market Validation", "System Architecture", "MVP Development", "Beta Testing", "Stripe/Gumroad Integration", "Launch Marketing"],
        defaultDesc: "This SaaS aims to solve **[PROBLEM]** for **[TARGET AUDIENCE]**. The core value proposition is **[VALUE]**. Expected MVP timeline is **[WEEKS]**."
    },
    {
        id: 'ecommerce',
        title: 'E-Commerce MVP',
        icon: <ShoppingCart className="text-emerald-500" />,
        description: 'Setup your digital store and logistics framework.',
        phases: ["Product Sourcing", "Brand Identity", "Storefront Setup", "Payment Gateway Logic", "Logistics & Shipping Setup", "Social Launch"],
        defaultDesc: "A digital boutique focused on **[PRODUCT CATEGORY]**. Selling primarily through **[CHANNELS]**. Focus on **[USP/QUALITY]**."
    },
    {
        id: 'content-engine',
        title: 'Content Strategy',
        icon: <Megaphone className="text-rose-500" />,
        description: 'Build a 90-day authority machine for your brand.',
        phases: ["Niche Definition", "Keyword Research", "Editorial Calendar", "Production Flow", "Distribution Setup", "Analytics Review"],
        defaultDesc: "Authority building project targeting **[NICHE]**. Main platforms: **[PLATFORMS]**. Goal: **[FOLLOWER/LEAD TARGET]**."
    },
    {
        id: 'brand-identity',
        title: 'Brand DNA',
        icon: <PenTool className="text-amber-500" />,
        description: 'Foundations for a new identity or client rebranding.',
        phases: ["Archetype Definition", "Visual Exploration", "Logo & Assets", "Tone of Voice", "Guidelines Production", "Handover Documentation"],
        defaultDesc: "Identity development for **[ENTITY NAME]**. Vibe: **[ADJECTIVES]**. Target feeling: **[EMOTION]**."
    }
]

const STANDARD_PHASES = [
    "Requirements Analysis", "Market Research", "Design / Prototyping", "Development - Alpha",
    "Development - Beta", "Content Creation", "Testing & QA", "Launch / Delivery"
]

export default function NewProjectPage() {
  const router = useRouter()
  const [view, setView] = useState<'selection' | 'blueprints' | 'form'>('selection')
  const [loading, setLoading] = useState(false)
  const [type, setType] = useState('personal')
  const [selectedPhases, setSelectedPhases] = useState<string[]>([])
  const [dict, setDict] = useState<any>(null)
  
  // Form State per pre-popolamento
  const [initialData, setInitialData] = useState({ title: '', description: '' })

  useEffect(() => {
    async function loadDict() {
      const dictionary = await getDictionary('en')
      setDict(dictionary)
    }
    loadDict()
  }, [])

  const applyBlueprint = (bp: typeof PROJECT_BLUEPRINTS[0]) => {
    setInitialData({ title: bp.title, description: bp.defaultDesc })
    setSelectedPhases(bp.phases)
    setView('form')
  }

  const togglePhase = (phase: string) => {
    setSelectedPhases(prev => prev.includes(phase) ? prev.filter(p => p !== phase) : [...prev, phase])
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    formData.append('type', type)
    selectedPhases.forEach(phase => formData.append('selectedPhases', phase))

    const result = await createProject(formData)
    if (result.success) {
      toast.success('Project node initialized')
      router.push('/dashboard/projects')
      router.refresh()
    } else {
      toast.error(result.error || "Initialization failed")
      setLoading(false)
    }
  }

  if (!dict) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto h-8 w-8 text-indigo-600" /></div>

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-10 px-4 animate-in fade-in">
      
      <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/dashboard/projects" className="text-slate-400 hover:text-indigo-600 transition-colors font-bold">Projects</Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 font-bold font-mono uppercase">INIT_NEW_NODE</span>
          </div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">Initialize Project</h1>
      </div>

      {/* --- VISTA 1: SELEZIONE MODALITÀ --- */}
      {view === 'selection' && (
        <div className="grid md:grid-cols-2 gap-8 pt-10">
            <div onClick={() => setView('form')} className="group p-10 bg-white border border-slate-100 rounded-[2.5rem] shadow-xl hover:border-indigo-500 transition-all cursor-pointer text-center space-y-6">
                <div className="h-20 w-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto group-hover:bg-indigo-50 transition-colors">
                    <PenTool className="h-10 w-10 text-slate-400 group-hover:text-indigo-600" />
                </div>
                <div>
                    <h3 className="text-xl font-black italic uppercase tracking-tight">Manual Setup</h3>
                    <p className="text-sm text-slate-500 mt-2 font-medium">Start with a blank canvas and define everything from scratch.</p>
                </div>
                <Button variant="outline" className="rounded-full font-bold uppercase tracking-widest text-[10px]">Continue Manual</Button>
            </div>

            <div onClick={() => setView('blueprints')} className="group p-10 bg-slate-900 text-white rounded-[2.5rem] shadow-2xl hover:ring-4 hover:ring-indigo-500/20 transition-all cursor-pointer text-center space-y-6 relative overflow-hidden">
                <Sparkles className="absolute -top-10 -right-10 h-40 w-40 text-indigo-500/10 rotate-12" />
                <div className="h-20 w-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto backdrop-blur-xl group-hover:bg-indigo-600 transition-colors">
                    <LayoutGrid className="h-10 w-10 text-indigo-400 group-hover:text-white" />
                </div>
                <div className="relative z-10">
                    <h3 className="text-xl font-black italic uppercase tracking-tight">Project Blueprints</h3>
                    <p className="text-sm text-slate-400 mt-2 font-medium">Use pre-configured strategic models for SaaS, Content, or Brands.</p>
                </div>
                <Button className="bg-indigo-600 hover:bg-white hover:text-indigo-600 text-white rounded-full font-bold uppercase tracking-widest text-[10px]">Browse Blueprints</Button>
            </div>
        </div>
      )}

      {/* --- VISTA 2: GALLERY BLUEPRINTS --- */}
      {view === 'blueprints' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <Button variant="ghost" onClick={() => setView('selection')} className="text-slate-400 font-bold text-xs uppercase tracking-widest hover:bg-transparent hover:text-indigo-600">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to selection
            </Button>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {PROJECT_BLUEPRINTS.map(bp => (
                    <div key={bp.id} onClick={() => applyBlueprint(bp)} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer group">
                        <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            {bp.icon}
                        </div>
                        <h4 className="font-black italic uppercase tracking-tight text-slate-900 mb-2">{bp.title}</h4>
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed mb-6">{bp.description}</p>
                        <div className="flex items-center text-indigo-600 text-[10px] font-black uppercase tracking-widest">
                            Select <ChevronRight className="ml-1 h-3 w-3" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* --- VISTA 3: IL FORM (Manuale o Pre-popolato) --- */}
      {view === 'form' && (
        <div className="flex flex-col lg:flex-row gap-10 items-start animate-in slide-in-from-right-4 duration-500">
            <div className="flex-1 w-full">
                <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white">
                    <CardContent className="p-8">
                        <div className="mb-8 pb-6 border-b border-slate-50 flex items-center justify-between">
                            <Button variant="ghost" onClick={() => setView('selection')} className="text-slate-400 font-bold text-xs p-0 hover:bg-transparent hover:text-indigo-600">
                                <ArrowLeft className="mr-2 h-4 w-4" /> Reset Settings
                            </Button>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Identity Protocol Alpha</span>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Entity Identity</label>
                                    <Input name="title" defaultValue={initialData.title} required placeholder="e.g. MindHub Website v2" className="h-12 rounded-xl border-slate-200 font-bold focus:ring-4 focus:ring-indigo-500/10" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Operational Status</label>
                                    <select name="status" className="w-full rounded-xl border border-slate-200 p-3 h-12 text-sm bg-white font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all">
                                        <option value="idea">💡 Idea Phase</option>
                                        <option value="planning">🗺️ Planning</option>
                                        <option value="active" selected>🚀 Active Sprint</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-6 border-t border-slate-100 pt-6">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Type & Capital Allocation</label>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <div onClick={() => setType('personal')} className={`flex-1 p-5 border rounded-2xl cursor-pointer flex items-center gap-3 transition-all ${type === 'personal' ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm' : 'hover:bg-slate-50 border-slate-100'}`}>
                                        <div className={`p-2 rounded-xl ${type === 'personal' ? 'bg-indigo-200 text-indigo-700' : 'bg-slate-100 text-slate-400'}`}><User className="h-5 w-5"/></div>
                                        <span className="font-bold text-sm">Personal</span>
                                    </div>
                                    <div onClick={() => setType('client')} className={`flex-1 p-5 border rounded-2xl cursor-pointer flex items-center gap-3 transition-all ${type === 'client' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm' : 'hover:bg-slate-50 border-slate-100'}`}>
                                        <div className={`p-2 rounded-xl ${type === 'client' ? 'bg-emerald-200 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}><Briefcase className="h-5 w-5"/></div>
                                        <span className="font-bold text-sm">Client Work</span>
                                    </div>
                                </div>

                                {type === 'client' && (
                                    <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Hourly Rate</label>
                                            <Input name="hourly_rate" type="number" placeholder="50" className="h-12 rounded-xl border-slate-200 font-bold" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Currency</label>
                                            <select name="currency" className="w-full rounded-xl border border-slate-200 p-3 h-12 text-sm bg-white font-bold">
                                                <option value="EUR">EUR (€)</option>
                                                <option value="USD">USD ($)</option>
                                                <option value="GBP">GBP (£)</option>
                                            </select>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Project Budget</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-3 text-slate-400 font-bold">€</span>
                                        <Input name="budget" type="number" placeholder="0.00" className="pl-9 h-12 rounded-xl border-slate-200 font-mono font-bold text-lg" />
                                    </div>
                                    <p className="text-[10px] text-slate-400 italic">This allocated fund activates the 'Runway' timer logic.</p>
                                </div>
                            </div>

                            <div className="space-y-4 border-t border-slate-100 pt-6">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2"><CheckSquare className="h-4 w-4 text-indigo-500" /> Strategic Roadmap</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {(selectedPhases.length > 0 ? selectedPhases : STANDARD_PHASES).map(phase => (
                                        <div key={phase} onClick={() => togglePhase(phase)} className={`text-[10px] p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${selectedPhases.includes(phase) ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-bold' : 'hover:bg-slate-50 border-slate-100 text-slate-500 uppercase tracking-tight'}`}>
                                            {phase} {selectedPhases.includes(phase) && <div className="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(79,70,229,0.5)]"/>}
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[9px] text-slate-400 italic mt-2 uppercase tracking-widest text-center">Click to toggle specific tasks from this blueprint</p>
                            </div>

                            <div className="space-y-2 border-t border-slate-100 pt-6">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Description / Strategic Brief</label>
                                <textarea name="description" rows={6} defaultValue={initialData.description} placeholder="High-level goals..." className="w-full rounded-xl border border-slate-200 p-4 text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 resize-none font-medium text-slate-600 leading-relaxed"></textarea>
                            </div>

                            <Button type="submit" className="w-full h-16 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl transition-all active:scale-95 group" disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Rocket className="mr-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />} Initialize Node
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>

            <ProtocolDirective 
              title="Project Protocol"
              steps={[
                { label: "Entity Logic", desc: "Templates pre-populate your description with bold placeholders. Ensure you fill these for better AI analysis." },
                { label: "Allocated Funds", desc: "Setting a budget allows MindHub to calculate how many months of overhead this specific project can sustain." },
                { label: "Roadmap Sprint", desc: "Selected phases will be automatically converted into tasks in your new project dashboard." }
              ]}
              outcome="Once initialized, this project will become a live 'Node' in your ecosystem, ready for financial and asset linkage."
            />
        </div>
      )}
    </div>
  )
}
