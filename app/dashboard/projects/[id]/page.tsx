import Link from 'next/link'
import { cn } from '@/lib/utils'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
    ArrowLeft, CheckCircle2, Circle, Trash2, Globe, Lock, Pencil, 
    Info, BarChart3, ArrowUpRight, DollarSign, Settings, Sparkles, 
    ExternalLink, BookOpen, Layers, Pin, ShieldCheck, Mail, AlertTriangle, Users2
} from 'lucide-react'
import { revalidatePath } from 'next/cache'
import { getDictionary } from '@/lib/translations'
import { toggleTaskAction, deleteTaskAction, getGlobalOverheadAction, getProjectFinancialHealthAction } from '@/app/actions'
import { formatCurrency } from '@/lib/utils'

// Components 
import AddTaskForm from '@/components/dashboard/AddTaskForm'
import { ExportBlueprintButton } from "@/components/projects/export-blueprint-button"
import ProjectLinks from '@/components/dashboard/ProjectLinks'
import AnalyticsWidget from '@/components/dashboard/AnalyticsWidget'
import TimeTracker from '@/components/dashboard/TimeTracker'
import DeleteProjectButton from '@/components/dashboard/DeleteProjectButton'
import ArchiveProjectButton from '@/components/dashboard/ArchiveProjectButton'
import GeneratePlanButton from '@/components/dashboard/GeneratePlanButton'
import ProjectNotes from '@/components/dashboard/ProjectNotes'
import CopyLinkButton from '@/components/dashboard/CopyLinkButton'
import { ProjectChatSheet } from "@/components/projects/ProjectChatSheet"
import { NexusTeamTab } from "@/components/projects/NexusTeamTab"
import { NexusPulseTimer } from "@/components/projects/NexusPulseTimer"

async function togglePublic(projectId: string, currentStatus: boolean) {
  'use server'
  const supabase = await createClient()
  await supabase.from('projects').update({ is_public: !currentStatus }).eq('id', projectId)
  revalidatePath(`/dashboard/projects/${projectId}`)
}

async function togglePin(projectId: string, currentStatus: boolean) {
  'use server'
  const supabase = await createClient()
  await supabase.from('projects').update({ is_pinned: !currentStatus }).eq('id', projectId)
  revalidatePath(`/dashboard/projects/${projectId}`)
  revalidatePath('/dashboard') 
}

