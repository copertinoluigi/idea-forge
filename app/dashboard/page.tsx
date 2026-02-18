import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  ArrowRight, Wallet, FolderKanban, Plus, TrendingUp, Clock, CreditCard, Quote, Heart, Info, Target, Globe, Rocket, Zap 
} from 'lucide-react'
import ical from 'node-ical'
import { formatCurrency } from '@/lib/utils'
import FocusTimer from '@/components/dashboard/FocusTimer'
import { getDictionary } from '@/lib/translations'
import AIConsultant from '@/components/dashboard/AIConsultant'
import NextEventWidget from '@/components/dashboard/NextEventWidget'
import { getDashboardStrategicData, getStreakData } from '@/app/actions'
import { StrategicHeader } from '@/components/dashboard/StrategicHeader'
import { FounderStreak } from '@/components/dashboard/FounderStreak'
import FounderSetupWizard from '@/components/dashboard/FounderSetupWizard'
import GlobalTasksCard from '@/components/dashboard/GlobalTasksCard'

const MOTIVATIONAL_QUOTES = [
  "The secret of getting ahead is getting started.",
  "Focus on being productive instead of busy.",
  "Discipline is choosing between what you want now and what you want most.",
  "Your future is created by what you do today, not tomorrow.",
  "Small daily improvements are the key to staggering long-term results.",
  "Amateurs sit and wait for inspiration, the rest of us just get up and go to work.",
  "Simplicity is the ultimate sophistication.",
  "Act as if what you do makes a difference. It does.",
  "Success is the sum of small efforts, repeated day in and day out.",
  "Build something people want, then find the people who want it.",
  "Done is better than perfect.",
  "The best time to plant a tree was 20 years ago. The second best time is now.",
  "Your network is your net worth.",
  "Fail fast, learn faster.",
  "Ideas are worthless without execution.",
  "Work hard in silence, let success make the noise.",
  "The only way to do great work is to love what you do.",
  "Constraints breed creativity.",
  "Overnight success is ten years in the making.",
  "Automate the mundane, innovate the important."
]

export const dynamic = 'force-dynamic'

