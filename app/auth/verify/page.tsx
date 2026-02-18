'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2, ShieldCheck, RefreshCw } from 'lucide-react'
import { notifyNewUserVerified } from '@/app/actions' 

function VerifyForm() {
  // 1. HOOKS (Sempre in alto)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  // 2. EFFECTS
  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (emailParam) setEmail(emailParam)
  }, [searchParams])

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [cooldown])

  // 3. FUNZIONI DI GESTIONE (Unificate e senza duplicati)
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 1. VERIFICA OTP (Questa è l'unica cosa che dobbiamo aspettare)
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: token.trim(),
      type: 'signup'
    });

    if (error) {
      alert("Codice non valido: " + error.message);
      setLoading(false);
      return; 
    }

    // 2. SE SIAMO QUI, L'UTENTE È GIÀ REGISTRATO.
    // Lanciamo la notifica SENZA 'await'. 
    // Il server proverà a mandarla, ma non bloccherà il browser.
    notifyNewUserVerified(email).catch(err => console.error("Errore notifica:", err));

    // 3. REDIRECT IMMEDIATO (Usiamo window.location per un reset pulito dello stato)
    // Questo è più "violento" di router.push ma garantisce che la pagina si schiodi.
    window.location.href = '/dashboard';
  };

  const handleResendCode = async () => {
    if (cooldown > 0) return
    setResending(true)
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    if (error) alert(error.message)
    else {
      alert(`New code sent to ${email}`)
      setCooldown(60)
    }
    setResending(false)
  }

  // 4. RENDERING
  return (
    <Card className="w-full max-w-[400px] shadow-xl border-blue-100">
        <CardHeader className="text-center">
            <div className="mx-auto h-12 w-12 bg-blue-50 rounded-full flex items-center justify-center mb-2">
                <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Verify Account</CardTitle>
            <CardDescription>Enter the code sent to your email.</CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Email Address</label>
                    <input 
                        type="email" required value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-md border p-3 text-sm bg-gray-50"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Verification Code</label>
                    <input 
                        type="text" required value={token}
                        onChange={(e) => setToken(e.target.value)}
                        className="w-full rounded-md border-2 border-primary/20 p-3 text-center text-lg tracking-[0.5em] font-mono focus:border-primary focus:ring-0 outline-none"
                        placeholder="CODE"
                        maxLength={8} 
                    />
                </div>
                <Button type="submit" className="w-full h-11" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Activate Account'}
                </Button>
                <div className="pt-2 text-center">
                    <button 
                        type="button"
                        onClick={handleResendCode}
                        disabled={cooldown > 0 || resending || !email}
                        className="text-sm text-muted-foreground hover:text-primary flex items-center justify-center gap-2 w-full disabled:opacity-50"
                    >
                        {resending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                        {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend Code"}
                    </button>
                </div>
            </form>
        </CardContent>
    </Card>
  )
}

export default function VerifyPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Suspense fallback={<div>Loading...</div>}>
        <VerifyForm />
      </Suspense>
    </div>
  )
}
