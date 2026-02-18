import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getDictionary } from '@/lib/translations'
import { 
  Database, Plus, ExternalLink, FileText, 
  Heart, Briefcase, Info, Search 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { deleteResource } from '@/app/actions'
import DeleteButton from '@/components/ui/delete-button'

export default async function ResourcesPage() {
  const supabase = await createClient()
  const cookieStore = await cookies()
  const lang = cookieStore.get('mindhub_locale')?.value || 'en'
  const dict = getDictionary(lang).resources

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Recupero di TUTTE le risorse (Work + Life) ora che abbiamo rimosso le pagine separate
  const { data: resources } = await supabase
    .from('resources')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20 font-sans text-slate-900">
      
      {/* 1. PROTOCOL HEADER (FIXED MOBILE LAYOUT) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8">
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
                    <Database className="h-7 w-7 text-white fill-white" />
                </div>
                <h1 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">
                    Assets & Docs
                </h1>
            </div>
            <p className="text-sm text-slate-500 font-medium italic opacity-70 uppercase tracking-widest ml-16">
              Legal, Brand, Tech, Personal and Life resources.
            </p>
        </div>

        <Link href="/dashboard/resources/new" className="w-full md:w-auto">
            <Button className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl h-12 px-6 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all active:scale-95">
                <Plus className="mr-2 h-4 w-4" /> Add Asset
            </Button>
        </Link>
      </div>

      {/* 2. RESOURCES GRID */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {resources && resources.length > 0 ? (
          resources.map((res) => {
            const isPersonal = res.section === 'life'
            
            return (
              <Card 
                key={res.id} 
                className={`group hover:shadow-lg transition-all bg-white rounded-2xl overflow-hidden border border-slate-100 ${
                  isPersonal ? 'border-l-4 border-l-pink-500' : 'border-l-4 border-l-emerald-500'
                }`}
              >
                <CardHeader className="pb-2 pt-6 px-6 flex flex-row items-center justify-between space-y-0">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center shadow-sm ${
                    isPersonal ? 'bg-pink-50 text-pink-600' : 'bg-emerald-50 text-emerald-600'
                  }`}>
                      {isPersonal ? <Heart size={18} /> : <Briefcase size={18} />}
                  </div>
                  <DeleteButton id={res.id} onDelete={deleteResource} />
                </CardHeader>
                
                <CardContent className="px-6 pb-6 pt-4">
                  <div className="space-y-1 mb-4">
                    <span className={`text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full border ${
                        isPersonal 
                        ? 'bg-pink-50 text-pink-600 border-pink-100' 
                        : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                    }`}>
                        {isPersonal ? 'Personal / Identity' : 'Business / Work'}
                    </span>
                    <h3 className="font-bold text-slate-900 text-lg leading-tight pt-1 truncate">
                        {res.title}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-500 font-medium line-clamp-2 min-h-[2.5rem] leading-relaxed mb-6">
                    {res.description || "No description provided for this node."}
                  </p>
                  
                  {res.url ? (
                    <a 
                      href={res.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                        isPersonal ? 'text-pink-600 hover:text-pink-700' : 'text-emerald-600 hover:text-emerald-700'
                      }`}
                    >
                      <ExternalLink size={14} /> Open Secure Node
                    </a>
                  ) : (
                    <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                        <Search size={14} /> Internal Note
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })
        ) : (
          <div className="col-span-full py-32 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100 shadow-inner">
            <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Database className="h-8 w-8 text-slate-200" />
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">{dict.no_data}</p>
          </div>
        )}
      </div>

      {/* 3. FOOTER INFORMATIVO (DNA v2.0) */}
      <div className="mt-12 flex items-start gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-t border-slate-100 pt-6 opacity-60">
          <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-indigo-400" />
          <p className="leading-tight">
            Ecosystem assets are categorized by domain. Personal nodes are highlighted in pink, 
            while operational business nodes remain in emerald.
          </p>
      </div>
    </div>
  )
}
