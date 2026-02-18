'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Archive, Loader2 } from 'lucide-react'
import { archiveProjectAction } from '@/app/actions'
import { toast } from 'sonner'

export default function ArchiveProjectButton({ projectId }: { projectId: string }) {
  const [isPending, startTransition] = useTransition()

  const handleArchive = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!confirm("Archive this node? It will move to the archived section and stop contributing to active burn metrics.")) return

    startTransition(async () => {
      try {
        await archiveProjectAction(projectId)
        toast.success("Project archived")
      } catch (error) {
        toast.error("Failed to archive project")
      }
    })
  }

  return (
    <Button
      onClick={handleArchive}
      disabled={isPending}
      variant="outline"
      className="w-full h-12 rounded-xl border-slate-200 text-slate-400 hover:text-amber-600 hover:bg-amber-50 font-bold text-xs uppercase tracking-widest gap-2 shadow-sm transition-all"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Archive className="h-4 w-4" />
      )}
      Archive
    </Button>
  )
}
