'use client'
import { useState } from 'react'
import { updateSocialMetrics } from '@/app/actions'
import { toast } from 'sonner'
import { Check, Pencil, Loader2 } from 'lucide-react'

export default function InlineEditMetric({ id, initialValue }: { id: string, initialValue: string }) {
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState(initialValue)
  const [loading, setLoading] = useState(false)

  const handleUpdate = async () => {
    setLoading(true)
    const res = await updateSocialMetrics(id, value)
    if (res.success) {
      toast.success("Metric updated")
      setIsEditing(false)
    } else {
      toast.error("Failed to update")
    }
    setLoading(false)
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <input 
          autoFocus
          className="bg-white border border-indigo-200 rounded-lg px-2 py-1 text-2xl font-black text-slate-900 w-full outline-none focus:ring-2 focus:ring-indigo-500/20"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button 
          onClick={handleUpdate}
          disabled={loading}
          className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        </button>
      </div>
    )
  }

  return (
    <div 
      onClick={() => setIsEditing(true)}
      className="flex items-center justify-between cursor-pointer group"
    >
      <p className="text-3xl font-black text-slate-900">{value}</p>
      <Pencil className="h-4 w-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  )
}
