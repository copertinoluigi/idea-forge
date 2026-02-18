'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Loader2, Save, User, Lock, Camera, Download, Database, Layout, 
  Calendar, Trash2, BellRing, Coffee, CalendarDays, Plus, Sparkles, Mail, Coins, PlayCircle, Settings,
  ShieldAlert, ShieldCheck, CheckCircle2, Zap, Info, HelpCircle, ChevronRight, CreditCard
} from 'lucide-react'
import { toast } from 'sonner'
import { getDictionary } from '@/lib/translations'
import { seedDemoData, deleteUserAccount } from '@/app/actions'
import Link from 'next/link'

const getCookie = (name: string) => {
  if (typeof document === 'undefined') return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(';').shift()
  return null
}

export default function SettingsPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  
  const lang = getCookie('mindhub_locale') || 'en'
  const fullDict = getDictionary(lang)
  const dict = fullDict.settings

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [credits, setCredits] = useState(0)
  const [preferences, setPreferences] = useState<any>({
    showSocial: true, showLife: true, showTemplates: true, showArchive: true,
    email_monday_brief: false,
    email_friday_wrap: false
  })
  const [calendars, setCalendars] = useState<any[]>([])

  // --- CONFIGURAZIONE GUMROAD ---
  const GUMROAD_URLS = {
    pro: process.env.NEXT_PUBLIC_GUMROAD_PRO_URL || "https://mindhubprotocol.gumroad.com/l/fxozs",
    credits50: process.env.NEXT_PUBLIC_GUMROAD_50_URL || "https://mindhubprotocol.gumroad.com/l/50-AI-TopUp",
    credits250: process.env.NEXT_PUBLIC_GUMROAD_250_URL || "https://mindhubprotocol.gumroad.com/l/rtpvxi",
    credits500: process.env.NEXT_PUBLIC_GUMROAD_500_URL || "https://mindhubprotocol.gumroad.com/l/ipmxxk"
  }

  useEffect(() => {
    const getData = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            setUser(user)
            const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
            if (data) {
                setProfile(data)
                setFirstName(data.first_name || '')
                setLastName(data.last_name || '')
                setPhone(data.phone || '')
                setAvatarUrl(data.avatar_url || '')
                setCredits(data.credits || 0)
                if (data.preferences) setPreferences(data.preferences)
                if (data.calendars) setCalendars(data.calendars)
            }
        }
        setLoading(false)
    }
    getData()
  }, [supabase])

  // Helper per generare il link Gumroad con metadati per il Webhook
  const getGumroadLink = (baseUrl: string) => {
    if (!user) return baseUrl
    return `${baseUrl}?user_id=${user.id}&email=${encodeURIComponent(user.email || '')}`
  }

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
        case 'beta': return "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
        case 'pro': return "bg-emerald-500 text-white shadow-lg shadow-emerald-200"
        default: return "bg-slate-100 text-slate-500"
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    setUploading(true)
    const file = e.target.files[0]
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-${Date.now()}.${fileExt}`
    const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file)
    if (uploadError) {
        toast.error('Upload failed')
        setUploading(false)
        return
    }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName)
    await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id)
    setAvatarUrl(publicUrl)
    toast.success('Avatar updated')
    setUploading(false)
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('profiles').update({ first_name: firstName, last_name: lastName, phone: phone }).eq('id', user.id)
    if (error) toast.error("Update failed")
    else toast.success("Profile saved")
    setSaving(false)
  }

  const handleAddCalendar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const newCal = { name: formData.get('calName'), url: formData.get('calUrl') }
    const updatedCals = [...calendars, newCal]
    setCalendars(updatedCals)
    await supabase.from('profiles').update({ calendars: updatedCals }).eq('id', user.id)
    toast.success("Calendar added")
    e.currentTarget.reset()
  }

  const removeCalendar = async (index: number) => {
    const updated = calendars.filter((_, i) => i !== index)
    setCalendars(updated)
    await supabase.from('profiles').update({ calendars: updated }).eq('id', user.id)
    toast.success("Removed")
  }

  const handleTogglePreference = async (key: string, value: boolean) => {
      const newPrefs = { ...preferences, [key]: value }
      setPreferences(newPrefs)
      await supabase.from('profiles').update({ preferences: newPrefs }).eq('id', user.id)
      toast.success("Settings updated")
  }

  const handleUpdateBaseCurrency = async (currency: string) => {
      // 1. Aggiornamento DB
      const { error } = await supabase
        .from('profiles')
        .update({ base_currency: currency })
        .eq('id', user.id);

      if (error) {
        toast.error("Update failed");
      } else {
        // 2. Aggiornamento Stato locale per feedback immediato
        setProfile({ ...profile, base_currency: currency });
        toast.success("Base currency updated");
        // 3. Refresh per aggiornare i Server Components (HQ/Finances)
        router.refresh();
      }
  }
  
  const handlePasswordReset = async () => {
    if (!user?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, { 
      redirectTo: `https://mindhub.website/auth/update-password` 
    })
    if (error) toast.error(error.message)
    else toast.success("Security Protocol Initiated. Check your email.")
  }

  const handleExportData = async () => {
    setExporting(true)
    try {
        const [p, pr, ts, rs, sb, sc, tm, ai, tl] = await Promise.all([
            supabase.from('profiles').select('*').eq('id', user.id).single(),
            supabase.from('projects').select('*').eq('user_id', user.id),
            supabase.from('tasks').select('*').eq('user_id', user.id),
            supabase.from('resources').select('*').eq('user_id', user.id),
            supabase.from('subscriptions').select('*').eq('user_id', user.id),
            supabase.from('social_accounts').select('*').eq('user_id', user.id),
            supabase.from('templates').select('*').eq('user_id', user.id),
            supabase.from('ai_reports').select('*').eq('user_id', user.id),
            supabase.from('time_logs').select('*').eq('user_id', user.id),
        ])
        const data = { user_id: user.id, profile: p.data, projects: pr.data, tasks: ts.data, resources: rs.data, subscriptions: sb.data, socials: sc.data, templates: tm.data, ai: ai.data, logs: tl.data }
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `mindhub-backup.json`
        a.click()
        toast.success("Backup complete")
    } catch (e) { toast.error("Export failed") }
    setExporting(false)
  }

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto h-12 w-12 text-indigo-600" /></div>

  return (
    <div className="max-w-6xl mx-auto space-y-10 py-10 px-4 sm:px-8">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
            <div className="p-4 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-100 text-white">
                <Settings className="h-8 w-8" />
            </div>
            <div>
                <h1 className="text-3xl font-black text-slate-900 italic uppercase tracking-tighter leading-none">
                    {dict.title}
                </h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">
                    {dict.subtitle}
                </p>
            </div>
        </div>

        <div className="flex items-center gap-3 bg-white border border-slate-100 p-2.5 pr-5 rounded-2xl shadow-sm h-fit">
            <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                <Database size={18} />
            </div>
            <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase leading-none mb-0.5">Cloud Link</p>
                <p className="text-xs font-black text-slate-900">Live Connection</p>
            </div>
        </div>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-12 items-start">
        
        <div className="lg:col-span-3 w-full lg:sticky lg:top-10 space-y-2">
            {[
                { id: "profile", icon: User, label: "Identity" },
                { id: "billing", icon: CreditCard, label: "Subscription" },
                { id: "notifications", icon: BellRing, label: "Recap Emails" },
                { id: "ai", icon: Sparkles, label: "AI Credits" },
                { id: "integrations", icon: Calendar, label: "Cal Sync" },
                { id: "interface", icon: Layout, label: "Interface" },
                { id: "security", icon: Lock, label: "Recovery" },
                { id: "data", icon: Database, label: "OS Backup" },
                { id: "danger", icon: ShieldAlert, label: "Destruction", color: "text-rose-600" }
            ].map((nav) => (
                <a 
                    key={nav.id} 
                    href={`#${nav.id}`} 
                    className={`group flex items-center justify-between px-6 py-4 text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all bg-white border border-slate-100 shadow-sm hover:border-indigo-200 hover:shadow-md ${nav.color || "text-slate-500 hover:text-indigo-600"}`}
                >
                    <span className="flex items-center gap-3">
                        <nav.icon className="h-4 w-4" /> {nav.label}
                    </span>
                    <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
            ))}
        </div>

        <div className="lg:col-span-9 space-y-10 w-full">
            
            <Card id="profile" className="rounded-[2.5rem] border-none shadow-xl overflow-hidden scroll-mt-10">
                <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-black italic uppercase tracking-tighter">Account Identity</CardTitle>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Profile Foundations</p>
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusBadge(profile?.plan_status)}`}>
                        {profile?.plan_status || 'FREE'}
                    </span>
                </CardHeader>
                <CardContent className="p-8">
                    <form onSubmit={handleUpdateProfile} className="space-y-8">
                        <div className="flex items-center gap-8">
                            <div className="relative group">
                                <div className="h-24 w-24 rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl relative">
                                    {avatarUrl ? (
                                        <img src={avatarUrl} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="h-full w-full bg-indigo-600 flex items-center justify-center text-white text-3xl font-black">
                                            {(firstName || user?.email)?.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <label htmlFor="avatar-up" className="absolute -bottom-2 -right-2 bg-slate-900 text-white rounded-xl p-2 shadow-xl cursor-pointer hover:bg-indigo-600 transition-colors">
                                    <Camera size={16} />
                                </label>
                                <input id="avatar-up" type="file" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-lg font-black text-slate-900 truncate">{user?.email}</p>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                                    <ShieldCheck size={12} className="text-emerald-500" /> Verified System Admin
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">First Name</label>
                                <input value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full rounded-2xl border border-slate-200 p-4 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Last Name</label>
                                <input value={lastName} onChange={e => setLastName(e.target.value)} className="w-full rounded-2xl border border-slate-200 p-4 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Operational Phone</label>
                            <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full rounded-2xl border border-slate-200 p-4 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" />
                        </div>
                      <div className="space-y-2">
    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Base Currency (HQ Display)</label>
    <select 
        value={profile?.base_currency || 'EUR'} 
        onChange={(e) => handleUpdateBaseCurrency(e.target.value)}
        className="w-full h-12 rounded-xl border border-slate-200 px-4 font-bold bg-white"
    >
        <option value="EUR">EUR (€) - Euro</option>
        <option value="USD">USD ($) - US Dollar</option>
        <option value="GBP">GBP (£) - British Pound</option>
    </select>
</div>
                        <Button type="submit" className="w-full h-16 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl transition-all" disabled={saving}>
                            {saving ? <Loader2 className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />} 
                            Update Profile Identity
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card id="billing" className="rounded-[2.5rem] border-none shadow-xl overflow-hidden scroll-mt-10">
                <CardHeader className="p-8 bg-slate-50/50 border-b border-slate-100 flex-row items-center gap-4">
                    <div className="p-3 bg-white rounded-2xl shadow-sm text-indigo-600">
                        <CreditCard size={20} />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-black italic uppercase tracking-tighter leading-none">Subscription Engine</CardTitle>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Financial Node</p>
                    </div>
                </CardHeader>
                <CardContent className="p-8">
                    {profile?.plan_status === 'beta' || profile?.plan_status === 'pro' ? (
                        <div className={`p-8 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 border-2 ${profile?.plan_status === 'beta' ? 'bg-indigo-50 border-indigo-100' : 'bg-emerald-50 border-emerald-100'}`}>
                            <div className="flex items-center gap-6">
                                <div className={`h-16 w-16 rounded-2xl flex items-center justify-center text-white shadow-xl ${profile?.plan_status === 'beta' ? 'bg-indigo-600' : 'bg-emerald-500'}`}>
                                    <Zap size={32} />
                                </div>
                                <div>
                                    <p className={`text-sm font-black uppercase tracking-widest ${profile?.plan_status === 'beta' ? 'text-indigo-900' : 'text-emerald-900'}`}>
                                        {profile?.plan_status === 'beta' ? 'Beta Lifetime Access' : 'MindHub Pro Active'}
                                    </p>
                                    <p className="text-xs font-medium opacity-70 mt-1">Full access to all strategic modules enabled.</p>
                                </div>
                            </div>
                            <Link href="https://gumroad.com/subscriptions" target="_blank">
                                <Button className="bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-widest h-12 px-8">Manage Billing</Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
                            <Sparkles className="absolute -right-10 -top-10 h-40 w-40 text-indigo-500/20 rotate-12" />
                            <div className="relative z-10 space-y-8">
                                <div>
                                    <h4 className="text-3xl font-black italic uppercase tracking-tighter">MindHub Pro OS</h4>
                                    <p className="text-slate-400 font-medium mt-2">Unlimited power for your startup ecosystem.</p>
                                </div>
                                <div className="flex flex-col md:flex-row md:items-center gap-6 pt-4">
                                    <div className="flex-1">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-5xl font-black">29€</span>
                                            <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">/ month</span>
                                        </div>
                                    </div>
                                    <Link href={getGumroadLink(GUMROAD_URLS.pro)} className="w-full md:w-auto">
                                        <Button className="w-full md:px-12 h-16 bg-indigo-600 hover:bg-white hover:text-indigo-600 text-white font-black rounded-2xl shadow-xl transition-all uppercase tracking-[0.2em] text-[10px]">
                                            Initialize Upgrade
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card id="notifications" className="rounded-[2.5rem] border-none shadow-xl overflow-hidden scroll-mt-10">
                <CardHeader className="p-8 border-b border-slate-50">
                    <CardTitle className="text-xl font-black italic uppercase tracking-tighter">Operational Briefings</CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-4">
                    {[
                        { key: "email_monday_brief", icon: CalendarDays, label: "Monday Launch Memo", desc: "Weekly trajectory briefing (Mon 08:00 AM)" },
                        { key: "email_friday_wrap", icon: Coffee, label: "Friday Shutdown Memo", desc: "Performance review & cleanup (Fri 05:00 PM)" }
                    ].map((item) => {
                        const isActive = preferences?.[item.key] === true
                        return (
                            <div key={item.key} className={`flex items-center justify-between p-6 rounded-3xl border transition-all ${isActive ? "bg-indigo-50/30 border-indigo-100 shadow-sm" : "bg-white border-slate-100"}`}>
                                <div className="flex items-center gap-5">
                                    <div className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-all ${isActive ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "bg-slate-50 text-slate-400"}`}>
                                        <item.icon size={24} />
                                    </div>
                                    <div>
                                        <p className="font-black text-sm text-slate-900 uppercase tracking-tight italic">{item.label}</p>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5 opacity-60">{item.desc}</p>
                                    </div>
                                </div>
                                <div className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={isActive} onChange={(e) => handleTogglePreference(item.key, e.target.checked)} className="h-7 w-7 rounded-xl border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer shadow-sm transition-all" />
                                </div>
                            </div>
                        )
                    })}
                </CardContent>
            </Card>

            <Card id="ai" className="rounded-[2.5rem] border-none shadow-xl overflow-hidden scroll-mt-10">
                <CardHeader className="p-8 bg-rose-50/50 border-b border-rose-100 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-black italic uppercase tracking-tighter text-rose-900">Cognitive Assets</CardTitle>
                        <p className="text-[10px] text-rose-500 font-black uppercase tracking-widest mt-1">AI Injection Credits</p>
                    </div>
                    <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-rose-500 shadow-sm">
                        <Sparkles size={20} />
                    </div>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                    <div className="flex items-center justify-between bg-slate-900 rounded-[2rem] p-8 text-white">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Reserve</p>
                            <p className="text-5xl font-black italic tracking-tighter">{credits}</p>
                        </div>
                        <Coins size={48} className="text-rose-500/30 rotate-12" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            { a: 50, p: "10€", url: GUMROAD_URLS.credits50 }, 
                            { a: 250, p: "50€", url: GUMROAD_URLS.credits250 }, 
                            { a: 500, p: "90€", url: GUMROAD_URLS.credits500 }
                        ].map(pack => (
                            <Link key={pack.a} href={getGumroadLink(pack.url)} className="group flex flex-col items-center p-6 bg-white border border-slate-100 rounded-[2rem] hover:border-rose-200 transition-all shadow-sm hover:shadow-xl">
                                <span className="font-black text-3xl text-slate-900 italic tracking-tighter">{pack.a}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Credits</span>
                                <div className="mt-4 px-4 py-1.5 bg-rose-50 text-rose-600 rounded-full font-black text-xs group-hover:bg-rose-600 group-hover:text-white transition-colors">
                                    {pack.p}
                                </div>
                            </Link>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card id="integrations" className="rounded-[2.5rem] border-none shadow-xl overflow-hidden scroll-mt-10">
                <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
                    <CardTitle className="text-xl font-black italic uppercase tracking-tighter">External Sync</CardTitle>
                    <div className="p-3 bg-slate-50 rounded-2xl text-indigo-600 shadow-inner">
                        <Calendar size={20} />
                    </div>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                    <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100 grid md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-slate-900 font-black uppercase tracking-tight text-xs italic">
                                <HelpCircle size={16} className="text-indigo-600" /> Google Calendar
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed font-medium">Settings &gt; Integrations &gt; Copy <b className="text-slate-900">"Secret address in iCal format"</b>.</p>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-slate-900 font-black uppercase tracking-tight text-xs italic">
                                <Zap size={16} className="text-indigo-600" /> Apple iCloud
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed font-medium">Calendar App &gt; Share Calendar &gt; Enable <b className="text-slate-900">"Public Calendar"</b> & Copy Link.</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {calendars.map((cal, idx) => (
                            <div key={idx} className="flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-100 shadow-sm animate-in fade-in">
                                <div className="min-w-0">
                                    <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{cal.name}</p>
                                    <p className="text-[10px] text-slate-400 font-mono truncate max-w-xs">{cal.url}</p>
                                </div>
                                <button onClick={() => removeCalendar(idx)} className="text-slate-300 hover:text-rose-500 transition-colors p-2 bg-slate-50 rounded-xl">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                    
                    <form onSubmit={handleAddCalendar} className="space-y-4 pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Label</label>
                                <input name="calName" placeholder="Personal" required className="w-full rounded-2xl border border-slate-200 p-4 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">iCal URL</label>
                                <input name="calUrl" placeholder="https://..." required className="w-full rounded-2xl border border-slate-200 p-4 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" />
                            </div>
                        </div>
                        <Button type="submit" className="w-full h-14 bg-indigo-600 hover:bg-slate-900 text-white font-black rounded-2xl shadow-xl uppercase tracking-widest text-[10px]">
                            <Plus size={18} className="mr-2" /> Add Calendar Sync
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card id="interface" className="rounded-[2.5rem] border-none shadow-xl overflow-hidden scroll-mt-10">
                <CardHeader className="p-8 border-b border-slate-50">
                    <CardTitle className="text-xl font-black italic uppercase tracking-tighter">Interface Configuration</CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {['Templates', 'Archive'].map((item) => (
                            <div key={item} className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                                <span className="font-black text-[10px] uppercase tracking-widest text-slate-500">{item} Segment</span>
                                <input type="checkbox" checked={preferences?.[`show${item}`] !== false} onChange={(e) => handleTogglePreference(`show${item}`, e.target.checked)} className="h-6 w-6 rounded-xl border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer shadow-sm"/>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card id="security" className="rounded-[2.5rem] border-none shadow-xl overflow-hidden scroll-mt-10">
                <CardHeader className="p-8 border-b border-slate-50">
                    <CardTitle className="text-xl font-black italic uppercase tracking-tighter">Access Protocols</CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="flex flex-col md:flex-row items-center justify-between p-8 rounded-[2rem] bg-amber-50 border border-amber-100 gap-8">
                        <div className="space-y-2 text-center md:text-left">
                            <p className="font-black text-sm text-amber-900 uppercase tracking-tight italic">Credential Recovery</p>
                            <p className="text-xs text-amber-700/70 font-medium leading-relaxed max-w-sm">Request a secure password reset link. The current session will remain active until update.</p>
                        </div>
                        <Button className="h-14 px-10 bg-white hover:bg-amber-900 hover:text-white text-amber-900 border border-amber-200 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all" onClick={handlePasswordReset}>
                            Request Reset Link
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card id="data" className="rounded-[2.5rem] border-none shadow-xl overflow-hidden scroll-mt-10">
                <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
                    <CardTitle className="text-xl font-black italic uppercase tracking-tighter">Operational Backup</CardTitle>
                    <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                        <Database size={18} />
                    </div>
                </CardHeader>
                <CardContent className="p-8 space-y-4">
                    <Button onClick={handleExportData} disabled={exporting} className="w-full h-16 bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-sm flex items-center justify-center gap-3">
                        {exporting ? <Loader2 className="animate-spin" /> : <Download size={20} />} 
                        Download Strategic JSON Backup
                    </Button>
                    <div className="pt-6 border-t border-slate-100">
                        <Button 
                            onClick={async () => { if(confirm("Inject demo data?")) { setSaving(true); await seedDemoData(); window.location.reload(); } }}
                            className="w-full h-16 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 border border-indigo-100 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-sm flex items-center justify-center gap-3"
                        >
                            <PlayCircle size={20} /> Inject Startup Demo Payload
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card id="danger" className="rounded-[2.5rem] border-2 border-rose-100 bg-rose-50/20 overflow-hidden shadow-xl scroll-mt-10">
                <CardContent className="p-12 text-center space-y-8">
                    <div className="h-20 w-20 bg-rose-600 rounded-[2rem] flex items-center justify-center text-white mx-auto shadow-2xl shadow-rose-200 animate-pulse">
                        <ShieldAlert size={40} />
                    </div>
                    <div className="space-y-2">
                        <h4 className="text-3xl font-black italic uppercase tracking-tighter text-rose-900">Final Self Destruction</h4>
                        <p className="text-sm text-rose-700/70 font-bold uppercase tracking-widest max-w-md mx-auto">Warning: This action permanently wipes your entire startup ecosystem and cannot be reversed.</p>
                    </div>
                    <Button 
                        onClick={async () => { const r = prompt("Type DELETE to confirm account destruction"); if(r === 'DELETE') { await deleteUserAccount('Manual destruction'); window.location.href='/'; } }} 
                        className="w-full h-20 bg-rose-600 hover:bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-xs shadow-2xl transition-all border-b-8 border-rose-900 active:border-b-0 active:translate-y-2"
                    >
                        Execute Full Data Wipe
                    </Button>
                </CardContent>
            </Card>

            <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] py-10 opacity-50">
                <Info size={14} /> MindHub OS Version 1.9.8 • Strategic Identity Layer
            </div>
        </div>
      </div>
    </div>
  )
}



