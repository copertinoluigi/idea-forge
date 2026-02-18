'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileText, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { generateBusinessPlan } from '@/app/actions-ai'

export default function GeneratePlanButton({ projectId, dict, lang }: { projectId: string, dict: any, lang: string }) {
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    if (!confirm(`This will generate a detailed Strategic Plan based on your current node data.\nCost: 5 Credits.\n\nContinue?`)) return

    setLoading(true)
    try {
        const htmlContent = await generateBusinessPlan(projectId, lang)
        
        const blob = new Blob([htmlContent], { type: 'application/msword' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `Strategic_Plan_${new Date().toISOString().split('T')[0]}.doc`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        
        toast.success("Strategic Blueprint Downloaded")
    } catch (error: any) {
        if (error.message === 'NO_CREDITS') toast.error("Insufficient Credits (Requires 5)")
        else toast.error("Generation protocol failed.")
    } finally {
        setLoading(false)
    }
  }

  return (
    <Button 
        onClick={handleGenerate} 
        disabled={loading}
        className="w-full h-14 bg-white hover:bg-indigo-50 text-indigo-600 font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl shadow-xl border-none transition-all active:scale-95"
    >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <FileText className="mr-2 h-4 w-4" />
        )}
        {loading ? "Decrypting..." : "Generate Plan"}
    </Button>
  )
}
