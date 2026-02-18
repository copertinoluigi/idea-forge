'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Save, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { updateSubscriptionAction } from '@/app/actions'

export default function EditExpensePage() {
  const router = useRouter()
  const { id } = useParams()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [projects, setProjects] = useState<any[]>([])
  const [expense, setExpense] = useState<any>(null)

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      const [projData, expData] = await Promise.all([
        supabase.from('projects').select('id, title').eq('user_id', user?.id).eq('status', 'active'),
        supabase.from('subscriptions').select('*').eq('id', id).single()
      ])
      if (projData.data) setProjects(projData.data)
      if (expData.data) setExpense(expData.data)
      setLoading(false)
    }
    loadData()
  }, [id])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    const result = await updateSubscriptionAction(id as string, new FormData(e.currentTarget))
    if (result.success) {
      toast.success("Expense updated")
      router.push('/dashboard/finances')
      router.refresh()
    } else {
      toast.error("Error updating")
      setSaving(false)
    }
  }

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto" /></div>

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-10 px-4 animate-in fade-in">
      <div className="flex items-center gap-2 text-sm mb-2">
          <Link href="/dashboard/finances" className="text-slate-400 hover:text-indigo-600 font-bold">Finances</Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-900 font-bold">Edit Expense</span>
      </div>

      <h1 className="text-3xl font-black text-slate-900">Edit Subscription</h1>

      <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white">
        <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Service Name</label>
                    <input name="title" defaultValue={expense?.title} required className="w-full rounded-xl border border-slate-200 p-3 text-base focus:ring-2 focus:ring-indigo-500/20 outline-none" />
                </div>
                
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Project Association</label>
                    <select name="project_id" defaultValue={expense?.project_id || 'none'} className="w-full rounded-xl border border-slate-200 p-3 text-base bg-white">
                        <option value="none">General / No Project</option>
                        {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Cost</label>
                        <input name="cost" type="number" step="0.01" defaultValue={expense?.cost} required className="w-full rounded-xl border border-slate-200 p-3 text-base" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Currency</label>
                        <select name="currency" defaultValue={expense?.currency} className="w-full rounded-xl border border-slate-200 p-3 text-base bg-white">
                            <option value="EUR">€ EUR</option>
                            <option value="USD">$ USD</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Category</label>
                        <select name="category" defaultValue={expense?.category} className="w-full rounded-xl border border-slate-200 p-3 text-base bg-white">
                            <option value="software">Software / SaaS</option>
                            <option value="work">Business</option>
                            <option value="life">Personal</option>
                        </select>
                    </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
    <div className="space-y-0.5">
        <p className="text-sm font-bold text-slate-900">Recurring Payment</p>
        <p className="text-[10px] text-slate-500 uppercase font-medium">Auto-renew every month</p>
    </div>
    <input 
        name="is_recurring" // o is_recurring se hai cambiato nome
        type="checkbox" 
        defaultChecked={expense?.active} 
        className="h-6 w-6 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500" 
    />
</div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Next Renewal</label>
                        <input name="renewal_date" type="date" defaultValue={expense?.renewal_date} className="w-full rounded-xl border border-slate-200 p-3 text-base" />
                    </div>
                </div>

                <Button type="submit" className="w-full h-12 bg-slate-900 hover:bg-black text-white rounded-xl font-bold shadow-lg" disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save Changes
                </Button>
            </form>
        </CardContent>
      </Card>
    </div>
  )
}
