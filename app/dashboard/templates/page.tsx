import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getDictionary } from '@/lib/translations'
import { PlayCircle, Plus, FileText, ChevronRight, Info, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import Link from 'next/link'
import DeleteTemplateButton from '@/components/dashboard/DeleteTemplateButton'
import StrategicPulseSidebar from '@/components/dashboard/StrategicPulseSidebar' // <-- NUOVO IMPORT

export default async function TemplatesPage() {
  const supabase = await createClient()
  const cookieStore = await cookies()
  const lang = cookieStore.get('mindhub_locale')?.value || 'en'
  const dict = getDictionary(lang).templates

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: templates } = await supabase
    .from('templates')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20 font-sans text-slate-900 max-w-7xl mx-auto">
      
      {/* HEADER (dna v2.0) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8">
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/20 shrink-0">
                    <PlayCircle className="h-7 w-7 text-white fill-white" />
                </div>
                <h1 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">
                    Strategic Playbooks
                </h1>
            </div>
            <p className="text-sm text-slate-500 font-medium italic opacity-70 uppercase tracking-widest ml-16">
              Your Proprietary Logic Base
            </p>
        </div>

        <Link href="/dashboard/templates/new" className="w-full md:w-auto">
            <Button className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl h-12 px-6 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all active:scale-95">
                <Plus className="mr-2 h-4 w-4" /> New Playbook
            </Button>
        </Link>
      </div>

      {/* --- LAYOUT A DUE COLONNE --- */}
      <div className="flex flex-col lg:flex-row gap-10 items-start">
        
        {/* MAIN FEED (Playbooks dell'utente) */}
        <div className="flex-1 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {templates && templates.length > 0 ? (
                templates.map((item) => (
                    <Link key={item.id} href={`/dashboard/templates/${item.id}`} className="relative group">
                    <Card className="hover:shadow-lg transition-all bg-white rounded-[2rem] overflow-hidden border border-slate-100 border-l-4 border-l-violet-500 h-full flex flex-col">
                        <CardHeader className="pb-2 pt-6 px-6 flex flex-row items-center justify-between space-y-0 relative">
                        <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600 shadow-sm border border-violet-100">
                            <FileText size={18} />
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <DeleteTemplateButton id={item.id} />
                        </div>
                        </CardHeader>
                        
                        <CardContent className="px-6 pb-6 pt-4 flex-1 flex flex-col">
                        <div className="space-y-1 mb-4">
                            <span className="text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full border bg-slate-50 text-slate-400 border-slate-100">
                                {item.category || 'Standard Procedure'}
                            </span>
                            <h3 className="font-bold text-slate-900 text-lg leading-tight pt-2 group-hover:text-indigo-600 transition-colors">
                                {item.title}
                            </h3>
                        </div>

                        <p className="text-sm text-slate-500 font-medium line-clamp-3 leading-relaxed mb-6 flex-1">
                            {item.content?.substring(0, 120) || "Empty playbook. Initialize content."}
                        </p>
                        
                        <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                <BookOpen size={12} /> SOP Asset
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-200 group-hover:text-indigo-500 transition-all" />
                        </div>
                        </CardContent>
                    </Card>
                    </Link>
                ))
                ) : (
                <div className="col-span-full py-24 text-center bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-100 shadow-inner">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">No playbooks saved.</p>
                </div>
                )}
            </div>

            {/* INFO FOOTER */}
            <div className="flex items-start gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-t border-slate-100 pt-6 opacity-60">
                <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-indigo-400" />
                <p className="leading-tight">
                    Standardizing your procedures allows for maximum operational leverage and AI context retrieval.
                </p>
            </div>
        </div>

        {/* --- SIDEBAR DESTRA: STRATEGIC PULSE --- */}
        <StrategicPulseSidebar />

      </div>
    </div>
  )
}
