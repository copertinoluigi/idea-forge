'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2, Mail, ArrowLeft, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // USIAMO L'URL ASSOLUTO IDENTICO A QUELLO IN LISTA SU SUPABASE
    // Rimuoviamo window.location.origin per evitare discrepanze con il "www"
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://mindhub.website/auth/update-password',
    })

    if (error) {
      toast.error(error.message)
    } else {
      setSubmitted(true)
      toast.success("Recovery protocol initiated. Check your inbox.")
    }
    setLoading(false)
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md w-full rounded-[3rem] border-slate-100 shadow-2xl overflow-hidden bg-white">
          <CardContent className="p-12 text-center space-y-6">
            <div className="mx-auto w-20 h-20 bg-indigo-100 rounded-3xl flex items-center justify-center text-indigo-600">
              <Mail size={40} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900 italic">CHECK EMAIL</h2>
              <p className="text-slate-500 font-medium">
                We've sent a secure recovery link to <span className="font-bold text-slate-900">{email}</span>.
              </p>
            </div>
            <Link href="/auth/login" className="block">
              <Button variant="outline" className="w-full h-12 rounded-2xl font-bold border-slate-200">
                Back to Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="max-w-md w-full rounded-[3rem] border-slate-100 shadow-2xl overflow-hidden bg-white">
        <CardHeader className="bg-slate-900 text-white p-10 text-center relative">
          <div className="absolute top-4 right-4 opacity-10">
            <ShieldCheck size={80} />
          </div>
          <div className="mx-auto h-16 w-16 bg-white/10 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-xl">
             <Mail className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-black italic tracking-tight uppercase">Access Recovery</CardTitle>
          <CardDescription className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-2">
            MindHub Security Protocol
          </CardDescription>
        </CardHeader>
        <CardContent className="p-10">
          <form onSubmit={handleReset} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-wider">Registered Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 p-4 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                placeholder="founder@startup.com"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 transition-all active:scale-95" 
              disabled={loading}
            >
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'SEND RECOVERY LINK'}
            </Button>
            
            <Link href="/auth/login" className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors">
              <ArrowLeft size={14} /> Back to Login
            </Link>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
