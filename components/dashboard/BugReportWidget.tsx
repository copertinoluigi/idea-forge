'use client'
import { useState, useRef } from 'react'
import { usePathname } from 'next/navigation' // <--- Importiamo il gestore dei percorsi
import { reportBug } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { AlertCircle, Camera, Loader2, Send, CheckCircle2 } from 'lucide-react'

export default function BugReportWidget() {
  const pathname = usePathname() // Recuperiamo l'URL attuale
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  // LOGICA DI ESCLUSIONE: 
  // Se l'indirizzo finisce con "/new", non renderizzare nulla (return null)
  if (pathname?.endsWith('/new')) {
    return null
  }

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
        setTimeout(() => setSent(false), 5000)
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
    <section className="mt-20 mb-10 max-w-4xl mx-auto px-4">
      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
          <AlertCircle className="h-32 w-32 text-slate-900" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Found a bug or need a feature?</h3>
              <p className="text-sm text-slate-500 font-medium">Help us build the perfect OS for founders.</p>
            </div>
          </div>

          {sent ? (
            <div className="flex flex-col items-center justify-center py-6 animate-in zoom-in duration-300 text-center">
              <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <p className="text-slate-900 font-bold">Report Sent Successfully!</p>
              <p className="text-xs text-slate-500">Luigi will review it personally.</p>
            </div>
          ) : (
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
              <textarea 
                name="description" 
                required 
                placeholder="Describe what happened or what you'd like to see..." 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all min-h-[100px] placeholder:text-slate-400"
              />
              
              <div className="flex flex-col md:flex-row items-center gap-4">
                <label className="w-full md:w-auto cursor-pointer bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors shadow-sm">
                  <Camera className="h-4 w-4 text-slate-500" />
                  <span className="text-sm text-slate-600 font-semibold">
                    {fileName ? fileName : "Attach Screenshot"}
                  </span>
                  <input 
                    type="file" 
                    name="screenshot" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleFileChange}
                  />
                </label>

                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full md:flex-1 h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-100"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" /> Send Report
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
