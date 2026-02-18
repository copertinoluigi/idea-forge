'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Save, TrendingUp, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { updateIncomeAction } from '@/app/actions'

export default function EditIncomePage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [projects, setProjects] = useState<any[]>([])
  const [income, setIncome] = useState<any>(null)

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      const [projData, incData] = await Promise.all([
        supabase.from('projects').select('id, title').eq('user_id', user?.id).eq('status', 'active'),
        supabase.from('incomes').select('*').eq('id', id).single()
      ])
      if (projData.data) setProjects(projData.data)
      if (incData.data) setIncome(incData.data)
      setLoading(false)
    }
    loadData()
  }, [id, supabase])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    const result = await updateIncomeAction(id, new FormData(e.currentTarget))
    if (result.success) {
      toast.success("Income updated successfully")
      router.push('/dashboard/finances?view=revenue')
      router.refresh()
    } else {
      toast.error("Error updating income")
      setSaving(false)
    }
  }

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto h-8 w-8 text-indigo-600" /></div>

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-10 px-4 animate-in fade-in">
      <div className="flex items-center gap-2 text-sm mb-2">
          <Link href="/dashboard/finances?view=revenue" className="text-slate-400 hover:text-emerald-600 font-bold">Revenue</Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-900 font-bold">Edit Income</span>
      </div>

      <h1 className="text-3xl font-black text-slate-900">Edit Revenue Stream</h1>

      <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white">
        <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Source Name</label>
                    <input 
                      name="title" 
                      defaultValue={income?.title} 
                      required 
                      className="w-full rounded-xl border border-slate-200 p-3 text-base focus:ring-2 focus:ring-emerald-500/20 outline-none" 
                    />
                </div>
                
                {/* CHECKBOX RICORRENZA CORRETTO */}
                <div className="flex items-center justify-between p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                    <div className="space-y-0.5">
                        <p className="text-sm font-bold text-emerald-900">Recurring Income</p>
                        <p className="text-[10px] text-emerald-600 uppercase font-medium">Auto-renew every 30 days</p>
                    </div>
                    <input 
                      name="is_recurring" 
                      type="checkbox" 
                      defaultChecked={income?.is_recurring} 
                      className="h-6 w-6 rounded-md border-emerald-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer" 
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Project Association</label>
                    <select name="project_id" defaultValue={income?.project_id || 'none'} className="w-full rounded-xl border border-slate-200 p-3 text-base bg-white">
                        <option value="none">General / No Project</option>
                        {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                    </select>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-2 col-span-2 md:col-span-1">
                        <label className="text-sm font-bold text-slate-700">Gross Amount</label>
                        <input name="amount_gross" type="number" step="0.01" defaultValue={income?.amount_gross} required className="w-full rounded-xl border border-slate-200 p-3 text-base" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Tax %</label>
                        <input name="tax_percentage" type="number" defaultValue={income?.tax_percentage} className="w-full rounded-xl border border-slate-200 p-3 text-base" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Currency</label>
                        <select name="currency" defaultValue={income?.currency} className="w-full rounded-xl border border-slate-200 p-3 text-base bg-white">
                            <option value="EUR">€ EUR</option>
                            <option value="USD">$ USD</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Category</label>
                        <select name="category" defaultValue={income?.category} className="w-full rounded-xl border border-slate-200 p-3 text-base bg-white">
                            <option value="business_global">Business</option>
                            <option value="project">Project</option>
                            <option value="personal">Personal</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Expected Date</label>
                        <input name="due_date" type="date" defaultValue={income?.due_date} className="w-full rounded-xl border border-slate-200 p-3 text-base" />
                    </div>
                </div>

                <Button type="submit" className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg" disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save Changes
                </Button>
            </form>
        </CardContent>
      </Card>
      
      <div className="text-center">
        <Link href="/dashboard/finances?view=revenue" className="text-slate-400 text-xs hover:text-slate-600 transition-colors">
            Cancel and go back
        </Link>
      </div>
    </div>
  )
}
