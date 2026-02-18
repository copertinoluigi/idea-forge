import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { 
  getAdminMetrics, 
  getGodModeAnalytics, 
  toggleBan, 
  addCredits, 
  createAnnouncement, 
  updateTrackingSettings 
} from "@/app/actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabaseAdmin } from '@/lib/supabase/admin'
import { Button } from "@/components/ui/button"
import { 
  ShieldAlert, Database, Users, Banknote, Activity, UserX, UserCheck, Plus, Megaphone, 
  Settings, Layers, CheckCircle2, TrendingDown, Coins, Zap, TrendingUp, Globe, BarChart3
} from "lucide-react"
import { formatCurrency } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
    const supabase = await createClient(); 
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user?.id).single()
    
    if (!profile?.is_admin) redirect('/dashboard')

    // Recupero metriche e analytics avanzate
    const [metrics, stats] = await Promise.all([
        getAdminMetrics(),
        getGodModeAnalytics()
    ])

    const { data: allUsers } = await supabaseAdmin.from('profiles').select('*').order('created_at', { ascending: false })
    const { data: appSettings } = await supabase.from('app_settings').select('*').single()

    // Helper per i colori dei badge di stato (Logica Intelligente)
    const getStatusBadge = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'beta':
                return "bg-indigo-100 text-indigo-700 border-indigo-200"
            case 'pro':
                return "bg-emerald-100 text-emerald-700 border-emerald-200"
            case 'expired':
                return "bg-rose-100 text-rose-700 border-rose-200"
            default:
                return "bg-slate-100 text-slate-600 border-slate-200"
        }
    }

    return (
        <div className="space-y-10 max-w-7xl mx-auto pb-24 px-4 animate-in fade-in duration-700">
            
            {/* 1. HEADER E STATO SISTEMA */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 pb-8">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 flex items-center gap-4">
                        <div className="p-3 bg-rose-600 rounded-2xl shadow-rose-200 shadow-xl text-white">
                            <ShieldAlert className="h-8 w-8" />
                        </div>
                        God Mode
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium">Global MindHub Intelligence & System Governance</p>
                </div>
                <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-2xl w-fit">
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-black text-emerald-700 uppercase tracking-widest">System Node Alpha: Live</span>
                </div>
            </div>

            {/* 2. FINANCIAL & INFRASTRUCTURE (Top Bar) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Revenue (Est.)', val: `€${metrics.estimatedRevenue}`, color: 'text-emerald-600', icon: Banknote, bg: 'bg-emerald-50' },
                    { label: 'AI Costs (Est.)', val: `$${metrics.aiCostEst.toFixed(2)}`, color: 'text-rose-600', icon: Activity, bg: 'bg-rose-50' },
                    { label: 'DB Load', val: `${metrics.dbCapacityPercent.toFixed(2)}%`, color: 'text-amber-600', icon: Database, bg: 'bg-amber-50' },
                    { label: 'Total Accounts', val: stats.retention.totalUsers, color: 'text-indigo-600', icon: Globe, bg: 'bg-indigo-50' },
                ].map((m, i) => (
                    <div key={i} className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-all">
                        <div className="flex justify-between items-center mb-4">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{m.label}</p>
                            <div className={`p-2 ${m.bg} ${m.color} rounded-xl`}><m.icon size={18} /></div>
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 leading-none tracking-tighter">{m.val}</h3>
                    </div>
                ))}
            </div>

            {/* 3. USER RETENTION & STICKINESS */}
            <div className="space-y-4">
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-indigo-500" /> Retention Analytics
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-white border-slate-100 shadow-sm rounded-3xl overflow-hidden group">
                        <CardContent className="p-6">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">DAU (Today)</p>
                            <div className="text-3xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors">{stats.retention.dau}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-white border-slate-100 shadow-sm rounded-3xl overflow-hidden group">
                        <CardContent className="p-6">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">WAU (7 Days)</p>
                            <div className="text-3xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{stats.retention.wau}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-white border-slate-100 shadow-sm rounded-3xl overflow-hidden group">
                        <CardContent className="p-6">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">MAU (30 Days)</p>
                            <div className="text-3xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">{stats.retention.mau}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-900 text-white border-none shadow-2xl rounded-3xl overflow-hidden">
                        <CardContent className="p-6 relative">
                            <Zap className="absolute right-2 top-2 h-12 w-12 text-white/5" />
                            <p className="text-[10px] font-bold text-indigo-400 uppercase mb-1">Stickiness</p>
                            <div className="text-3xl font-black">{stats.retention.activeRate}%</div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* 4. CREDIT ECONOMICS & SYSTEM VITALITY */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Credit Economy */}
                <div className="space-y-4">
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                        <Coins className="h-4 w-4 text-emerald-500" /> Credit Economics
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Card className="bg-emerald-50/50 border-emerald-100 rounded-3xl p-6">
                            <p className="text-[10px] font-bold text-emerald-600 uppercase mb-2">Total AI Usage</p>
                            <div className="text-4xl font-black text-emerald-900">{stats.credits.totalConsumed}</div>
                            <p className="text-[10px] text-emerald-600 font-bold uppercase mt-2">Reports Generated</p>
                        </Card>
                        <Card className="bg-white border-slate-200 rounded-3xl p-6">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Avg Cons./User</p>
                            <div className="text-4xl font-black text-slate-900">{stats.credits.avgPerUser}</div>
                            <div className="w-full bg-slate-100 h-1 rounded-full mt-4 overflow-hidden">
                                <div className="bg-indigo-500 h-full w-[60%]" />
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Vitality Monitor */}
                <div className="space-y-4">
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                        <Activity className="h-4 w-4 text-rose-500" /> Vitality Monitor
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5 border-l-4 border-l-blue-500">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Initiatives</p>
                            <p className="text-2xl font-black text-slate-900">{metrics.totalProjects}</p>
                        </div>
                        <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5 border-l-4 border-l-purple-500">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Tasks Done</p>
                            <p className="text-2xl font-black text-slate-900">{metrics.totalTasks}</p>
                        </div>
                        <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5 border-l-4 border-l-rose-500">
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Global Burn</p>
                            <p className="text-2xl font-black text-slate-900">€{metrics.globalBurn.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 5. DIRECTORY & TOOLS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Founders Directory */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-100/50 flex flex-col">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <Users className="h-5 w-5 text-indigo-600" /> Founders Directory
                        </h3>
                        <span className="text-[10px] font-bold bg-white px-2 py-1 border rounded-lg text-slate-500 uppercase">
                            {allUsers?.length} units
                        </span>
                    </div>
                    
                    <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Founder</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status / Economy</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {allUsers?.map((u) => (
                                    <tr key={u.id} className={`group hover:bg-slate-50/80 transition-colors ${u.is_banned ? 'bg-rose-50/30' : ''}`}>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-bold shrink-0 shadow-lg group-hover:scale-105 transition-transform">
                                                    {u.first_name?.charAt(0) || u.email.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                                                        <p className="text-sm font-bold text-slate-900 truncate">
                                                            {u.first_name} {u.last_name}
                                                        </p>
                                                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase tracking-tighter ${getStatusBadge(u.plan_status)}`}>
                                                            {u.plan_status || 'FREE'}
                                                        </span>
                                                        {u.is_admin && <span className="text-[8px] bg-amber-500 text-white px-1.5 py-0.5 rounded font-black tracking-tighter">GOD</span>}
                                                    </div>
                                                    <p className="text-xs text-slate-400 truncate">{u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col items-center">
                                                <div className={`flex items-center gap-1 font-mono font-black text-base ${u.credits <= 0 ? 'text-rose-500' : 'text-indigo-600'}`}>
                                                    <Coins className="h-3.5 w-3.5" />
                                                    {u.credits}
                                                </div>
                                                <span className="text-[9px] text-slate-400 uppercase font-black tracking-tighter">Avail. Credits</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <form action={addCredits} className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20">
                                                    <input type="hidden" name="userId" value={u.id} />
                                                    <input 
                                                        type="number" 
                                                        name="amount" 
                                                        placeholder="+10" 
                                                        className="w-12 bg-transparent border-none text-[11px] font-black text-center outline-none focus:ring-0" 
                                                    />
                                                    <Button size="icon" className="h-7 w-7 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md">
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                </form>

                                                <form action={toggleBan.bind(null, u.id, u.is_banned)}>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className={`h-9 w-9 rounded-xl transition-all ${u.is_banned ? "text-rose-600 bg-rose-100" : "text-slate-300 hover:text-rose-600 hover:bg-rose-50"}`}
                                                    >
                                                        {u.is_banned ? <UserCheck className="h-5 w-5" /> : <UserX className="h-5 w-5" />}
                                                    </Button>
                                                </form>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right Column: Admin Tools */}
                <div className="space-y-6">
                    <Card className="bg-slate-900 text-white border-none rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16" />
                        <CardHeader className="p-0 mb-6">
                            <CardTitle className="font-bold flex items-center gap-3 text-lg">
                                <Megaphone className="h-5 w-5 text-indigo-400" /> System Broadcast
                            </CardTitle>
                        </CardHeader>
                        <form action={createAnnouncement} className="space-y-5 relative z-10">
                            <textarea 
                                name="message" 
                                className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[120px] resize-none transition-all" 
                                placeholder="Push global notification to all founders..." 
                            />
                            <Button className="w-full bg-white hover:bg-slate-100 text-slate-900 rounded-xl font-black py-6 shadow-xl transition-all active:scale-[0.98]">
                                Send Global Message
                            </Button>
                        </form>
                    </Card>

                    <Card className="bg-white border-slate-200 rounded-[2.5rem] p-8 shadow-lg">
                        <CardHeader className="p-0 mb-6">
                            <CardTitle className="text-slate-900 font-bold flex items-center gap-3 text-lg">
                                <Settings className="h-5 w-5 text-indigo-600" /> Infrastructure Tracking
                            </CardTitle>
                        </CardHeader>
                        <form action={updateTrackingSettings} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">GA4 Measurement ID</label>
                                <input name="ga_id" defaultValue={appSettings?.ga_id} placeholder="G-XXXXXXXXXX" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-mono outline-none focus:ring-2 focus:ring-indigo-500/20" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Microsoft Clarity ID</label>
                                <input name="clarity_id" defaultValue={appSettings?.clarity_id} placeholder="Project ID" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-mono outline-none focus:ring-2 focus:ring-indigo-500/20" />
                            </div>
                            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black py-6 shadow-lg shadow-indigo-100 mt-4 transition-all">
                                Update Infrastructure
                            </Button>
                        </form>
                    </Card>

                    <div className="p-6 bg-indigo-50 rounded-[2rem] border border-indigo-100">
                        <div className="flex items-center gap-3 text-indigo-600 mb-2">
                            <BarChart3 className="h-5 w-5" />
                            <span className="text-xs font-black uppercase tracking-widest">Ecosystem Debt</span>
                        </div>
                        <p className="text-[10px] text-indigo-700/70 font-medium leading-relaxed">
                            There are currently <strong>{stats.credits.remainingInSystem} credits</strong> distributed across the ecosystem. 
                            Founders without credits: <strong>{stats.credits.usersOut}</strong>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