export default async function ProjectDetailPage(props: { 
    params: Promise<{ id: string }>,
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { id: projectId } = await props.params;
  const sParams = await props.searchParams;
  const currentTab = (sParams?.tab as string) || 'backlog';
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { supabaseAdmin } = await import('@/lib/supabase/admin');

  const cookieStore = await cookies()
  const lang = cookieStore.get('mindhub_locale')?.value || 'en'
  const fullDict = getDictionary(lang)
  const dict = fullDict.project_detail
  const noteDict = fullDict.project_notes
  const timeDict = fullDict.time_tracker

  // 1. DETERMINAZIONE RUOLO NEXUS
  const { data: nexusRole } = await supabase.rpc('get_nexus_role', { 
    proj_id: projectId, 
    req_user_id: user.id 
  });

  if (nexusRole === 'none' || !nexusRole) {
      redirect('/dashboard/projects');
  }

  const isArchitect = nexusRole === 'architect';

  // 2. QUERY - RECUPERO DATI INTEGRALE (ORDINE SINCRONIZZATO)
  const [
    projectReq, 
    tasksReq, 
    linksReq, 
    notesReq, 
    subsReq, 
    resourcesReq, 
    overheadData, 
    healthData, 
    membersReq,
    activeSessionReq,
    pendingLogsReq,
    approvedLogsReq,
    myLogsReq
  ] = await Promise.all([
    isArchitect 
        ? supabase.from('projects').select('*, owner:user_id(first_name, last_name, email)').eq('id', projectId).single()
        : supabaseAdmin.from('projects').select('*, owner:user_id(first_name, last_name, email)').eq('id', projectId).single(),
    isArchitect
        ? supabase.from('tasks').select('*').eq('project_id', projectId).order('is_completed', { ascending: true })
        : supabaseAdmin.from('tasks').select('*').eq('project_id', projectId).order('is_completed', { ascending: true }),
    supabase.from('project_links').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
    // Notes semplici
    supabase.from('project_notes').select('*').eq('project_id', projectId).order('created_at', { ascending: false }).limit(20),
    supabase.from('subscriptions').select('*').eq('project_id', projectId),  
    supabase.from('resources').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
    getGlobalOverheadAction(),
    getProjectFinancialHealthAction(projectId),
    supabaseAdmin.from('project_members').select('*, profiles(first_name, last_name)').eq('project_id', projectId),
    supabase.from('active_sessions').select('*').eq('user_id', user.id).single(),
    // Log pendenti (solo Architect)
    supabase.from('time_logs').select('*, profiles:user_id(first_name, last_name)').eq('project_id', projectId).eq('status', 'pending'),
    // Log approvati (per il Ledger dell'Architect)
    supabase.from('time_logs').select('*, profiles:user_id(first_name, last_name)').eq('project_id', projectId).eq('status', 'approved').order('created_at', { ascending: false }).limit(10),
    // Log personali (per il collaboratore)
    supabase.from('time_logs').select('*').eq('project_id', projectId).eq('user_id', user.id).order('created_at', { ascending: false }).limit(5)
  ])

  const project = projectReq.data
  if (!project) redirect('/dashboard/projects')

  // ASSEGNAZIONE VARIABILI
  const ownerProfile = project.owner;
  const members = membersReq.data || []
  const tasks = tasksReq.data || []
  const links = linksReq.data || []
  const notes = notesReq.data || [] 
  const linkedSubs = subsReq.data || []      
  const linkedResources = resourcesReq.data || [] 
  const overhead = (overheadData as any) || { totalOverhead: 0, perProjectWeight: 0, activeProjectsCount: 0 };
  const health = healthData;
  const activeSession = activeSessionReq.data;
  const pendingLogs = pendingLogsReq.data || [];
  const logs = approvedLogsReq.data || []; // Log approvati per Architect
  const myLogs = myLogsReq.data || []; // Log personali per collaboratore

  const completedTasks = tasks.filter((t: any) => t.is_completed).length
  const totalTasks = tasks.length
  const displayProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : (project.progress || 0)
  const publicLink = `https://mindhub.website/p/${project.public_token}` 
  const projectCurrency = project.currency || 'EUR';

  const directMonthlyBurn = linkedSubs.reduce((acc: number, s: any) => acc + Number(s.cost || 0), 0)
  const totalBurnWithOverhead = directMonthlyBurn + (overhead.perProjectWeight || 0)
  const estimatedRunway = totalBurnWithOverhead > 0 
    ? (Number(health?.remainingBudget || 0) / totalBurnWithOverhead).toFixed(1) 
    : "∞"

  return (
    /* AGGIUNTO: overflow-x-hidden e w-full per blindare il container */
    <div className="space-y-6 animate-in fade-in max-w-7xl mx-auto pb-20 font-sans text-slate-900 px-4 md:px-8 w-full overflow-x-hidden">
      
      {/* 1. HEADER */}
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 w-full">
        <Link href="/dashboard/projects" className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors w-fit group shrink-0">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest italic">Back to Nodes</span>
        </Link>
        {/* AGGIUNTO: break-words per titoli lunghi */}
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none break-words">
            {project.title}
        </h1>
      </div>

      {/* AGGIUNTO: w-full e min-w-0 per il grid container */}
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-10 pt-4 w-full min-w-0">
        
        <div className="lg:col-span-8 space-y-12 w-full min-w-0">
            
            {/* TABS HUB - MOBILE OPTIMIZED */}
            {/* AGGIUNTO: overflow-hidden e flex-shrink-0 sui Link per evitare push laterale */}
            <div className="grid grid-cols-3 gap-2 md:gap-3 w-full">
                <Link 
                    href={`?tab=backlog`}
                    className={cn(
                        "flex flex-col items-center justify-center h-16 md:h-20 rounded-2xl border-2 transition-all group shadow-sm min-w-0 overflow-hidden",
                        currentTab === 'backlog' ? "bg-white border-indigo-600 text-indigo-600 shadow-md" : "bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200"
                    )}
                >
                    <Layers size={18} className="mb-1 shrink-0" />
                    <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest truncate w-full text-center px-1">Backlog</span>
                </Link>

                <Link 
                    href={`?tab=team`}
                    className={cn(
                        "flex flex-col items-center justify-center h-16 md:h-20 rounded-2xl border-2 transition-all group shadow-sm min-w-0 overflow-hidden",
                        currentTab === 'team' ? "bg-white border-indigo-600 text-indigo-600 shadow-md" : "bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200"
                    )}
                >
                    <Users2 size={18} className="mb-1 shrink-0" />
                    <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest truncate w-full text-center px-1">Team</span>
                </Link>

                <ProjectChatSheet 
                    projectId={projectId} 
                    projectTitle={project.title} 
                    userId={user.id} 
                    active={currentTab === 'chat'} 
                />
            </div>

            {currentTab === 'backlog' ? (
                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-500 w-full min-w-0">
                    
                    {/* LIVE TIMER - MOBILE OPTIMIZED */}
                    <NexusPulseTimer 
                        projectId={projectId} 
                        activeSession={activeSession} 
                        openTasks={tasks.filter((t:any) => !t.is_completed)} 
                    />

                    {/* --- LABOR ACCOUNTING SECTION (LEDGER) --- */}
                    <div className="mt-[-2rem] mb-8 space-y-3 px-1 w-full overflow-hidden">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">
                            {isArchitect ? "Project Labor Ledger" : "My Recent Contributions"}
                        </span>
                        
                        <div className="grid gap-2 w-full">
                            {(isArchitect ? logs : myLogs).length === 0 && (
                                <p className="text-[9px] text-slate-400 font-bold px-2 uppercase tracking-widest">No labor records synced.</p>
                            )}
                            
                            {(isArchitect ? logs : myLogs).map((log: any) => (
                                <div key={log.id} className="flex items-center justify-between p-3 md:p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-indigo-100 transition-all w-full overflow-hidden">
                                    <div className="flex items-center gap-3 md:gap-4 min-w-0 overflow-hidden">
                                        <div className={cn(
                                            "h-2 w-2 rounded-full shrink-0",
                                            log.status === 'approved' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-amber-500 animate-pulse"
                                        )} />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <p className="text-xs font-bold text-slate-800 truncate">{log.description || "Execution Session"}</p>
                                                {isArchitect && (
                                                    <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded uppercase shrink-0 hidden sm:inline">
                                                        {log.profiles?.first_name}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mt-0.5 truncate">
                                                {log.minutes} MIN • {new Date(log.created_at).toLocaleDateString()} 
                                            </p>
                                        </div>
                                    </div>
                                    <span className={cn(
                                        "text-[8px] font-black uppercase px-2 py-0.5 rounded-full border shrink-0 ml-2",
                                        log.status === 'approved' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
                                    )}>
                                        {log.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* AGGIUNTO: break-words e overflow-hidden alla descrizione */}
                    <div className="text-slate-700 text-base leading-relaxed border-l-4 border-indigo-500 pl-6 font-normal w-full overflow-hidden break-words">
                        <div className="max-w-full overflow-x-auto" dangerouslySetInnerHTML={{ __html: project.description || dict.no_desc }} />
                    </div>

                    {project.analytics_url && <AnalyticsWidget url={project.analytics_url} />}

                    <div className="space-y-6 w-full">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black uppercase italic tracking-tighter flex items-center gap-2 text-slate-400">
                                <Layers className="h-4 w-4" /> Strategic Backlog 
                                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full font-black ml-2">{completedTasks}/{totalTasks}</span>
                            </h3>
                        </div>
                        <div className="grid gap-2 w-full">
                            {tasks.map((task: any) => (
                                <div key={task.id} className={`flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm group transition-all w-full overflow-hidden ${task.is_completed ? 'opacity-40' : 'hover:border-indigo-100'}`}>
                                    <div className="flex items-center gap-4 min-w-0 overflow-hidden">
                                        <form action={toggleTaskAction.bind(null, task.id, project.id, task.is_completed)} className="shrink-0">
                                            <button className="focus:outline-none">{task.is_completed ? <CheckCircle2 className="h-5 w-5 text-indigo-500" /> : <Circle className="h-6 w-6 text-slate-200 hover:text-indigo-400" />}</button>
                                        </form>
                                        <span className={`text-sm font-bold uppercase tracking-tight truncate ${task.is_completed ? "text-slate-400 line-through" : "text-slate-800"}`}>{task.title}</span>
                                    </div>
                                    {isArchitect && (
                                        <form action={deleteTaskAction.bind(null, task.id, project.id)} className="shrink-0">
                                            <button className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-opacity p-1"><Trash2 className="h-4 w-4" /></button>
                                        </form>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="bg-slate-50/50 rounded-[2rem] p-6 border border-dashed border-slate-200 w-full overflow-hidden">
                            <AddTaskForm projectId={project.id} userId={user?.id || ''} dict={dict} />
                        </div>
                    </div>

                    <ProjectNotes projectId={project.id} initialNotes={notes} dict={noteDict} />
                </div>
            ) : (
                <NexusTeamTab 
                    projectId={projectId} 
                    members={members} 
                    isArchitect={isArchitect} 
                    ownerProfile={ownerProfile} 
                    pendingLogs={pendingLogs} 
                />
            )}
        </div>

        {/* SIDEBAR RIGHT - AGGIUNTO: w-full min-w-0 */}
        <div className="lg:col-span-4 space-y-6 w-full min-w-0">
            <Card className="bg-indigo-600 text-white rounded-[2.5rem] p-8 border-none shadow-2xl relative overflow-hidden group">
                <Sparkles className="absolute top-4 right-4 h-12 w-12 text-white/10 -rotate-12 group-hover:rotate-0 transition-transform" />
                <div className="relative z-10 space-y-6">
                    <div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-200 leading-none mb-2">AI Strategic Advisor</h3>
                        <p className="text-xl font-black italic uppercase tracking-tighter leading-none">Strategic Blueprint</p>
                    </div>
                    <GeneratePlanButton projectId={project.id} dict={dict} lang={lang} />
                </div>
            </Card>

            <Card className="bg-white border-slate-100 rounded-[2.5rem] p-6 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between mb-6 px-2">
                    <div className="flex items-center gap-2">
                        <Settings size={14} className="text-slate-400" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Node Management</span>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <Link href={`/dashboard/projects/${project.id}/edit`} className="col-span-2">
                        <Button variant="outline" className="w-full h-12 rounded-xl border-slate-200 font-bold text-xs uppercase tracking-widest gap-2 hover:bg-slate-50">
                            <Pencil size={14} /> Edit Identity
                        </Button>
                    </Link>
                    <form action={togglePin.bind(null, project.id, project.is_pinned)} className="w-full">
                        <Button variant="outline" className={cn("w-full h-12 rounded-xl border-slate-200 font-bold text-xs uppercase tracking-widest gap-2 transition-all", project.is_pinned ? "text-amber-600 bg-amber-50 border-amber-100 shadow-inner" : "text-slate-400 hover:bg-slate-50")}>
                            <Pin size={14} className={project.is_pinned ? "fill-amber-600" : ""} /> {project.is_pinned ? "Pinned" : "Pin"}
                        </Button>
                    </form>
                    <form action={togglePublic.bind(null, project.id, project.is_public)} className="w-full">
                        <Button variant="outline" className={cn("w-full h-12 rounded-xl border-slate-200 font-bold text-xs uppercase tracking-widest gap-2 transition-all", project.is_public ? "text-emerald-600 bg-emerald-50 border-emerald-100 shadow-inner" : "text-slate-400 hover:bg-slate-50")}>
                            {project.is_public ? <Globe size={14} /> : <Lock size={14} />} {project.is_public ? "Public" : "Private"}
                        </Button>
                    </form>
                    {project.status !== 'archived' ? (
                        <>
                            <div className="col-span-1"><ArchiveProjectButton projectId={projectId} /></div>
                            <div className="col-span-1"><DeleteProjectButton projectId={project.id} confirmMessage={dict.delete_confirm} /></div>
                        </>
                    ) : (
                        <div className="col-span-2"><DeleteProjectButton projectId={project.id} confirmMessage={dict.delete_confirm} /></div>
                    )}
                    <div className="col-span-2 pt-2 border-t border-slate-50 mt-2">
                        <ExportBlueprintButton projectId={project.id} projectTitle={project.title} />
                    </div>
                </div>
            </Card>

            {project.is_public && (
                <Card className="bg-slate-50 border-slate-200 rounded-[2.5rem] p-6 border-dashed border-2 overflow-hidden">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <ShieldCheck size={16} className="text-emerald-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Sovereign Access Node</span>
                        </div>
                        <CopyLinkButton url={publicLink} />
                    </div>
                </Card>
            )}

            <TimeTracker projectId={project.id} userId={user?.id || ''} logs={logs} hourlyRate={project.hourly_rate} currency={projectCurrency} dict={timeDict} />
            <ProjectLinks projectId={project.id} links={links} resources={linkedResources} dict={dict} />
            
            <Card className="bg-slate-900 text-white rounded-[2.5rem] p-8 border-none shadow-xl relative group overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                <div className="relative z-10 space-y-6">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 italic leading-none">Allocated Reservoir</h3>
                    <div className="space-y-3">
                        <span className="text-4xl font-black italic tracking-tighter truncate block">{formatCurrency(health?.remainingBudget || 0, projectCurrency)}</span>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden p-[1px]">
                            <div className={cn("h-full rounded-full transition-all duration-1000", (health?.burnPercentage || 0) > 85 ? "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]" : (health?.burnPercentage || 0) > 60 ? "bg-amber-500" : "bg-emerald-500")} style={{ width: `${Math.min(health?.burnPercentage || 0, 100)}%` }} />
                        </div>
                    </div>
                    <div className="pt-4 border-t border-white/5 space-y-3 text-[10px] font-black uppercase tracking-widest">
                        <div className="flex justify-between gap-2">
                            <span className="opacity-40 italic">Direct Costs</span>
                            <span className="text-rose-400 shrink-0">-{formatCurrency(directMonthlyBurn, projectCurrency)}</span>
                        </div>
                        {overhead.perProjectWeight > 0 && (
                             <div className="flex justify-between gap-2">
                                <span className="text-indigo-400 opacity-80 italic">Global Overhead</span>
                                <span className="text-indigo-400 shrink-0">-{formatCurrency(overhead.perProjectWeight, projectCurrency)}</span>
                            </div>
                        )}
                        <div className="flex justify-between pt-3 border-t border-white/5 items-center gap-2">
                            <span className="text-white/60">Survival Capability</span>
                            <span className={cn("font-black italic text-sm shrink-0", estimatedRunway === "∞" ? "text-emerald-400" : Number(estimatedRunway) < 2 ? "text-rose-500 animate-pulse" : "text-emerald-400")}>{estimatedRunway} {estimatedRunway !== "∞" ? 'Mths' : ''}</span>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
      </div>
    </div>
  )
}
