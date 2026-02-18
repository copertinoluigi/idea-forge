'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Loader2, Save, Target, LineChart, ShieldCheck, Info, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { getDictionary } from '@/lib/translations'
import ProtocolDirective from '@/components/dashboard/ProtocolDirective'

export default function EditProjectPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params?.id as string

  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [project, setProject] = useState<any>(null)
  const [dict, setDict] = useState<any>(null)

  useEffect(() => {
    const initPage = async () => {
        if (!projectId) return
        
        const [projectData, dictionary] = await Promise.all([
            supabase.from('projects').select('*').eq('id', projectId).single(),
            getDictionary('en') 
        ])

        if (projectData.data) setProject(projectData.data)
        if (dictionary) setDict(dictionary)
        setLoading(false)
    }
    initPage()
  }, [projectId, supabase])

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    const formData = new FormData(e.currentTarget)
    
    const analyticsUrl = formData.get('analytics_url') as string
    const cleanAnalyticsUrl = analyticsUrl.trim() === '' ? null : analyticsUrl

    const { error } = await supabase.from('projects').update({
        title: formData.get('title'),
        description: formData.get('description'),
        status: formData.get('status'),
        hourly_rate: Number(formData.get('hourly_rate')),
        currency: formData.get('currency'),
        analytics_url: cleanAnalyticsUrl,
        show_analytics_public: formData.get('show_analytics_public') === 'on',
        budget: Number(formData.get('budget') || 0), 
        updated_at: new Date().toISOString()
    }).eq('id', projectId)

    if (error) {
        toast.error(`Protocol Error: ${error.message}`)
    } else {
        toast.success("Project Identity Updated")
        router.push(`/dashboard/projects/${projectId}`)
        router.refresh()
    }
    setSaving(false)
  }

  if (loading || !dict) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto h-8 w-8 text-indigo-600" /></div>

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-10 px-4 animate-in fade-in">
      
      {/* 1. HEADER & BREADCRUMB */}
      <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm">
            <Link href={`/dashboard/projects/${projectId}`} className="text-slate-400 hover:text-indigo-600 transition-colors font-bold group flex items-center">
                <ArrowLeft size={14} className="mr-1 group-hover:-translate-x-1 transition-transform" /> Back to Node
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 font-bold font-mono uppercase">EDIT_IDENTITY</span>
          </div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">Modify Node Structure</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-10 items-start">
        
        {/* FORM SIDE */}
        <div className="flex-1 w-full">
            <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
                <CardContent className="p-8">
                    <form onSubmit={handleUpdate} className="space-y-8">
                        
                        {/* IDENTITY SECTION */}
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Entity Identity</label>
                                <Input 
                                    name="title" 
                                    defaultValue={project.title} 
                                    required 
                                    className="h-14 rounded-2xl border-slate-200 font-bold text-lg focus:ring-4 focus:ring-indigo-500/10 transition-all" 
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Strategic Brief</label>
                                <textarea 
                                    name="description" 
                                    defaultValue={project.description}
                                    rows={5} 
                                    className="w-full rounded-2xl border border-slate-200 p-4 text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all resize-none leading-relaxed text-slate-600"
                                />
                                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest ml-1 italic flex items-center gap-1">
                                    <Sparkles size={10} /> Basic HTML supported for detailed roadmaps
                                </p>
                            </div>
                        </div>

                        {/* STATUS & TYPE GRID */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-50 pt-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Lifecycle Status</label>
                                <select name="status" defaultValue={project.status} className="w-full rounded-xl border border-slate-200 p-3 h-12 text-sm bg-white font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all">
                                    <option value="idea">💡 Idea Phase</option>
                                    <option value="planning">🗺️ Planning</option>
                                    <option value="active">🚀 Active Sprint</option>
                                    <option value="paused">⏸️ Paused</option>
                                    <option value="archived">✅ Archived</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Project Type</label>
                                <div className="h-12 flex items-center px-4 bg-slate-50 rounded-xl border border-slate-100 text-xs font-black uppercase text-slate-500 tracking-widest italic shadow-inner">
                                    {project.type || 'Personal'} Node
                                </div>
                            </div>
                        </div>

                        {/* CAPITAL ALLOCATION SECTION */}
                        <div className="space-y-6 border-t border-slate-50 pt-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Allocated Budget</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-3.5 text-slate-400 font-black">€</span>
                                        <Input 
                                            name="budget" 
                                            type="number" 
                                            defaultValue={project.budget || 0}
                                            className="pl-8 h-12 rounded-xl border-slate-200 font-black text-slate-900"
                                        />
                                    </div>
                                </div>

                                {project.type === 'client' && (
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Hourly Rate</label>
                                            <Input name="hourly_rate" type="number" defaultValue={project.hourly_rate} className="h-12 rounded-xl border-slate-200 font-bold" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Currency</label>
                                            <select name="currency" defaultValue={project.currency || 'EUR'} className="w-full rounded-xl border border-slate-200 p-3 h-12 text-xs bg-white font-bold">
                                                <option value="EUR">EUR (€)</option>
                                                <option value="USD">USD ($)</option>
                                                <option value="GBP">GBP (£)</option>
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* EXTERNAL INTELLIGENCE */}
                        <div className="space-y-4 border-t border-slate-50 pt-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 flex items-center gap-2">
                                    <LineChart size={14} className="text-indigo-600" /> External Intelligence Node (Looker Studio)
                                </label>
                                <Input 
                                    name="analytics_url" 
                                    defaultValue={project.analytics_url} 
                                    placeholder="https://lookerstudio.google.com/embed/..." 
                                    className="h-12 rounded-xl border-slate-200 font-mono text-[11px] text-slate-500" 
                                />
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
                                <input 
                                    type="checkbox" 
                                    name="show_analytics_public" 
                                    id="show_analytics_public"
                                    defaultChecked={project.show_analytics_public}
                                    className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer shadow-sm" 
                                />
                                <label htmlFor="show_analytics_public" className="text-[10px] font-black text-slate-700 uppercase tracking-tight cursor-pointer">
                                    Broadcast Intelligence to Public Page
                                </label>
                            </div>
                        </div>

                        {/* SAVE ACTION */}
                        <Button type="submit" disabled={saving} className="w-full h-16 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-100 transition-all active:scale-95">
                            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Update Node Integrity
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <div className="mt-8 text-center">
                <Link href={`/dashboard/projects/${projectId}`} className="text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-rose-500 transition-colors">
                    Discard changes and return to Node
                </Link>
            </div>
        </div>

        {/* SIDEBAR PROTOCOL */}
        <div className="w-full lg:w-72 shrink-0">
            <ProtocolDirective 
              title="Edit Protocol"
              steps={[
                { label: "Stability Check", desc: "Updating the budget will immediately recalculate the 'Remaining Reservoir' and survival months." },
                { label: "Privacy Toggle", desc: "If public broadcasting is active, external observers will see the analytics node." },
                { label: "Archival Logic", desc: "Setting a node to 'Archived' removes its influence from your active burn rate metrics." }
              ]}
              outcome="Changes made here propagate across the entire OS, including AI audits and financial runway projections."
            />
        </div>

      </div>
    </div>
  )
}
