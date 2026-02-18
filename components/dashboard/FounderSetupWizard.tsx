'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { trackActivity } from '@/app/actions'
import { toast } from 'sonner'
import { Loader2, Rocket, Landmark, Briefcase, Calendar, Globe, Coins, ShieldCheck, Zap } from 'lucide-react'

interface WizardProps {
  user: any;
  dict: any;
}

export default function FounderSetupWizard({ user, dict }: WizardProps) {
  const [step, setStep] = useState(1)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  // Form States
  const [cash, setCash] = useState('')
  const [project, setProject] = useState({ title: '', budget: '' })
  const [expense, setExpense] = useState({ title: '', cost: '', currency: 'EUR', category: 'business' })
  const [calendarUrl, setCalendarUrl] = useState('')

  useEffect(() => {
    // Si attiva solo se non c'è liquidità o l'utente è nullo
    const isNewUser = !user || user.cash_on_hand === null || user.cash_on_hand === undefined || user.cash_on_hand === 0;
    if (isNewUser) setIsOpen(true)
  }, [user])

  const handleComplete = async () => {
    setLoading(true)
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return

      // --- 1. PREPARAZIONE UPDATE PROFILO (SURGICAL) ---
      const profileUpdate: any = {
        cash_on_hand: parseFloat(cash) || 0,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
      
      // AGGIORNA CALENDARI SOLO SE L'UTENTE HA INSERITO QUALCOSA
      // Questo evita di sovrascrivere i calendari esistenti con [] se si skippa
      if (calendarUrl.trim() !== '') {
        profileUpdate.calendars = [{ url: calendarUrl, name: 'Primary Node' }]
      }

      await supabase.from('profiles').update(profileUpdate).eq('id', authUser.id)

      // --- 2. INITIALIZE PROJECT NODE ---
      let createdProjectId = null;
      if (project.title.trim() !== '') {
        const { data: pData } = await supabase.from('projects').insert({
          user_id: authUser.id,
          title: project.title,
          status: 'active',
          progress: 10,
          budget: parseFloat(project.budget) || 0,
          description: 'Standard node initialized during onboarding sequence.'
        }).select().single()
        createdProjectId = pData?.id
      }

      // --- 3. LOG OPERATIONAL OVERHEAD ---
      if (expense.title.trim() !== '' && expense.cost !== '') {
        await supabase.from('subscriptions').insert({
          user_id: authUser.id,
          title: expense.title,
          cost: parseFloat(expense.cost) || 0,
          currency: expense.currency,
          category: expense.category,
          active: true,
          renewal_date: new Date().toISOString().split('T')[0],
          project_id: createdProjectId // Se creato lo lega, altrimenti va in Global Overhead
        })
      }

      await trackActivity()
      toast.success("Ecosystem Activated")
      setIsOpen(false)
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error("Protocol failure during initialization")
    } finally {
      setLoading(false)
    }
  }

  const canProceed = () => {
    if (step === 1) return cash !== '' && parseFloat(cash) > 0
    return true
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[550px] p-0 border-none bg-white overflow-hidden shadow-2xl rounded-[2.5rem]">
        
        {/* HEADER CUSTOM DNA */}
        <div className="bg-slate-900 p-8 text-white relative">
            <Zap className="absolute top-4 right-4 text-indigo-500/20 h-24 w-24 -rotate-12" />
            <div className="relative z-10 space-y-2">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-[10px] uppercase tracking-[0.3em]">
                    <ShieldCheck size={14} /> System Initialization
                </div>
                <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter leading-none">
                    Founder Onboarding
                </DialogTitle>
                <div className="flex items-center gap-4 pt-4">
                    <Progress value={(step / 4) * 100} className="h-1.5 bg-white/10" />
                    <span className="text-[10px] font-black text-indigo-300 whitespace-nowrap uppercase tracking-widest">{step} OF 4</span>
                </div>
            </div>
        </div>

        <div className="p-8 space-y-8">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="space-y-1">
                <h3 className="text-lg font-black uppercase italic tracking-tight text-slate-800">Establish Liquidity</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Enter your current business cash-on-hand. This activates the <span className="text-indigo-600 font-bold">Runway Logic</span>.
                </p>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-4 font-black text-slate-400 text-xl">€</span>
                <Input 
                    type="number" 
                    placeholder="0.00" 
                    value={cash} 
                    onChange={(e) => setCash(e.target.value)} 
                    className="pl-10 h-16 text-2xl font-black rounded-2xl border-slate-100 bg-slate-50 focus:ring-4 focus:ring-indigo-500/10 transition-all" 
                />
              </div>
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                 <Landmark className="text-amber-600 shrink-0" size={18} />
                 <p className="text-[10px] text-amber-700 font-bold leading-tight uppercase tracking-tight">
                    Mandatory: The system requires a baseline liquidity node to calculate project sustainability.
                 </p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="space-y-1">
                <h3 className="text-lg font-black uppercase italic tracking-tight text-slate-800">Initialize First Node</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">Define your primary objective for this cycle.</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Project Identity</label>
                    <Input placeholder="e.g. MindHub Expansion" value={project.title} onChange={(e) => setProject({...project, title: e.target.value})} className="h-12 rounded-xl font-bold" />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Allocated Capital (Optional)</label>
                    <Input type="number" placeholder="Budget for this project" value={project.budget} onChange={(e) => setProject({...project, budget: e.target.value})} className="h-12 rounded-xl font-bold" />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="space-y-1">
                <h3 className="text-lg font-black uppercase italic tracking-tight text-slate-800">Operational Burn</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">Add a recurring expense (like a SaaS or server) to test the engine.</p>
              </div>
              
              <div className="space-y-4">
                <Input placeholder="Expense Name" value={expense.title} onChange={(e) => setExpense({...expense, title: e.target.value})} className="h-12 font-bold" />
                <div className="grid grid-cols-2 gap-3">
                    <Input type="number" placeholder="Monthly Cost" value={expense.cost} onChange={(e) => setExpense({...expense, cost: e.target.value})} className="h-12 font-bold" />
                    <select value={expense.category} onChange={(e) => setExpense({...expense, category: e.target.value})} className="h-12 rounded-xl border border-slate-200 px-4 text-xs font-bold bg-white">
                        <option value="business">💼 Business</option>
                        <option value="life">🏠 Personal</option>
                    </select>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="space-y-1">
                <h3 className="text-lg font-black uppercase italic tracking-tight text-slate-800">Identity Sync</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">Paste your public iCal link to aggregate your real-world agenda.</p>
              </div>
              <Input 
                placeholder="https://p123-caldav.icloud.com/..." 
                value={calendarUrl} 
                onChange={(e) => setCalendarUrl(e.target.value)} 
                className="h-14 rounded-xl border-slate-200 font-mono text-xs"
              />
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                <Globe className="text-indigo-600" size={18} />
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">
                    Detected Zone: {Intl.DateTimeFormat().resolvedOptions().timeZone}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ACTIONS FOOTER */}
        <div className="p-8 bg-slate-50 flex justify-between items-center">
          <Button variant="ghost" onClick={() => step > 1 && setStep(step - 1)} className={`text-xs font-black uppercase tracking-widest ${step === 1 ? 'opacity-0' : ''}`}>
            Back
          </Button>
          
          <div className="flex gap-3">
             {step > 1 && (
                <Button variant="ghost" size="sm" onClick={() => step < 4 ? setStep(step + 1) : handleComplete()} className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Skip Step
                </Button>
             )}
             
             <Button 
                onClick={() => step < 4 ? setStep(step + 1) : handleComplete()} 
                disabled={loading || !canProceed()}
                className="h-12 px-8 bg-indigo-600 hover:bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-200 transition-all active:scale-95"
             >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (step === 4 ? 'Activate OS' : 'Continue')}
             </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