// Aggiungiamo searchParams come prop della funzione
export default async function DashboardPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> 
}) {
  // 1. Intercettiamo immediatamente l'intento di acquisto
  const resolvedSearchParams = await searchParams;
  const planIntent = resolvedSearchParams.plan;

  if (planIntent === 'pro') {
    redirect('/dashboard/settings#billing');
  }

  // 2. Proseguiamo con il resto della logica originale
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/auth/login')

  const cookieStore = await cookies()
  const lang = cookieStore.get('mindhub_locale')?.value || 'en'
  const fullDict = getDictionary(lang)
  const dict = fullDict.dashboard
  const aiDict = fullDict.ai
  const [
    strategicData, 
    streakData, 
    reportsRes, 
    profileRes, 
    projectsRes, 
    subsRes,
    globalTasksRes
  ] = await Promise.all([
    getDashboardStrategicData(),
    getStreakData(),
    supabase.from('ai_reports').select('*').eq('user_id', user?.id).order('created_at', { ascending: false }),
    supabase.from('profiles').select('*').eq('id', user?.id).single(),
    supabase.from('projects').select('*').eq('user_id', user?.id).eq('status', 'active').order('updated_at', { ascending: false }).limit(4),
    supabase.from('subscriptions').select('*').eq('user_id', user?.id).eq('active', true).order('renewal_date', { ascending: true }),
    supabase.from('tasks').select('*').eq('user_id', user?.id).eq('is_completed', false).is('project_id', null).order('priority', { ascending: false })
  ])

  const profile = profileRes?.data
  const baseCurrency = profile?.base_currency || 'EUR';
  const aiReports = reportsRes?.data || []
  const activeProjects = projectsRes?.data || []
  const subscriptions = subsRes?.data || []
  const globalTasks = globalTasksRes?.data || []

  const monthlyBurn = subscriptions.reduce((acc, sub) => acc + Number(sub.cost || 0), 0)
  const today = new Date()
  today.setHours(0,0,0,0)
  const nextRenewal = subscriptions.find(s => s.renewal_date && new Date(s.renewal_date) >= today)
  
  const randomQuote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]
  const hour = new Date().getHours()
  let greeting = dict.welcome.morning
  if (hour >= 12 && hour < 18) greeting = dict.welcome.afternoon
  if (hour >= 18) greeting = dict.welcome.evening

  let externalEvents: { title: string, date: Date, label: string }[] = []
  const userCalendars = profile?.calendars || []

  if (userCalendars.length > 0) {
    const calendarPromises = userCalendars.map(async (cal: any) => {
      try {
        // Scarichiamo il calendario iCal (timeout di 2s per non rallentare troppo la dashboard)
        const data = await ical.async.fromURL(cal.url)
        return Object.values(data)
          .filter((ev: any) => ev.type === 'VEVENT' && new Date(ev.start) >= new Date())
          .map((ev: any) => ({
            title: ev.summary,
            date: new Date(ev.start),
            label: cal.name || "External Event"
          }))
      } catch (e) {
        console.error("Failed to fetch calendar for dashboard card:", cal.name)
        return []
      }
    })
    const results = await Promise.all(calendarPromises)
    externalEvents = results.flat()
  }

  // --- LOGICA DYNAMIC MILESTONE (UNIFICATA) ---
  let nextMilestone: {
    title: string;
    date: Date | null;
    label: string;
    isConfigured: boolean;
  } = {
    title: "No upcoming nodes",
    date: null,
    label: "Strategic Silence",
    isConfigured: userCalendars.length > 0
  }

  // 1. Uniamo Task interni ed Eventi esterni
  const allUpcomingItems = [
    ...globalTasks
        .filter(t => t.due_date && new Date(t.due_date) >= today)
        .map(t => ({ title: t.title, date: new Date(t.due_date!), label: "Task Deadline" })),
    ...externalEvents
  ].sort((a, b) => a.date.getTime() - b.date.getTime())

  // 2. Se abbiamo trovato qualcosa, prendiamo il primo (il più vicino)
  if (allUpcomingItems.length > 0) {
    nextMilestone = {
      title: allUpcomingItems[0].title,
      date: allUpcomingItems[0].date,
      label: allUpcomingItems[0].label,
      isConfigured: true
    }
  }

  // 3. Setup Onboarding se non c'è nulla
  if (!nextMilestone.date && !nextMilestone.isConfigured) {
    nextMilestone.title = "Identity Sync Required"
    nextMilestone.label = "Configure iCal in Settings"
  }
  
  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20 font-sans text-slate-900">
      
      {/* 1. SALUTO & DAILY WISDOM (UNIFIED DNA) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div className="space-y-1">
          <h1 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">
            {greeting}, <span className="text-indigo-600">{profile?.first_name || 'Founder'}</span>.
          </h1>
          <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-[0.2em] opacity-70">
            Startup Operating System initialized.
          </p>
        </div>
        
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl px-6 py-4 flex items-center gap-4 shadow-sm relative overflow-hidden group max-w-md h-fit">
            <Quote className="h-10 w-10 text-indigo-100 absolute -right-2 -top-2 rotate-12" />
            <div className="relative z-10">
                <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest mb-1 opacity-70">Daily Wisdom</p>
                <p className="text-sm font-medium text-slate-600 leading-relaxed italic">"{randomQuote}"</p>
            </div>
        </div>
      </div>

      {/* 2. STRATEGIC HEADER (Runway & Briefing) */}
      {strategicData && <StrategicHeader data={strategicData} dict={fullDict} />}

      {/* 3. QUICK ACTIONS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <Link href="/dashboard/projects/new"><Button className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-[10px] shadow-lg transition-all active:scale-95"><Plus size={18} /> New Sprint</Button></Link>
         <Link href="/dashboard/finances/new"><Button variant="outline" className="w-full h-14 text-emerald-700 border-emerald-200 bg-white hover:bg-emerald-50 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-[10px] shadow-sm active:scale-95 transition-all"><Plus size={18} /> Add Cost</Button></Link>
         <Link href="/dashboard/resources/new"><Button variant="outline" className="w-full h-14 text-purple-700 border-purple-200 bg-white hover:bg-purple-50 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-[10px] shadow-sm active:scale-95 transition-all"><Plus size={18} /> Add Asset</Button></Link>
         <a href="#global-backlog" className="w-full"><Button variant="outline" className="w-full h-14 text-indigo-700 border-indigo-200 bg-white hover:bg-indigo-50 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-[10px] shadow-sm active:scale-95 transition-all"><Target size={18} /> Strategy</Button></a>
      </div>

      {/* 4. KPI GRID (4 NODES UNIFIED) */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 font-sans">
        {/* CARD 1: ACTIVE PROJECTS */}
        <Link href="/dashboard/projects" className="block group">
            <Card className="border-l-4 border-l-blue-500 shadow-sm group-hover:shadow-md transition-all h-full rounded-3xl bg-white p-8">
                <div className="flex flex-row items-center justify-between mb-5">
                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Active Sprints</CardTitle>
                    <div className="h-10 w-10 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-100 shadow-sm"><FolderKanban size={18} /></div>
                </div>
                <div className="text-3xl font-black text-slate-900 tracking-tighter">{activeProjects.length}</div>
                <p className="text-[10px] text-blue-600 font-black uppercase mt-2 tracking-widest">In Execution</p>
            </Card>
        </Link>

        {/* CARD 2: BUSINESS BURN */}
        <Link href="/dashboard/finances?filter=global" className="block group">
            <Card className="border-l-4 border-l-emerald-500 shadow-sm group-hover:shadow-md transition-all h-full rounded-3xl bg-white p-8">
                <div className="flex flex-row items-center justify-between mb-5">
                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Business Burn</CardTitle>
                    <div className="h-10 w-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-100 shadow-sm"><Wallet size={18} /></div>
                </div>
                <div className="text-3xl font-black text-slate-900 tracking-tighter">
    {formatCurrency(strategicData?.businessBurn || 0, baseCurrency)}
</div>
                <p className="text-[10px] text-emerald-600 font-black uppercase mt-2 tracking-widest">Startup Costs</p>
            </Card>
        </Link>

        {/* CARD 3: PRIVATE LIFE (FIXED COLOR) */}
        <Link href="/dashboard/finances?filter=personal" className="block group">
            <Card className="border-l-4 border-l-pink-500 shadow-sm group-hover:shadow-md transition-all h-full rounded-3xl bg-white p-8">
                <div className="flex flex-row items-center justify-between mb-5">
                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Private Life</CardTitle>
                    <div className="h-10 w-10 bg-pink-50 rounded-2xl flex items-center justify-center text-pink-600 border border-pink-100 shadow-sm"><Heart size={18} /></div>
                </div>
                <div className="text-3xl font-black text-slate-900 tracking-tighter">
    {formatCurrency(strategicData?.lifeBurn || 0, baseCurrency)}
</div>
                <p className="text-[10px] text-pink-600 font-black uppercase mt-2 tracking-widest">Personal Spending</p>
            </Card>
        </Link>

        {/* CARD 4: NEXT MILESTONE (DYNAMIC) */}
        <Link href={nextMilestone.isConfigured ? "/dashboard/agenda" : "/dashboard/settings#integrations"} className="block group">
            <Card className={`border-l-4 ${nextMilestone.date ? 'border-l-indigo-500' : 'border-l-slate-300'} shadow-sm group-hover:shadow-md transition-all h-full rounded-3xl bg-white p-8`}>
                <div className="flex flex-row items-center justify-between mb-5">
                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Next Milestone</CardTitle>
                    <div className={`h-10 w-10 ${nextMilestone.date ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'} rounded-2xl flex items-center justify-center border border-current/10 shadow-sm`}>
                        {nextMilestone.isConfigured ? <Clock size={18} /> : <Zap size={18} />}
                    </div>
                </div>
                
                <div className="text-sm font-black text-slate-900 tracking-tight leading-tight line-clamp-2 min-h-[40px] uppercase italic">
                  {nextMilestone.title}
                </div>

                {nextMilestone.date ? (
                  <p className="text-[10px] text-indigo-600 font-black uppercase mt-2 tracking-widest">
                    {nextMilestone.date.toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-US', { 
                        month: 'numeric', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })} • {nextMilestone.label}
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-400 font-black uppercase mt-2 tracking-widest flex items-center gap-1">
                    <Info size={10} /> {nextMilestone.label}
                  </p>
                )}
            </Card>
        </Link>
      </div>

      {/* 5. STRATEGIC DIRECTIVES */}
      <GlobalTasksCard initialTasks={globalTasks} userId={user?.id || ''} />

      {/* 6. AI CO-FOUNDER (Modulo Integrato) */}
      <AIConsultant dict={aiDict} history={aiReports} credits={profile?.credits || 0} />

      {/* 7. CRITICAL INITIATIVES / SIDEBAR GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden group">
            <FolderKanban className="absolute -right-6 -top-6 h-32 w-32 text-indigo-500/5 -rotate-12 group-hover:rotate-0 transition-transform duration-700" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 relative z-10">
                <div className="space-y-1">
                    <h3 className="text-xl font-black text-slate-900 italic uppercase tracking-tighter leading-none">
                        Critical Initiatives
                    </h3>
                    <p className="text-sm text-slate-500 font-medium italic opacity-70 uppercase tracking-widest">
                        Nodes in execution phase
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/projects" className="text-xs font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-widest underline underline-offset-4">View All</Link>
                    <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-100">
                        <Rocket size={24} />
                    </div>
                </div>
            </div>

            <div className="space-y-4 relative z-10">
                {activeProjects.length === 0 ? (
                    <div className="py-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No active initiatives found</p>
                    </div>
                ) : (
                    activeProjects.map((project) => (
                        <Link href={`/dashboard/projects/${project.id}`} key={project.id} className="block group border border-slate-100 rounded-2xl p-5 bg-slate-50/30 hover:bg-white hover:border-indigo-300 transition-all shadow-sm">
                            <div className="flex items-center justify-between gap-4 mb-4">
                                <div className="flex items-center gap-4 flex-1 min-w-0"> 
                                    <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-indigo-600 font-black text-xs shadow-sm">{project.title.substring(0,2)}</div>
                                    <p className="font-bold text-sm text-slate-900 truncate uppercase tracking-tight">{project.title}</p>
                                </div>
                                <span className="text-[10px] font-black text-indigo-600 bg-white px-3 py-1 rounded-lg border border-indigo-100 shadow-sm italic">{project.progress}% velocity</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                                <div className="h-full bg-indigo-600 transition-all duration-1000 shadow-[0_0_10px_rgba(79,70,229,0.4)]" style={{ width: `${project.progress}%` }} />
                            </div>
                        </Link>
                    ))
                )}
            </div>
          </Card>
        </div>

        {/* SIDEBAR COLUMN */}
        <div className="space-y-6">
            {/* UPCOMING IMPACT - DARK & PREMIUM */}
            <Card className="bg-slate-900 text-white rounded-[2.5rem] p-8 border border-slate-800 shadow-2xl relative overflow-hidden group min-h-[280px] flex flex-col justify-between">
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-transparent pointer-events-none opacity-50" />
                
                <div className="relative z-10 flex justify-between items-start">
                    <div className="space-y-1">
                        <h3 className="text-xl font-black italic uppercase tracking-tighter text-white leading-none">
                            Upcoming
                        </h3>
                        <p className="text-xs text-slate-500 font-medium italic uppercase tracking-widest opacity-70">
                            Runway impact
                        </p>
                    </div>
                    <Link href="/dashboard/finances">
                        <Button variant="ghost" className="h-10 px-4 bg-white/5 hover:bg-white/10 text-white font-black text-[10px] uppercase tracking-widest rounded-xl border border-white/5">Manage</Button>
                    </Link>
                </div>

                <div className="relative z-10 mt-8">
                    {nextRenewal ? (
                        <div className="space-y-6">
                            <div>
                                <p className="text-4xl font-black text-white font-mono tracking-tighter leading-none">
                                  {formatCurrency(nextRenewal.cost, nextRenewal.currency || 'EUR')}
                                </p>
                                <p className="text-sm font-bold mt-2 text-slate-400 uppercase italic opacity-80">{nextRenewal.title}</p>
                            </div>
                            <div className="flex flex-col gap-3 pt-4 border-t border-white/5">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest opacity-50">
                                    <span>Total Burn</span>
                                    <span className="text-rose-400">-{formatCurrency(monthlyBurn)}</span>
                                </div>
                                <div className="flex items-center text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-400 w-fit px-4 py-2 rounded-2xl border border-emerald-500/20 shadow-lg shadow-emerald-900/20">
                                    <Clock className="mr-2 h-3.5 w-3.5" /> Due: {new Date(nextRenewal.renewal_date).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="py-6 text-center text-xs opacity-40 italic font-medium">No system drain detected.</div>
                    )}
                </div>
            </Card>

            <FocusTimer />
        </div>
      </div>

      <FounderStreak streak={streakData?.currentStreak || 0} progress={streakData?.progress || 0} dict={fullDict} />
      <FounderSetupWizard user={profile} dict={fullDict} />
    </div>
  )
}













