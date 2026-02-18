import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { 
  CheckCircle2, 
  Circle, 
  Globe, 
  ArrowUpRight, 
  Sparkles, 
  StickyNote, 
  Clock,
  LayoutDashboard,
  BarChart3,
  Target,
  Flag
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function PublicProjectPage(props: { params: Promise<{ token: string }> }) {
  const params = await props.params
  const token = params.token
  const supabase = await createClient()

  // 1. Recupero Progetto e Profilo Owner per il Nome
  const { data: project } = await supabase
    .from('projects')
    .select('*, profiles(first_name, last_name)')
    .eq('public_token', token)
    .eq('is_public', true)
    .single()

  if (!project) notFound()

  // Formattazione Nome: Luigi C.
  const ownerName = project.profiles 
    ? `${project.profiles.first_name} ${project.profiles.last_name?.charAt(0)}.` 
    : 'MindHub Founder'

  const [tasksReq, notesReq, logsReq] = await Promise.all([
    supabase.from('tasks').select('*').eq('project_id', project.id).order('is_completed', { ascending: true }),
    supabase.from('project_notes').select('*').eq('project_id', project.id).eq('is_public', true).order('created_at', { ascending: false }),
    supabase.from('time_logs').select('minutes').eq('project_id', project.id)
  ])

  const tasks = tasksReq.data || []
  const publicNotes = notesReq.data || []
  const totalMinutes = logsReq.data?.reduce((acc, log) => acc + (log.minutes || 0), 0) || 0
  const hours = Math.floor(totalMinutes / 60)
  
  const completedTasks = tasks.filter((t: any) => t.is_completed).length
  const totalTasks = tasks.length
  const displayProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : (project.progress || 0)

  // Calcolo Fasi per la Progress Map
  const phases = [
    { name: 'Identity', active: true },
    { name: 'Development', active: displayProgress > 20 },
    { name: 'Refining', active: displayProgress > 60 },
    { name: 'Launch', active: displayProgress === 100 }
  ]

  return (
    <div className="min-h-screen bg-white selection:bg-indigo-100 selection:text-indigo-900 relative overflow-x-hidden font-sans">
      
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
              <LayoutDashboard className="h-6 w-6 text-white" />
            </div>
            <span className="font-black text-2xl tracking-tighter text-slate-900">MindHub</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 hidden sm:block">Building by {ownerName}</span>
            <Link href="/auth/signup">
                <Button className="rounded-full font-black text-[10px] uppercase tracking-widest bg-slate-900 hover:bg-indigo-600 text-white px-6 h-11 transition-all">
                Get Access <ArrowUpRight className="ml-2 h-4 w-4" />
                </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-16 space-y-20">
        
        {/* HERO SECTION */}
        <header className="space-y-10 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-50 border border-slate-100 text-[10px] font-black uppercase tracking-widest text-indigo-600">
            <Globe className="h-3 w-3" /> Public Protocol node
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-[0.9] uppercase italic">
            {project.title}
          </h1>

          {/* PROGRESS MAP VISUALE (Holy Shit effect) */}
          <div className="pt-10">
            <div className="relative flex justify-between items-center max-w-2xl mx-auto md:mx-0">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 -z-0" />
                <div 
                    className="absolute top-1/2 left-0 h-0.5 bg-indigo-600 -translate-y-1/2 transition-all duration-1000" 
                    style={{ width: `${displayProgress}%` }}
                />
                {phases.map((phase, i) => (
                    <div key={i} className="relative z-10 flex flex-col items-center gap-3">
                        <div className={`h-10 w-10 rounded-2xl flex items-center justify-center border-4 border-white shadow-xl transition-colors duration-500 ${phase.active ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                            {i === phases.length - 1 ? <Target size={16} /> : <div className="text-[10px] font-black">{i + 1}</div>}
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${phase.active ? 'text-indigo-600' : 'text-slate-300'}`}>{phase.name}</span>
                    </div>
                ))}
            </div>
          </div>
        </header>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Time Invested</p>
                <p className="text-3xl font-black text-slate-900 italic">{hours}H</p>
            </div>
            <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Milestones</p>
                <p className="text-3xl font-black text-slate-900 italic">{completedTasks}/{totalTasks}</p>
            </div>
            <div className="p-8 bg-indigo-600 rounded-[2.5rem] shadow-xl shadow-indigo-100 space-y-1 hidden md:block">
                <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Node Velocity</p>
                <p className="text-3xl font-black text-white italic">{displayProgress}%</p>
            </div>
        </div>
        
        {/* PUBLIC ANALYTICS BROADCAST (Sovereign Choice) */}
    {project.analytics_url && project.show_analytics_public && (
    <div className="mt-8 font-sans animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <Link href={project.analytics_url} target="_blank">
            <div className="flex items-center justify-between p-6 bg-indigo-600 rounded-[2rem] text-white shadow-xl shadow-indigo-200 group hover:bg-slate-900 transition-all">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/10 rounded-2xl">
                        <BarChart3 size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Intelligence Node Active</p>
                        <p className="text-lg font-bold italic tracking-tight">View Live Performance Analytics</p>
                    </div>
                </div>
                <ArrowUpRight className="h-6 w-6 text-indigo-300 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </div>
        </Link>
    </div>
)}
        {/* DESCRIPTION */}
        <section className="prose prose-slate max-w-none">
          <div 
            className="text-xl text-slate-500 leading-relaxed font-medium"
            dangerouslySetInnerHTML={{ __html: project.description || "Project in development phase." }}
          />
        </section>

        {/* UPDATES & ROADMAP */}
        <div className="grid md:grid-cols-2 gap-12 pt-10">
          <section className="space-y-8">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-3 italic">
               <span className="h-1.5 w-6 bg-indigo-600 rounded-full" /> Strategic Updates
            </h3>
            <div className="space-y-6">
              {publicNotes.length > 0 ? publicNotes.map((note) => (
                <div key={note.id} className="p-8 bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all">
                  <p className="text-slate-700 text-sm leading-relaxed font-bold">{note.content}</p>
                  <time className="block mt-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    {new Date(note.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'long' })}
                  </time>
                </div>
              )) : <p className="text-xs font-medium text-slate-400 italic">No public updates broadcasted yet.</p>}
            </div>
          </section>

          <section className="space-y-8">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-3 italic">
               <span className="h-1.5 w-6 bg-emerald-500 rounded-full" /> Backlog Status
            </h3>
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
              {tasks.map((task: any, idx: number) => (
                <div key={task.id} className={`flex items-center gap-4 p-6 ${idx !== tasks.length - 1 ? 'border-b border-slate-50' : ''} ${task.is_completed ? 'bg-slate-50/50' : ''}`}>
                  {task.is_completed ? 
                    <CheckCircle2 className="h-5 w-5 text-indigo-500 shrink-0" /> : 
                    <Circle className="h-5 w-5 text-slate-200 shrink-0" />
                  }
                  <span className={`font-bold text-xs uppercase tracking-tight ${task.is_completed ? 'text-slate-300 line-through' : 'text-slate-800'}`}>
                    {task.title}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* CTA FINAL - RESPONSIVE FIX */}
        <section className="pt-10 sm:pt-20">
          <div className="bg-slate-900 rounded-[2.5rem] sm:rounded-[3.5rem] p-8 md:p-20 text-center space-y-8 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-3xl -mr-32 -mt-32" />
            
            <div className="relative z-10 space-y-6 sm:space-y-10">
                <h2 className="text-3xl sm:text-6xl font-black text-white tracking-tighter leading-tight uppercase italic">
                    Build your <br/><span className="text-indigo-500">Sovereignty.</span>
                </h2>
                
                <div className="flex justify-center px-2">
                    <Link href="/auth/signup" className="w-full sm:w-auto">
                        <Button className="w-full sm:w-auto rounded-2xl px-8 h-16 sm:h-20 text-[10px] sm:text-sm font-black uppercase tracking-widest bg-indigo-600 hover:bg-white hover:text-indigo-600 text-white border-0 transition-all shadow-2xl shadow-indigo-500/20 active:scale-95">
                            Initialize My MindHub Now
                        </Button>
                    </Link>
                </div>
                
                <p className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] px-4">
                    Node Identity Standard 2026
                </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
