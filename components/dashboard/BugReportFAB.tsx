'use client'
import { useState, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { reportBug } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { MessageSquarePlus, Camera, Loader2, Send, CheckCircle2, X } from 'lucide-react'

export default function BugReportFAB() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  // Escludiamo le pagine di creazione per non coprire i tasti "Save"
  if (pathname?.endsWith('/new')) return null

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    
    try {
      const res = await reportBug(formData)
      if (res.success) {
        setSent(true)
        toast.success("Feedback received!")
        formRef.current?.reset()
        setFileName(null)
        setTimeout(() => {
            setSent(false)
            setIsOpen(false)
        }, 3000)
      } else {
        toast.error("Failed to send.")
      }
    } catch (err) {
      toast.error("Connection error.")
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFileName(e.target.files[0].name)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4">
      
      {/* POPUP FORM */}
      {isOpen && (
        <div className="bg-white border border-slate-200 shadow-2xl rounded-[2rem] w-[320px] sm:w-[380px] p-6 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-sm font-bold text-slate-900">Found a bug?</h3>
                    <p className="text-[11px] text-slate-500 font-medium">Help Luigi improve MindHub.</p>
                </div>
                <button 
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                >
                    <X size={18} />
                </button>
            </div>

            {sent ? (
                <div className="flex flex-col items-center justify-center py-8 text-center animate-in zoom-in">
                    <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                        <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-900">Report Sent!</p>
                </div>
            ) : (
                <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
                    <textarea 
                        name="description" 
                        required 
                        placeholder="What happened? Or what would you like to see?" 
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-3 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 min-h-[100px] resize-none"
                    />
                    
                    <div className="flex items-center gap-2">
                        <label className="flex-1 cursor-pointer bg-white border border-slate-200 rounded-xl px-3 h-10 flex items-center gap-2 hover:bg-slate-50 transition-colors overflow-hidden">
                            <Camera className="h-4 w-4 text-slate-400 shrink-0" />
                            <span className="text-[10px] text-slate-500 font-bold truncate">
                                {fileName ? fileName : "Attach Screen"}
                            </span>
                            <input type="file" name="screenshot" accept="image/*" className="hidden" onChange={handleFileChange} />
                        </label>

                        <Button 
                            type="submit" 
                            disabled={loading} 
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl h-10 px-4 shadow-lg shadow-indigo-100"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                    </div>
                </form>
            )}
        </div>
      )}

      {/* FLOATING BUTTON */}
      {!isOpen && (
        <button 
            onClick={() => setIsOpen(true)}
            className="h-14 w-14 bg-slate-900 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 hover:rotate-12 transition-all active:scale-95 group"
        >
            <MessageSquarePlus className="h-6 w-6" />
            <div className="absolute right-full mr-3 bg-slate-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Report Bug
            </div>
        </button>
      )}
    </div>
  )
}
