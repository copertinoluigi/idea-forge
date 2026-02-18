'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Archive, LogOut, ShieldAlert, Menu, X,
  FileText, CalendarDays, Wallet, FolderKanban, Coins, ChevronDown, Pin, Activity, Settings, MessageSquare
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getDictionary } from '@/lib/translations'

// Definizione interfaccia per i conteggi provenienti dal server
interface SidebarProps {
  initialCounts?: {
    activeProjects: number;
    tasksToday: number;
    pendingExpenses: number;
  }
}

export default function Sidebar({ initialCounts }: SidebarProps) {
  const pathname = usePathname()
  const supabase = createClient()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isProjectsOpen, setIsProjectsOpen] = useState(false) // Collassato di default
  const [userEmail, setUserEmail] = useState<string>("")
  const [firstName, setFirstName] = useState<string>("")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [credits, setCredits] = useState<number>(0)
  const [activeProjects, setActiveProjects] = useState<any[]>([])
  
  const [prefs, setPrefs] = useState<any>({ 
    showSocial: true, showLife: true, showTemplates: true, showArchive: true 
  })
  
  const dict = getDictionary('en').nav

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email || "")
        
        // 1. Recupero Dati Profilo
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin, avatar_url, preferences, first_name, credits')
          .eq('id', user.id)
          .single()

        if (profile) {
            if (profile.is_admin) setIsAdmin(true)
            if (profile.avatar_url) setAvatarUrl(profile.avatar_url)
            if (profile.preferences) setPrefs(profile.preferences)
            if (profile.first_name) setFirstName(profile.first_name)
            if (profile.credits !== undefined) setCredits(profile.credits)
        }

        // 2. Recupero Nodi Progetto per la lista rapida
        const { data: projects } = await supabase
          .from('projects')
          .select('id, title, is_pinned, progress')
          .eq('user_id', user.id)
          .neq('status', 'archived')
          .order('is_pinned', { ascending: false })
          .order('updated_at', { ascending: false })

        if (projects) setActiveProjects(projects)
      }
    }
    getData()
  }, [supabase, pathname])

  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  // Struttura Navigazione Superiore (Control & Burn)
  const topNavItems = [
    { 
        href: '/dashboard', 
        label: 'Control Center', 
        sub: 'System Overview', 
        icon: LayoutDashboard, 
        color: 'text-indigo-500',
        badge: null
    },
    {
        href: '/dashboard/chat',
        label: 'Chat',
        sub: 'AI & Team Rooms',
        icon: MessageSquare,
        color: 'text-sky-500',
        badge: null
    },
    {
        href: '/dashboard/finances',
        label: 'Burn Rate',
        sub: 'Financial Integrity',
        icon: Wallet,
        color: 'text-rose-500',
        badge: initialCounts?.pendingExpenses && initialCounts.pendingExpenses > 0
               ? { val: initialCounts.pendingExpenses, color: 'bg-rose-500' }
               : null
    },
  ]

  // Struttura Navigazione Inferiore (Agenda, Playbooks, Assets)
  const bottomNavItems = [
    { 
        href: '/dashboard/agenda', 
        label: 'Agenda', 
        sub: 'Temporal Roadmap', 
        icon: CalendarDays, 
        color: 'text-amber-500',
        badge: initialCounts?.tasksToday && initialCounts.tasksToday > 0 
               ? { val: initialCounts.tasksToday, color: 'bg-amber-500' } 
               : null
    },
    ...(prefs.showTemplates !== false ? [{ 
        href: '/dashboard/templates', 
        label: 'Playbooks', 
        sub: 'Standard Ops (SOP)', 
        icon: FileText, 
        color: 'text-violet-500',
        badge: null 
    }] : []),
    ...(prefs.showArchive !== false ? [{ 
        href: '/dashboard/resources', 
        label: 'Assets', 
        sub: 'Source Inventory', 
        icon: Archive, 
        color: 'text-emerald-500',
        badge: null 
    }] : []),
  ]

  const NavContent = () => (
    <div className="flex flex-col h-full bg-[#0F1117] font-sans">
      {/* Brand Identity */}
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <LayoutDashboard className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white italic uppercase">BYOI</span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto custom-scrollbar px-4 space-y-1">
        {/* Render Blocchi Superiori */}
        {topNavItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-3 transition-all",
                isActive 
                  ? "bg-white/10 text-white shadow-sm ring-1 ring-white/10" 
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-indigo-400" : item.color)} />
              <div className="flex flex-col flex-1">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-bold leading-none">{item.label}</span>
                    {item.badge && (
                        <span className={cn("text-[9px] font-black text-white px-1.5 py-0.5 rounded-md leading-none min-w-[18px] text-center shadow-sm", item.badge.color)}>
                            {item.badge.val}
                        </span>
                    )}
                </div>
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 opacity-60 mt-1">{item.sub}</span>
              </div>
            </Link>
          )
        })}

        {/* PROJECTS ACCORDION (Posizione 3) */}
        <div className="space-y-1">
            <div className={cn(
                "group flex items-center justify-between rounded-xl pr-2 transition-all",
                pathname.startsWith('/dashboard/projects') ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"
            )}>
                <Link href="/dashboard/projects" className="flex items-center gap-3 px-3 py-3 flex-1 min-w-0">
                    <FolderKanban className={cn("h-5 w-5 shrink-0", pathname.startsWith('/dashboard/projects') ? "text-indigo-400" : "text-blue-500")} />
                    <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                           <span className="text-sm font-bold leading-none">Projects</span>
                           {initialCounts?.activeProjects && initialCounts.activeProjects > 0 ? (
                               <span className="text-[9px] font-black bg-blue-500 text-white px-1.5 py-0.5 rounded-md leading-none shadow-sm">{initialCounts.activeProjects}</span>
                           ) : null}
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 opacity-60 mt-1">Active Initiatives</span>
                    </div>
                </Link>
                <button 
                    onClick={(e) => { e.preventDefault(); setIsProjectsOpen(!isProjectsOpen); }}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors shrink-0"
                >
                    <ChevronDown className={cn("h-3 w-3 text-slate-500 transition-transform duration-300", isProjectsOpen && "rotate-180")} />
                </button>
            </div>

            {isProjectsOpen && activeProjects.length > 0 && (
                <div className="mt-1 ml-4 pl-4 border-l border-white/5 space-y-1 max-h-48 overflow-y-auto custom-scrollbar animate-in slide-in-from-top-2">
                    {activeProjects.map((p) => (
                        <Link 
                            key={p.id} 
                            href={`/dashboard/projects/${p.id}`}
                            className={cn(
                                "flex items-center justify-between group px-3 py-2 rounded-lg text-[10px] font-bold transition-all",
                                pathname === `/dashboard/projects/${p.id}` ? "text-white bg-indigo-600/20" : "text-slate-500 hover:text-slate-300"
                            )}
                        >
                            <div className="flex items-center gap-2 truncate">
                                {p.is_pinned ? <Pin size={10} className="text-amber-500 rotate-45 fill-amber-500" /> : <Activity size={10} className="text-slate-600" />}
                                <span className="truncate">{p.title}</span>
                            </div>
                            <span className="text-[9px] opacity-20 group-hover:opacity-40">{p.progress}%</span>
                        </Link>
                    ))}
                </div>
            )}
        </div>

        {/* Render Blocchi Inferiori */}
        {bottomNavItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-3 transition-all",
                isActive 
                  ? "bg-white/10 text-white shadow-sm ring-1 ring-white/10" 
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-indigo-400" : item.color)} />
              <div className="flex flex-col flex-1">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-bold leading-none">{item.label}</span>
                    {item.badge && (
                        <span className={cn("text-[9px] font-black text-white px-1.5 py-0.5 rounded-md leading-none min-w-[18px] text-center shadow-sm", item.badge.color)}>
                            {item.badge.val}
                        </span>
                    )}
                </div>
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 opacity-60 mt-1">{item.sub}</span>
              </div>
            </Link>
          )
        })}

        {isAdmin && (
          <div className="pt-4 mt-4 border-t border-white/5">
              <Link
                  href="/dashboard/admin"
                  className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all",
                  pathname === '/dashboard/admin' ? "bg-rose-500/20 text-rose-400 shadow-inner" : "text-rose-400 hover:bg-rose-50/10"
                  )}
              >
                  <ShieldAlert className="h-5 w-5 shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-bold leading-none text-sm">God Mode</span>
                    <span className="text-[9px] font-bold uppercase tracking-widest opacity-60 mt-1 text-rose-300">System Admin</span>
                  </div>
              </Link>
          </div>
        )}
      </nav>

      {/* Mini Card Utente con Gear Icon */}
      <div className="px-4 py-4 border-t border-white/5">
        <Link href="/dashboard/settings" className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group relative">
          <div className="shrink-0 h-9 w-9 rounded-xl overflow-hidden border border-white/10 shadow-sm bg-indigo-600 flex items-center justify-center text-xs font-black text-white">
            {avatarUrl ? <img src={avatarUrl} className="h-full w-full object-cover" /> : userEmail.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1 overflow-hidden text-left">
            <p className="text-xs font-bold text-white truncate">{firstName || userEmail.split('@')[0]}</p>
            <div className="flex items-center gap-1.5 mt-1">
                <Coins size={10} className="text-amber-500 fill-amber-500/20" />
                <span className="text-[10px] font-black text-amber-500 uppercase tracking-tighter">{credits} Credits</span>
            </div>
          </div>
          <Settings size={12} className="text-slate-600 group-hover:text-white transition-colors" />
        </Link>
      </div>

      <div className="p-4 bg-[#0F1117]">
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-3 text-xs font-bold text-slate-500 hover:text-rose-400 hover:bg-rose-50/10 transition-all border border-transparent hover:border-rose-500/20 uppercase tracking-widest"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out Node</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#0F1117] flex items-center px-4 z-[60] border-b border-white/5 shadow-lg">
        <button 
          onClick={() => setIsMobileOpen(!isMobileOpen)} 
          className="text-white p-2 -ml-2 mr-2 active:bg-white/10 rounded-lg transition-colors z-[70]"
        >
            {isMobileOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
        </button>
        <div className="flex items-center gap-3 select-none">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <LayoutDashboard className="h-5 w-5 text-white" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight uppercase italic">BYOI</span>
        </div>
      </div>

      {isMobileOpen && (
        <>
          <div className="fixed inset-0 z-[65] bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setIsMobileOpen(false)} />
          <div 
            className="fixed inset-y-0 left-0 z-[70] w-72 bg-[#0F1117] shadow-2xl md:hidden animate-in slide-in-from-left duration-300 h-[100dvh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <NavContent />
          </div>
        </>
      )}

      <aside className="hidden md:flex h-screen w-72 flex-col bg-[#0F1117] border-r border-white/5 shadow-xl sticky top-0 shrink-0">
        <NavContent />
      </aside>
    </>
  )
}
