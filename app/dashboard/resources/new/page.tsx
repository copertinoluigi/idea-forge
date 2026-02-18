'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Save, Layers } from 'lucide-react'
import { toast } from 'sonner'
import ProtocolDirective from '@/components/dashboard/ProtocolDirective'

function NewResourceForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState<{id: string, title: string}[]>([])
  const sectionParam = searchParams.get('section') || 'work'

  useEffect(() => {
    async function loadProjects() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('projects').select('id, title').eq('user_id', user.id).neq('status', 'archived')
        if (data) setProjects(data)
      }
    }
    loadProjects()
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    
    const formData = new FormData(e.currentTarget)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      toast.error("User not authenticated");
      setLoading(false);
      return;
    }

    const projectId = formData.get('project_id');
    
    // Costruiamo l'oggetto di inserimento
    const payload = {
      title: formData.get('title'),
      url: formData.get('url') || null, // Evita stringhe vuote se non necessario
      description: formData.get('description'),
      section: formData.get('section'),
      type: formData.get('type'),
      project_id: projectId === 'none' ? null : projectId,
      user_id: user.id
    }

    const { error } = await supabase.from('resources').insert(payload)

    if (error) { 
      console.error("DETTAGLIO ERRORE SUPABASE:", error); // <-- FONDAMENTALE PER IL DEBUG
      toast.error(`Error: ${error.message}`); // Mostra l'errore reale nel toast per test
      setLoading(false); 
      return; 
    }

    toast.success("Ecosystem asset secured");
    router.push('/dashboard/resources');
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Asset Identity</label>
            <input name="title" required placeholder="e.g. Brand Assets, API Docs, Legal NDA" className="w-full rounded-xl border border-slate-200 p-3 h-12 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" />
        </div>

        <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Node Association</label>
            <select name="project_id" className="w-full rounded-xl border border-slate-200 p-3 h-12 text-sm font-bold bg-white outline-none">
                <option value="none">General Resource (Global)</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
        </div>

        <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Source URL (Secure Link)</label>
            <input name="url" type="url" placeholder="https://..." className="w-full rounded-xl border border-slate-200 p-3 h-12 text-sm font-bold font-mono focus:ring-4 focus:ring-indigo-500/10 outline-none" />
        </div>

        <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Brief Description</label>
            <textarea name="description" rows={3} placeholder="Context for the AI or future reference..." className="w-full rounded-xl border border-slate-200 p-4 text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 outline-none resize-none" />
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Domain</label>
                <select name="section" defaultValue={sectionParam} className="w-full rounded-xl border border-slate-200 p-3 h-12 text-sm font-bold bg-white">
                    <option value="work">Business Core</option>
                    <option value="life">Personal Identity</option>
                </select>
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Asset Taxonomy</label>
                <select name="type" className="w-full rounded-xl border border-slate-200 p-3 h-12 text-sm font-bold bg-white">
                    <option value="link">Cloud Link / Bookmark</option>
                    <option value="note">Operational Note</option>
                    <option value="document">Legal Document</option>
                </select>
            </div>
        </div>

        <Button type="submit" className="w-full h-16 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />} Save Ecosystem Asset
        </Button>
    </form>
  )
}

export default function NewResourcePage() {
  return (
    <div className="max-w-6xl mx-auto space-y-8 py-10 px-4 animate-in fade-in">
      
      <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/dashboard/resources" className="text-slate-400 hover:text-indigo-600 transition-colors font-bold">Resources</Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 font-bold font-mono uppercase">ADD_NEW_ASSET</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Create Asset</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-10 items-start">
        <div className="flex-1 w-full">
            <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white">
                <CardContent className="p-8">
                    <Suspense fallback={<div className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-indigo-600" /></div>}>
                        <NewResourceForm />
                    </Suspense>
                </CardContent>
            </Card>
        </div>

        <ProtocolDirective 
          title="Asset Protocol"
          steps={[
            { label: "Logical Linkage", desc: "Associating a resource with a project keeps your documentation close to the code. Unlinked assets belong to the 'Global Knowledge Base'." },
            { label: "Taxonomy", desc: "Categorizing assets helps the AI understand your intellectual property (IP) and brand foundations." },
            { label: "Reference", desc: "Use descriptions to store quick context or passwords that the AI might need during strategic analysis." }
          ]}
          outcome="Adding this asset strengthens your 'Context Score'. The more data the AI has about your tools and docs, the more precise the Board Reports will be."
        />
      </div>
    </div>
  )
}
