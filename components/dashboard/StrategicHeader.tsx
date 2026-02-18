'use client'
import { 
  Zap, 
  Target, 
  Clock, 
  AlertTriangle,
  Globe,
  BatteryCharging,
  Info
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils' // Assicurati che l'import di cn sia presente

interface StrategicHeaderProps {
  data: any;
  dict: any;
}

export function StrategicHeader({ data, dict }: StrategicHeaderProps) {
  const { 
    runway, 
    staleProjectsCount, 
    expiringTasksCount, 
    globalTasksCount,
    allocation // Nuovi dati dal Punto 4
  } = data;
  
  const runwayNum = Number(runway || 0);
  const isCritical = runwayNum < 3;

  // Dati di allocazione
  const utilization = allocation?.utilizationRate || 0;
  const isOverAllocated = allocation?.isOverAllocated || false;

  const scrollToGlobal = () => {
    const el = document.getElementById('global-backlog');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };
  
  return (
    <div className="grid gap-6 md:grid-cols-3 font-sans items-stretch">
      
      {/* 1. FINANCIAL RUNWAY (DNA: DARK FOUNDER MOMENTUM + RISK ENGINE) */}
      <div className="md:col-span-1 bg-slate-900 text-white rounded-[2rem] p-8 relative overflow-hidden border border-slate-800 shadow-xl flex flex-col justify-between min-h-[260px]">
        <BatteryCharging className="absolute -right-6 -bottom-6 h-32 w-32 text-indigo-500/10 -rotate-12" />

        <div className="relative z-10 space-y-1">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black italic uppercase tracking-tight text-white/90">
              Financial Runway
            </h3>
            {isCritical && <AlertTriangle size={18} className="text-rose-500 animate-pulse" />}
          </div>
          <p className="text-sm text-slate-400 font-medium italic opacity-70 uppercase">
            Liquidity Survival Time
          </p>
        </div>

        <div className="relative z-10 mt-2">
          <div className="flex items-end gap-2">
              <h3 className={cn(
                "text-6xl font-black tracking-tighter leading-none",
                isCritical ? 'text-rose-500 animate-pulse' : 'text-emerald-400'
              )}>
                  {runway || 0}
              </h3>
              <p className="text-[10px] font-bold mb-2 text-slate-500 uppercase tracking-widest">
                months left
              </p>
          </div>
          
          {/* BARRA 1: RUNWAY TRADIZIONALE (12 MESI SCALE) */}
          <div className="mt-4 h-1.5 w-full bg-white/5 rounded-full overflow-hidden p-[1px]">
              <div 
                className={cn(
                    "h-full rounded-full transition-all duration-1000 ease-out",
                    isCritical ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                )}
                style={{ width: `${Math.min((runwayNum / 12) * 100, 100)}%` }} 
              />
          </div>
        </div>

        {/* --- NEW: CAPITAL COMMITMENT NODE (Punto 4.1) --- */}
        <div className="relative z-10 mt-6 pt-6 border-t border-white/5 space-y-2">
            <div className="flex justify-between items-end">
                <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-500">Capital Commitment</span>
                    {isOverAllocated && (
                        <span className="text-[8px] font-black bg-rose-500/20 text-rose-500 px-1.5 py-0.5 rounded border border-rose-500/30">VIRTUAL_STRATEGY</span>
                    )}
                </div>
                <span className={cn(
                    "text-[10px] font-black", 
                    isOverAllocated ? "text-rose-500" : "text-indigo-400"
                )}>
                    {utilization}%
                </span>
            </div>
            {/* Barra di Rischio Chirurgica (2px) */}
            <div className="h-[2px] w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                    className={cn(
                        "h-full transition-all duration-1000",
                        isOverAllocated ? "bg-rose-600 shadow-[0_0_8px_rgba(225,29,72,0.6)]" : 
                        utilization > 75 ? "bg-amber-500" : "bg-indigo-500"
                    )}
                    style={{ width: `${Math.min(utilization, 100)}%` }}
                />
            </div>
        </div>
      </div>

      {/* 2. EXECUTIVE BRIEFING (DNA: WHITE FOUNDER MOMENTUM) */}
      <div className="md:col-span-2 bg-white border border-slate-200 rounded-[2rem] p-8 flex flex-col justify-between min-h-[220px] shadow-sm relative overflow-hidden group">
        <Zap className="absolute -right-6 -top-6 h-32 w-32 text-indigo-500/5 -rotate-12 group-hover:rotate-0 transition-transform duration-700" />

        <div className="relative z-10 space-y-1">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black italic uppercase tracking-tight text-slate-900">
              Executive Briefing
            </h3>
            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-100">
              <Zap size={18} fill="currentColor" />
            </div>
          </div>
          <p className="text-sm text-slate-500 font-medium italic opacity-70 uppercase tracking-widest">
            System Alerts & Tasks
          </p>
        </div>
        
        <div className="relative z-10 flex flex-wrap gap-3 mt-6">
            <button onClick={scrollToGlobal} className="group/btn">
              <div className={cn(
                "flex items-center gap-3 px-5 py-3.5 rounded-2xl border transition-all hover:scale-[1.03]",
                globalTasksCount > 0 ? 'bg-indigo-50 border-indigo-100 text-indigo-700 shadow-sm' : 'bg-slate-50 border-slate-100 text-slate-400 opacity-60'
              )}>
                  <Globe className="h-4 w-4" />
                  <span className="text-xs font-black uppercase tracking-widest">{globalTasksCount || 0} Strategy</span>
              </div>
            </button>

            <Link href="/dashboard/agenda">
                <div className={cn(
                    "flex items-center gap-3 px-5 py-3.5 rounded-2xl border transition-all hover:scale-[1.03]",
                    expiringTasksCount > 0 ? 'bg-amber-50 border-amber-100 text-amber-700 shadow-sm' : 'bg-slate-50 border-slate-100 text-slate-400 opacity-60'
                )}>
                    <Clock className="h-4 w-4" />
                    <span className="text-xs font-black uppercase tracking-widest">{expiringTasksCount || 0} Expiring</span>
                </div>
            </Link>
            
            <Link href="/dashboard/projects">
                <div className={cn(
                    "flex items-center gap-3 px-5 py-3.5 rounded-2xl border transition-all hover:scale-[1.03]",
                    staleProjectsCount > 0 ? 'bg-rose-50 border-rose-100 text-rose-700 shadow-sm' : 'bg-slate-50 border-slate-100 text-slate-400 opacity-60'
                )}>
                    <Zap className="h-4 w-4" />
                    <span className="text-xs font-black uppercase tracking-widest">{staleProjectsCount || 0} Stale</span>
                </div>
            </Link>
        </div>

        <div className="mt-6 flex items-start gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] border-t border-slate-50 pt-4">
           <Info className="h-3 w-3 shrink-0 text-indigo-400" />
           <p>Direct priority nodes requiring founder intervention.</p>
        </div>
      </div>
    </div>
  )
}
