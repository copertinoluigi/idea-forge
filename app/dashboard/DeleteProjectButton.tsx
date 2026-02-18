'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2, Loader2 } from 'lucide-react'
import { deleteProjectAction } from '@/app/actions'
import { toast } from 'sonner'

// Accetta confirmMessage come prop
export default function DeleteProjectButton({ projectId, confirmMessage }: { projectId: string, confirmMessage: string }) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    // Usa il messaggio tradotto
    const confirmed = window.confirm(confirmMessage)
    
    if (!confirmed) return

    setLoading(true)
    try {
        await deleteProjectAction(projectId)
    } catch (error) {
        toast.error("Error deleting project")
        setLoading(false)
    }
  }

  return (
    <Button 
        variant="outline" 
        onClick={handleDelete} 
        disabled={loading}
        className="text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200"
    >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
    </Button>
  )
}
