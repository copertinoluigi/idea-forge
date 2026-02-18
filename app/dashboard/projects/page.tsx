import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getDictionary } from '@/lib/translations'
import { 
  Layers, Plus, ExternalLink, Sparkles, FolderOpen, 
  Target, Construction, PauseCircle, Archive, Info 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { canCreateMore } from '@/lib/access-control'
import { ImportBlueprintDialog } from "@/components/projects/import-blueprint-dialog"
import { NexusInviteAlert } from "@/components/dashboard/NexusInviteAlert"

export default async function ProjectsPage() {
  const supabase = await createClient()
  const cookieStore = await cookies()
  const lang = cookieStore.get('mindhub_locale')?.value || 'en'
  const dict = getDictionary(lang).projects
  
  const { supabaseAdmin } = await import('@/lib/supabase/admin');

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // 1. RECUPERO PARALLELO: Owned + Shared + Pending Invites
  const [profileReq, ownedProjectsReq, sharedMembershipsReq, pendingInvitesReq] = await Promise.all([
    supabase.from('profiles').select('plan_status').eq('id', user.id).single(),
    
    // Progetti creati dall'utente
    supabase.from('projects').select('*').eq('user_id', user.id),
    
    // Progetti condivisi accettati (Admin Bypass)
    supabaseAdmin.from('project_members')
      .select('projects(*)')
      .eq('profile_id', user.id)
      .eq('status', 'accepted'),

    // Nuovi inviti pendenti per l'email dell'utente
    supabase.from('project_members')
      .select('id, projects(title)')
      .eq('invited_email', user.email?.toLowerCase())
      .eq('status', 'pending')
  ])

  const profile = profileReq.data
  const owned = ownedProjectsReq.data || []
  const shared = sharedMembershipsReq.data?.map((m: any) => m.projects).filter(Boolean) || []
  const pendingInvites = (pendingInvitesReq.data as any[]) || []
  
  const allProjects = [...owned, ...shared].sort((a: any, b: any) => 
    new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  )
  
  const groups = {
    active: allProjects.filter(p => p.status === 'active'),
    planning: allProjects.filter(p => p.status === 'planning'),
    idea: allProjects.filter(p => p.status === 'idea'),
    paused: allProjects.filter(p => p.status === 'paused'),
    archived: allProjects.filter(p => p.status === 'archived'),
  }

  const activeCount = allProjects.filter(p => p.status !== 'archived').length
  const access = canCreateMore(profile?.plan_status || 'free', activeCount, 'projects')

  const ProjectCard = ({ project }: { project: any }) => {
    const isClient = project.type === 'client'
    const isShared = project.user_id !== user.id

    return (
        <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
          <Card className={`hover:shadow-lg transition-all group bg-white rounded-2xl overflow-hidden border border-slate-100 ${isClient ? 'border-l-4 border-l-emerald-500' : 'border-l-4 border-l-blue-500'}`}>
            <CardHeader className="pb-2 pt-6 px-6">
              <div className="flex items-center justify-between">
                <div className="flex gap-2 flex-wrap">
                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                        project.status === 'active' ? "bg-indigo-50 text-indigo-600 border-indigo-100" : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}>
                        {project.status}
                    </span>
                    {isClient && (
                        <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                          Client Node
                        </span>
                    )}
                    {isShared && (
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100 italic">
                          Nexus Shared
                        </span>
                    )}
                </div>
                <ExternalLink className="h-4 w-4 text-slate-200 group-hover:text-indigo-600 transition-colors" />
              </div>
              <CardTitle className="text-lg font-bold text-slate-900 mt-4 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">
                {project.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <p className="text-sm text-slate-500 line-clamp-2 mb-6 min-h-[2.5rem] font-medium leading-relaxed">
                {project.description || "Project initialized. No briefing provided."}
              </p>
              
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
                  <span>Sprint Velocity</span>
                  <span>{project.progress}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className={`${isClient ? "bg-emerald-500" : "bg-indigo-600"} h-full rounded-full transition-all duration-1000`} 
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
    )
  }

  const SectionHeading = ({ title, icon: Icon, color, count }: { title: string, icon: any, color: string, count: number }) => (
    <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-6 mt-12 first:mt-0">
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl bg-white border border-slate-100 shadow-sm ${color}`}>
                <Icon size={18} />
            </div>
            <h3 className="text-xl font-bold uppercase italic tracking-tighter text-slate-900 leading-none">
                {title}
            </h3>
        </div>
        <span className="text-[10px] font-black bg-slate-50 text-slate-400 px-3 py-1 rounded-full border border-slate-100">
            {count} NODES
        </span>
    </div>
  )

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20 font-sans text-slate-900">
      
      {/* NEXUS INVITE BANNER (Only shows if pendingInvites exists) */}
      <NexusInviteAlert pendingInvites={pendingInvites} />

      {/* 1. PROTOCOL HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8">
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                    <Layers className="h-7 w-7 text-white fill-white" />
                </div>
                <h1 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">
                    {dict.title}
                </h1>
            </div>
            <p className="text-sm text-slate-500 font-medium italic opacity-70 uppercase tracking-widest ml-16">
              {dict.subtitle}
            </p>
        </div>

        <div className="flex items-center gap-3">
            {access.allowed ? (
                <>
                    <ImportBlueprintDialog />
                    <Link href="/dashboard/projects/new" className="w-full sm:w-auto">
                        <Button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl h-12 px-6 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all active:scale-95">
                            <Plus className="mr-2 h-4 w-4" /> {dict.new_button}
                        </Button>
                    </Link>
                </>
            ) : (
                <Link href="/dashboard/settings" className="w-full sm:w-auto">
                    <Button className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-white shadow-xl h-12 px-6 rounded-xl font-bold gap-2 uppercase tracking-widest text-[10px]">
                        <Sparkles className="h-4 w-4" /> Upgrade Pro
                    </Button>
                </Link>
            )}
        </div>
      </div>

      {/* 2. ACCESS LIMIT ALERT */}
      {!access.allowed && (
          <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-3xl flex items-center justify-between shadow-sm animate-in slide-in-from-top-2">
              <div className="flex items-center gap-4">
                  <Sparkles className="h-6 w-6 text-indigo-600" />
                  <p className="text-sm font-bold text-indigo-900 uppercase tracking-tight">{access.message}</p>
              </div>
              <Link href="/dashboard/settings" className="text-xs font-black text-indigo-600 uppercase underline decoration-2 underline-offset-4">View Plans</Link>
          </div>
      )}

      {/* 3. PROJECT SECTIONS */}
      <div className="pt-4">
        {groups.active.length > 0 && (
            <div className="mb-16">
                <SectionHeading title="Active Sprints" icon={Target} color="text-indigo-600" count={groups.active.length} />
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {groups.active.map(p => <ProjectCard key={p.id} project={p} />)}
                </div>
            </div>
        )}
        
        {groups.planning.length > 0 && (
            <div className="mb-16">
                <SectionHeading title="Planning Phase" icon={Construction} color="text-amber-500" count={groups.planning.length} />
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {groups.planning.map(p => <ProjectCard key={p.id} project={p} />)}
                </div>
            </div>
        )}

        {groups.idea.length > 0 && (
            <div className="mb-16">
                <SectionHeading title="Strategic Ideas" icon={FolderOpen} color="text-blue-500" count={groups.idea.length} />
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {groups.idea.map(p => <ProjectCard key={p.id} project={p} />)}
                </div>
            </div>
        )}

        {groups.paused.length > 0 && (
            <div className="mb-16">
                <SectionHeading title="Paused Nodes" icon={PauseCircle} color="text-slate-400" count={groups.paused.length} />
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {groups.paused.map(p => <ProjectCard key={p.id} project={p} />)}
                </div>
            </div>
        )}

        {groups.archived.length > 0 && (
            <div className="mb-16">
                <SectionHeading title="Archived Nodes" icon={Archive} color="text-slate-300" count={groups.archived.length} />
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 opacity-60">
                  {groups.archived.map(p => <ProjectCard key={p.id} project={p} />)}
                </div>
            </div>
        )}

        {allProjects.length === 0 && (
          <div className="py-32 text-center bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-100">
            <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Layers className="h-8 w-8 text-slate-200" />
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">{dict.no_data}</p>
          </div>
        )}
      </div>

      <div className="mt-12 flex items-start gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-t border-slate-100 pt-6 opacity-60">
          <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-indigo-400" />
          <p className="leading-tight">
            Managing active project nodes. Shared Nexus nodes are tagged with a golden badge.
          </p>
      </div>
    </div>
  )
}
