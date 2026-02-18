'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2, KeyRound, ShieldAlert, Calendar as CalendarIcon, User, Mail, Lock, CheckCircle2, ArrowLeft, Rocket, Sparkles, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'

export default function SignUpPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const supabase = createClient()

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthDate: '', 
    password: '',
    inviteKey: '', 
    termsAccepted: false,
    company_role: '' // Honeypot
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    if (name === 'inviteKey') setErrorMsg('')
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    
    // Honeypot check
    if (formData.company_role) return

    if (!formData.termsAccepted) {
      toast.error("You must accept the Terms and Conditions to proceed.")
      return
    }

    let finalStatus = 'free';
    let initialCredits = 0;

    // Beta Key Validation
    if (formData.inviteKey) {
        if (formData.inviteKey === 'B3taMind@2026') {
            finalStatus = 'beta';
            initialCredits = 5;
        } else {
            setErrorMsg("Invalid Invite Key. Leave empty for Free Plan.");
            return;
        }
    }

    setLoading(true)
    
    const { error } = await supabase.auth.signUp({ 
      email: formData.email, 
      password: formData.password,
      options: { 
        data: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
          birth_date: formData.birthDate,
          terms_accepted: true,
          plan_status: finalStatus,
          initial_credits: initialCredits
        }
      }
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
    } else {
      toast.success("Account initialized successfully")
      router.push(`/auth/verify?email=${encodeURIComponent(formData.email)}`)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-20 relative overflow-x-hidden font-sans">
      
      {/* BACK TO HOME - Fix Spacing */}
      <div className="absolute top-6 left-6 md:top-10 md:left-10 z-50">
        <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-all group font-bold">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] md:text-xs uppercase tracking-[0.2em]">Back to Home</span>
        </Link>
      </div>

      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        
        {/* LEFT COLUMN: VALUE PROPOSITION (Hidden on mobile for focus) */}
        <div className="hidden lg:block space-y-8 p-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                <Sparkles size={12} /> The Future of Founder Operations
            </div>
            <h1 className="text-5xl font-black text-slate-900 leading-[1.1] tracking-tight">
                Your entire startup ecosystem, <br/>
                <span className="text-indigo-600 italic underline decoration-indigo-200 underline-offset-8">in one single view.</span>
            </h1>
            <p className="text-slate-500 text-lg font-medium leading-relaxed max-w-md">
                Stop juggling between 10 apps. MindHub is the operating system built for founders who demand clarity, control, and AI-driven strategy.
            </p>
            <div className="space-y-4 pt-4">
                {[
                    { i: Rocket, t: "Financial Vaults", d: "Automatic Tax and Profit segregation." },
                    { i: ShieldCheck, t: "Strategic AI", d: "Business audits that scale with your growth." },
                    { i: CheckCircle2, t: "Unified Roadmap", d: "Tasks, payments and calendars in one place." }
                ].map((item, idx) => (
                    <div key={idx} className="flex gap-4 items-start animate-in fade-in slide-in-from-left-4 duration-700" style={{ transitionDelay: `${idx * 200}ms` }}>
                        <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-indigo-600"><item.i size={20} /></div>
                        <div>
                            <h4 className="font-bold text-slate-900 leading-none mb-1">{item.t}</h4>
                            <p className="text-xs text-slate-400 font-medium">{item.d}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* RIGHT COLUMN: SIGNUP FORM */}
        <Card className="w-full rounded-[3rem] border-slate-100 shadow-2xl overflow-hidden bg-white">
            <CardHeader className="bg-slate-900 text-white p-10 text-center relative">
            <div className="absolute top-4 right-4 opacity-10">
                <User size={80} />
            </div>
            <div className="mx-auto h-16 w-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/20">
                <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-black italic tracking-tight uppercase">Create Ecosystem</CardTitle>
            <CardDescription className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-2">
                Initialize your MindHub node
            </CardDescription>
            </CardHeader>

            <CardContent className="p-8 md:p-10">
            
            {errorMsg && (
                <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-3">
                    <ShieldAlert className="h-5 w-5 text-red-600 shrink-0" />
                    <p className="text-xs text-red-800 font-bold uppercase tracking-tight">{errorMsg}</p>
                </div>
            )}

            <form onSubmit={handleSignUp} className="space-y-5">
                
                {/* INVITE KEY */}
                <div className="bg-indigo-50/50 p-5 rounded-3xl border border-indigo-100 space-y-3 shadow-sm">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 flex items-center gap-2">
                        <KeyRound className="h-3 w-3" /> Early Access Key (Optional)
                    </label>
                    <input 
                        name="inviteKey" type="text" placeholder="B3TA-XXXX-XXXX" 
                        onChange={handleChange} 
                        className="w-full bg-white rounded-xl border border-indigo-200 p-3 text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none font-mono text-center tracking-widest font-bold placeholder:text-slate-300" 
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1">First Name</label>
                      <input name="firstName" required onChange={handleChange} className="w-full rounded-2xl border border-slate-200 p-4 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" />
                  </div>
                  <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Last Name</label>
                      <input name="lastName" required onChange={handleChange} className="w-full rounded-2xl border border-slate-200 p-4 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-wider">Master Email</label>
                  <div className="relative">
                      <input name="email" type="email" required onChange={handleChange} className="w-full rounded-2xl border border-slate-200 p-4 pl-12 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" placeholder="founder@ecosystem.com" />
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1.5">
                            <CalendarIcon className="h-3 w-3" /> Date of Birth
                        </label>
                        <input name="birthDate" type="date" required onChange={handleChange} className="w-full rounded-2xl border border-slate-200 p-4 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Secure Password</label>
                        <div className="relative">
                            <input name="password" type="password" required minLength={8} onChange={handleChange} className="w-full rounded-2xl border border-slate-200 p-4 pl-12 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-300" placeholder="••••••••" />
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        </div>
                    </div>
                </div>

                {/* Honeypot */}
                <input type="text" name="company_role" value={formData.company_role} onChange={handleChange} style={{ display: 'none' }} tabIndex={-1} autoComplete="off"/>

                <div className="flex items-start space-x-3 py-2 px-1">
                  <input 
                    type="checkbox" 
                    name="termsAccepted" 
                    id="terms" 
                    required 
                    onChange={handleChange} 
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" 
                  />
                  <label htmlFor="terms" className="text-[10px] text-slate-500 leading-snug font-medium">
                    I accept the <Link href="/terms" className="text-indigo-600 underline font-bold">Terms of Service</Link> and <Link href="/privacy" className="text-indigo-600 underline font-bold">Privacy Policy</Link>.
                  </label>
                </div>

                <Button type="submit" className="w-full h-16 mt-2 font-black text-sm tracking-widest bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2rem] shadow-2xl shadow-indigo-200 transition-all active:scale-95 uppercase" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Establish Identity'}
                </Button>

                <div className="text-center pt-4">
                  <p className="text-[11px] text-slate-500 font-medium italic">
                    Already established?{' '}
                    <Link href="/auth/login" className="text-indigo-600 hover:text-indigo-700 font-black uppercase tracking-tighter not-italic ml-1">
                      Access Node
                    </Link>
                  </p>
                </div>
            </form>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}
