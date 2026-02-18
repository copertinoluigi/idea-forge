'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2, Lock, Mail, ShieldCheck, Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    
    if (error) {
      if (error.message.includes("Email not confirmed")) {
        toast.info("Verification required")
        router.push(`/auth/verify?email=${encodeURIComponent(email)}`)
      } else {
        toast.error(error.message)
      }
      setLoading(false)
    } else {
      toast.success("Identity Verified")
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-10 relative">
      
      {/* TASTO BACK TO HOME */}
      <div className="absolute top-8 left-8">
        <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors group font-bold">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs uppercase tracking-widest">Back to Home</span>
        </Link>
      </div>

      <Card className="w-full max-w-[450px] rounded-[3rem] border-slate-100 shadow-2xl overflow-hidden bg-white">
        <CardHeader className="bg-slate-900 text-white p-10 text-center relative">
          <div className="absolute top-4 right-4 opacity-10">
            <ShieldCheck size={80} />
          </div>
          <div className="mx-auto h-16 w-16 bg-white/10 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-xl">
             <Lock className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-black italic tracking-tight uppercase">Access Gate</CardTitle>
          <CardDescription className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-2">
            MindHub OS Authentication
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-10">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-wider">Master Email</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 p-4 pl-12 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                  placeholder="founder@mindhub.website"
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-wider">Password</label>
                <Link href="/auth/forgot-password" className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors uppercase tracking-widest">
                  Lost Key?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 p-4 pl-12 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none pr-12 transition-all"
                  placeholder="••••••••••••"
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            
            <Button 
                type="submit" 
                className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 transition-all active:scale-95 group" 
                disabled={loading}
            >
              {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : (
                <>
                    ENTER DASHBOARD <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>

            <div className="text-center pt-4">
              <p className="text-[11px] text-slate-500 font-medium">
                New Founder?{' '}
                <Link href="/auth/signup" className="text-indigo-600 hover:text-indigo-700 font-black uppercase tracking-tight ml-1">
                  Create Ecosystem
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
