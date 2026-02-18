'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Lock, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'

export default function UpdatePasswordPage() {
  const supabase = createClient()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isIdentityVerified, setIsIdentityVerified] = useState(false)

  useEffect(() => {
    const manualSessionInjected = async () => {
      // 1. Estraiamo i token dall'URL (quello dopo il simbolo #)
      const hash = window.location.hash.substring(1)
      const params = new URLSearchParams(hash)
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')

      if (accessToken && refreshToken) {
        // 2. APPROCCIO COPIA E INVIA: Diciamo a Supabase "Usa questi token per questa sessione"
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        if (!error) {
          setIsIdentityVerified(true)
          toast.success("Identity Verified via Token Handshake")
        } else {
          toast.error("Invalid or expired security token")
        }
      } else {
        // Se non ci sono token nel hash, controlliamo se esiste già una sessione
        const { data: { session } } = await supabase.auth.getSession()
        if (session) setIsIdentityVerified(true)
        else toast.error("Security context missing. Please request a new link.")
      }
    }

    manualSessionInjected()
  }, [])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // Ora che abbiamo iniettato la sessione, updateUser funzionerà sicuramente
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      toast.error(error.message)
      setLoading(false)
    } else {
      toast.success("Security Key Updated. Identity Secured.")
      // Hard redirect per pulire lo stato e andare in dashboard
      window.location.href = '/dashboard'
    }
  }

  if (!isIdentityVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mx-auto" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Verifying Security Token...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
      <Card className="max-w-md w-full rounded-[3rem] border-slate-100 shadow-2xl overflow-hidden bg-white">
        <CardHeader className="bg-slate-900 text-white p-10 text-center relative">
          <div className="mx-auto h-16 w-16 bg-white/10 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-xl">
             <Lock className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-black italic tracking-tight uppercase leading-none">Update <br/> Access Key</CardTitle>
        </CardHeader>
        <CardContent className="p-10">
          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-wider">New Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 p-4 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl transition-all active:scale-95" 
              disabled={loading}
            >
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'CONFIRM NEW IDENTITY'}
            </Button>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex gap-3 items-start">
                <ShieldAlert size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[9px] font-bold text-slate-500 leading-relaxed uppercase tracking-tight">
                    By confirming, you update the master access key for this node. All other active sessions may be terminated.
                </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
