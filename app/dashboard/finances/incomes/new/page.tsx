'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Loader2, TrendingUp, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { addIncomeAction } from '@/app/actions'
import ProtocolDirective from '@/components/dashboard/ProtocolDirective'

export default function NewIncomePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState<any[]>([])
  const [isRecurring, setIsRecurring] = useState(false)

  useEffect(() => {
    async function loadProjects() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const { data } = await supabase.from('projects').select('id, title').eq('user_id', user?.id).neq('status', 'archived')
      if (data) setProjects(data)
    }
    loadProjects()
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    formData.append('is_recurring', isRecurring ? 'on' : 'off')

    const result = await addIncomeAction(formData)

    if (result.success) {
      toast.success("Income forecast registered")
      router.push('/dashboard/finances?view=revenue')
      router.refresh()
    } else {
      toast.error(result.error || "Error")
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-10 px-4 animate-in fade-in">
      
      {/* HEADER ALLINEATO */}
      <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/dashboard/finances?view=revenue" className="text-slate-400 hover:text-emerald-600 font-bold transition-colors">Revenue</Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 font-bold font-mono uppercase">New_Income_Node</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Record Revenue</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-10 items-start">
        
        <div className="flex-1 w-full">
            <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white">
                <CardContent className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Source Identification</label>
                            <Input name="title" required placeholder="e.g. Client Invoice, Stripe Payout..." className="h-12 rounded-xl border-slate-200 font-bold" />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 shadow-inner text-emerald-900">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${isRecurring ? 'bg-emerald-200 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                                    <RefreshCw size={18} className={isRecurring ? 'animate-spin-slow' : ''} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold uppercase tracking-tight">Recurring Revenue</p>
                                    <p className="text-[9px] opacity-60 font-bold uppercase">System will generate this forecast every month</p>
                                </div>
                            </div>
                            <input type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} className="h-6 w-6 rounded-md border-emerald-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer shadow-sm" />
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Destination Vault</label>
                            <select name="category" required className="w-full rounded-xl border border-slate-200 p-3 h-12 text-sm bg-white outline-none font-bold text-slate-700">
                                <option value="business_global">Business Vault (Reinvestment)</option>
                                <option value="project">Project Specific (Budget Boost)</option>
                                <option value="personal">Personal Pocket (Owner Salary)</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="space-y-2 col-span-2 md:col-span-1">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Gross Amount</label>
                                <Input name="amount_gross" type="number" step="0.01" required placeholder="0.00" className="h-12 rounded-xl border-slate-200 font-mono font-bold text-lg" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Tax Provision (%)</label>
                                <Input name="tax_percentage" type="number" placeholder="20" className="h-12 rounded-xl border-slate-200 font-mono font-bold text-lg" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Currency</label>
                                <select name="currency" className="w-full rounded-xl border border-slate-200 p-3 h-12 text-sm bg-white font-bold">
                                    <option value="EUR">EUR (€)</option>
                                    <option value="USD">USD ($)</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Expected Payment Date</label>
                            <Input name="due_date" type="date" required className="h-12 rounded-xl border-slate-200 font-bold" />
                        </div>

                        <Button type="submit" className="w-full h-16 bg-slate-900 hover:bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl transition-all active:scale-95 group" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <TrendingUp className="mr-2 h-5 w-5 group-hover:translate-y-[-2px] transition-transform" />} Record Income Node
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>

        <ProtocolDirective 
          title="Revenue Protocol"
          steps={[
            { label: "Tax Segregation", desc: "MindHub calculates your Net Profit by isolating the tax percentage into the 'Tax Reserve' vault automatically upon confirmation." },
            { label: "Vault Logic", desc: "Business incomes replenish your operating runway. Personal incomes track your individual founder salary and net wealth." },
            { label: "Expected Status", desc: "Incomes are initially 'Expected'. Confirming them will trigger the actual movement of funds between your node vaults." }
          ]}
          outcome="Confirming a receipt will instantly update your liquid cash-on-hand, providing the AI with the fuel needed for future initiatives."
        />
      </div>
    </div>
  )
}
