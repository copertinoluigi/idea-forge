'use client'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Globe, Circle, Plus, Loader2, Target, Info } from 'lucide-react'
import { addTask, toggleTaskAction } from '@/app/actions'
import { toast } from 'sonner'

export default function GlobalTasksCard({ initialTasks, userId }: { initialTasks: any[], userId: string }) {
  const [loading, setLoading] = useState(false)
  const [newTitle, setNewTitle] = useState('')

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    setLoading(true)
    const formData = new FormData()
    formData.append('title', newTitle)
    formData.append('projectId', 'null')
    formData.append('priority', 'high')
    formData.append('userId', userId)
    
    const res = await addTask(formData)
    if (res?.success) {
      toast.success("Directive added")
      setNewTitle('')
      window.location.reload() 
    }
    setLoading(false)
  }

  return (
    <Card id="global-backlog" className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden font-sans scroll-mt-24 text-slate-900">
      
      {/* HEADER UNIFICATO */}
      <div className="flex flex-row items-start justify-between gap-4 mb-8">
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-slate-900 italic uppercase tracking-tighter leading-none">
            Strategic Directives
          </h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
            GLOBAL FOUNDER TASKS
          </p>
        </div>

        {/* Icon Box Piccolo e Fisso */}
        <div className="shrink-0 p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-100">
            <Target size={18} />
        </div>
      </div>

      <div className="space-y-6 relative z-10">
        <div className="space-y-2">
          {initialTasks.length === 0 && (
            <p className="text-center py-6 text-xs text-slate-400 italic">No global directives active.</p>
          )}
          {initialTasks.map((task) => (
            <div key={task.id} className="flex items-center justify-between p-3.5 bg-slate-50/50 rounded-2xl border border-slate-100 transition-all hover:bg-white hover:border-indigo-200">
              <div className="flex items-center gap-4">
                <button onClick={async () => { await toggleTaskAction(task.id, '', false); window.location.reload(); }}>
                  <Circle className="h-4 w-4 text-slate-200 hover:text-indigo-500 transition-colors" />
                </button>
                <span className="text-sm font-medium text-slate-700">{task.title}</span>
              </div>
              <Globe size={12} className="text-slate-200" />
            </div>
          ))}
        </div>

        <form onSubmit={handleAdd} className="flex gap-2 pt-4 border-t border-slate-50">
          <input 
            value={newTitle} 
            onChange={(e) => setNewTitle(e.target.value)} 
            placeholder="New strategic directive..." 
            className="flex-1 bg-white border border-slate-200 rounded-xl px-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none h-11" 
          />
          <Button disabled={loading} size="icon" className="h-11 w-11 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white shadow-md">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus size={18} />}
          </Button>
        </form>

        <div className="mt-4 flex items-start gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest border-t border-slate-50 pt-4">
            <Info className="h-3.5 w-3.5 shrink-0 text-indigo-400" />
            <p className="leading-tight opacity-70 italic">
              These tasks represent high-level business strategy and founder mindset directives.
            </p>
        </div>
      </div>
    </Card>
  )
}
