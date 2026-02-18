'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { 
    ArrowLeft, Loader2, Save, CreditCard, Zap, 
    Globe, Database, Mail, Play, Sparkles, Cloud, Layout, Calendar
} from 'lucide-react'
import { toast } from 'sonner'
import { addSubscription } from '@/app/actions'
import ProtocolDirective from '@/components/dashboard/ProtocolDirective'

const EXPENSE_PRESETS = [
    { id: 'openai', title: 'OpenAI (ChatGPT)', cost: 20, category: 'business', currency: 'USD', icon: <Sparkles className="text-emerald-500" /> },
    { id: 'vercel', title: 'Vercel Pro', cost: 20, category: 'business', currency: 'USD', icon: <Cloud className="text-slate-900" /> },
    { id: 'supabase', title: 'Supabase Pro', cost: 25, category: 'business', currency: 'USD', icon: <Database className="text-emerald-600" /> },
    { id: 'google', title: 'Google Workspace', cost: 12, category: 'business', currency: 'EUR', icon: <Mail className="text-blue-500" /> },
    { id: 'resend', title: 'Resend Pro', cost: 20, category: 'business', currency: 'USD', icon: <Zap className="text-indigo-500" /> },
    { id: 'notion', title: 'Notion Plus', cost: 10, category: 'business', currency: 'USD', icon: <Layout className="text-slate-700" /> },
    { id: 'spotify', title: 'Spotify Premium', cost: 10.99, category: 'life', currency: 'EUR', icon: <Play className="text-emerald-500" /> },
    { id: 'netflix', title: 'Netflix', cost: 12.99, category: 'life', currency: 'EUR', icon: <Play className="text-rose-600" /> },
]

export default function NewSubscriptionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState<{id: string, title: string}[]>([])
  
  const [formData, setFormData] = useState({
    title: '',
    cost: '',
    category: 'business',
    currency: 'EUR',
    renewal_date: new Date().toISOString().split('T')[0],
    project_id: searchParams.get('project_id') || 'none',
    description: ''
  })

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

  const applyPreset = (preset: typeof EXPENSE_PRESETS[0]) => {
    setFormData({
        ...formData,
        title: preset.title,
        cost: preset.cost.toString(),
        category: preset.category,
        currency: preset.currency
    })
    toast.success(`${preset.title} preset applied`)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const form = new FormData(e.currentTarget)
    
    // Fix UUID: Se none, rimuoviamo per passare null
    if (form.get('project_id') === 'none') form.delete('project_id')
    
    // Fix Cost: sostituzione virgola con punto
    const costValue = form.get('cost') as string
    if (costValue) form.set('cost', costValue.replace(',', '.'))
    
    const result = await addSubscription(form)

    if (result.success) {
      toast.success('Subscription secured in Vault')
      router.push('/dashboard/finances')
      router.refresh()
    } else {
      toast.error(result.error || "Transmission error")
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-10 px-4 animate-in fade-in">
      
      <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/dashboard/finances" className="text-slate-400 hover:text-indigo-600 transition-colors font-bold">Finances</Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 font-bold font-mono uppercase">ADD_EXPENSE</span>
          </div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">Add Recurring Expense</h1>
      </div>

      <div className="space-y-4">
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Quick SaaS Presets</label>
        <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
            {EXPENSE_PRESETS.map(preset => (
                <div 
                    key={preset.id} 
                    onClick={() => applyPreset(preset)}
                    className="flex-shrink-0 flex items-center gap-3 px-4 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-indigo-500 cursor-pointer transition-all active:scale-95 group"
                >
                    <div className="h-8 w-8 bg-slate-50 rounded-lg flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                        {preset.icon}
                    </div>
                    <div className="pr-2">
                        <p className="text-xs font-bold text-slate-900 whitespace-nowrap">{preset.title}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase">~{preset.currency} {preset.cost}</p>
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* --- WRAPPER RESPONSIVE PER SIDE-BY-SIDE --- */}
      <div className="flex flex-col lg:flex-row gap-10 items-start">
        
        <div className="flex-1 w-full">
            <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white">
                <CardContent className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Expense Identity</label>
                                <Input name="title" required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="e.g. AWS Production" className="h-12 rounded-xl border-slate-200 font-bold" />
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="col-span-2 space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Cost</label>
                                    <Input name="cost" type="text" required value={formData.cost} onChange={(e) => setFormData({...formData, cost: e.target.value})} placeholder="0.00" className="h-12 rounded-xl border-slate-200 font-bold font-mono" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Currency</label>
                                    <select name="currency" value={formData.currency} onChange={(e) => setFormData({...formData, currency: e.target.value})} className="w-full rounded-xl border border-slate-200 p-3 h-12 text-xs bg-white font-bold outline-none">
                                        <option value="EUR">EUR</option>
                                        <option value="USD">USD</option>
                                        <option value="GBP">GBP</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Next Renewal Date</label>
                                <div className="relative">
                                    <Input name="renewal_date" type="date" required value={formData.renewal_date} onChange={(e) => setFormData({...formData, renewal_date: e.target.value})} className="h-12 rounded-xl border-slate-200 font-bold pl-10" />
                                    <Calendar className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Domain</label>
                                <select name="category" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full rounded-xl border border-slate-200 p-3 h-12 text-sm bg-white font-bold outline-none">
                                    <option value="business">💼 Business Core</option>
                                    <option value="marketing">📣 Marketing / Growth</option>
                                    <option value="saas">🛠️ Infrastructure / Tools</option>
                                    <option value="life">🏠 Private Life</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Node Association</label>
                            <select name="project_id" value={formData.project_id} onChange={(e) => setFormData({...formData, project_id: e.target.value})} className="w-full rounded-xl border border-slate-200 p-3 h-12 text-sm bg-white font-bold outline-none">
                                <option value="none">Global Overhead (Unlinked)</option>
                                {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Additional Context (Optional)</label>
                            <textarea name="description" rows={2} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Why is this expense mandatory? (AI will use this)" className="w-full rounded-xl border border-slate-200 p-4 text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 resize-none font-medium text-slate-600" />
                        </div>

                        <Button type="submit" className="w-full h-16 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl transition-all active:scale-95" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />} Secure Subscription
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>

        {/* --- SIDEBAR OPERATIVA (SIDE-BY-SIDE ON DESKTOP) --- */}
        <ProtocolDirective 
          title="Operational Protocol"
          steps={[
            { label: "Vault Selection", desc: "Business expenses are deducted from your Biz Vault, while Personal ones hit your Life Vault. This ensures your startup runway remains isolated." },
            { label: "Overhead Engine", desc: "Unlinked expenses (Global) are divided equally among all active projects to calculate their 'True Margin'." },
            { label: "Cycle Logic", desc: "Confirming a payment moves the renewal date forward by 1 month and creates a permanent entry in your Transaction Audit Trail." }
          ]}
          outcome="Correct expense tracking is the only way for the AI to detect 'Zombie Projects' and suggest real burn-rate optimizations."
        />

      </div>
    </div>
  )
}
