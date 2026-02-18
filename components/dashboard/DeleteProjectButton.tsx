'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2, Loader2 } from 'lucide-react'
import { deleteProjectAction } from '@/app/actions'
import { toast } from 'sonner'

export default function DeleteProjectButton({ projectId, confirmMessage }: { projectId: string, confirmMessage: string }) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!window.confirm(confirmMessage)) return

    setLoading(true)
    try {
        await deleteProjectAction(projectId)
        toast.success("Node purged from ecosystem")
    } catch (error) {
        toast.error("Deletion protocol failed")
        setLoading(false)
    }
  }

  return (
    <Button 
        variant="outline" 
        onClick={handleDelete} 
        disabled={loading}
        className="w-full h-12 rounded-xl border-slate-200 text-rose-500 hover:text-rose-700 hover:bg-rose-50 font-bold text-xs uppercase tracking-widest gap-2"
    >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 size={14} />} 
        Purge
    </Button>
  )
}
