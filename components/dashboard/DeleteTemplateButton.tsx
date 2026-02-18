'use client'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { deleteTemplate } from '@/app/actions'

export default function DeleteTemplateButton({ id }: { id: string }) {
  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault() // Impedisce al Link sottostante di attivarsi
    e.stopPropagation() // Ferma la propagazione del click
    
    if (confirm("Delete this strategic asset?")) {
      try {
        await deleteTemplate(id)
        toast.success("Asset purged from playbooks")
      } catch (error) {
        toast.error("Failed to delete asset")
      }
    }
  }

  return (
    <button 
      onClick={handleDelete}
      className="p-2 text-slate-300 hover:text-rose-500 bg-white rounded-xl shadow-sm border border-slate-100 transition-all z-10"
    >
      <Trash2 size={14} />
    </button>
  )
}
