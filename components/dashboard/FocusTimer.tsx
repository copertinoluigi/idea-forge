'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Play, Pause, RotateCcw, Zap, Info } from 'lucide-react'
import { toast } from 'sonner'

export default function FocusTimer() {
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [isActive, setIsActive] = useState(false)
  const [mode, setMode] = useState<'focus' | 'break'>('focus')

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((t) => t - 1), 1000)
    } else if (timeLeft === 0) {
      setIsActive(false)
      toast.success(mode === 'focus' ? "Session complete!" : "Break over!")
      setMode(mode === 'focus' ? 'break' : 'focus')
      setTimeLeft(mode === 'focus' ? 5 * 60 : 25 * 60)
    }
    return () => { if (interval) clearInterval(interval) }
  }, [isActive, timeLeft, mode])

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  return (
    <Card className="bg-white border border-slate-200 border-l-4 border-l-amber-500 rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden font-sans text-slate-900">
      
      {/* HEADER UNIFICATO */}
      <div className="flex flex-row items-start justify-between gap-4 mb-8">
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-slate-900 italic uppercase tracking-tighter leading-none">
            Deep Focus
          </h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
            {mode} mode protocol
          </p>
        </div>

        <div className={`shrink-0 p-2.5 rounded-xl text-white shadow-lg transition-all ${isActive ? 'bg-amber-600 animate-pulse' : 'bg-amber-500'}`}>
            <Zap size={18} fill={isActive ? "currentColor" : "none"} />
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center py-4">
        <div className="text-6xl font-bold text-slate-900 font-mono tracking-tighter mb-8 leading-none">
            {formatTime(timeLeft)}
        </div>
        
        <div className="flex gap-3 w-full">
            <Button onClick={() => setIsActive(!isActive)} className={`flex-1 h-12 rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-md transition-all ${isActive ? 'bg-slate-100 text-slate-600' : 'bg-amber-500 text-white hover:bg-amber-600'}`}>
                {isActive ? <Pause size={14} className="mr-2" /> : <Play size={14} className="mr-2" />} 
                {isActive ? 'Pause' : 'Start'}
            </Button>
            <Button variant="outline" onClick={() => { setIsActive(false); setTimeLeft(25*60); }} className="h-12 w-12 rounded-xl border-slate-200 text-slate-400 hover:text-slate-600 shadow-sm"><RotateCcw size={16} /></Button>
        </div>
      </div>

      <div className="mt-8 flex items-start gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest border-t border-slate-50 pt-4 italic opacity-70">
         <Info className="h-3.5 w-3.5 shrink-0 text-amber-500 mt-0.5" />
         <p>High-performance isolation mode active.</p>
      </div>
    </Card>
  )
}
