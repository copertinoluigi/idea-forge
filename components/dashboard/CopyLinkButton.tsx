'use client'

import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Link2 } from 'lucide-react'

export default function CopyLinkButton({ url }: { url: string }) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success("Public link copied to clipboard")
    } catch (err) {
      toast.error("Failed to copy link")
    }
  }

  return (
    <Button 
      variant="secondary" 
      className="w-full bg-white font-bold text-[10px] uppercase h-10 rounded-xl shadow-sm border border-slate-200"
      onClick={handleCopy}
    >
      <Link2 className="mr-2 h-3.5 w-3.5" />
      Copy Public Link
    </Button>
  )
}
