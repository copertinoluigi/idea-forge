'use client'
import { useState } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function DeleteButton({ id, onDelete, className }: { id: string, onDelete: (id: string) => Promise<void>, className?: string }) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this item? This action cannot be undone.")) return
    
    setLoading(true)
    await onDelete(id)
    setLoading(false)
  }

  return (
    <Button 
        variant="ghost" 
        size="sm" 
        onClick={handleDelete} 
        disabled={loading}
        className={`text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 h-auto ${className}`}
        title="Delete Item"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
    </Button>
  )
}
