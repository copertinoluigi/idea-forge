'use client' // Assicurati che ci sia dato che usi componenti animate-in

import { Zap, Gift, Info, CheckCircle2, Sparkles } from 'lucide-react'

interface FounderStreakProps {
  streak: number;
  progress: number;
  dict: any;
}

export function FounderStreak({ streak, progress, dict }: FounderStreakProps) {
  const s = dict.strategic;

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm relative overflow-hidden group">
      {/* Decorazione di sfondo */}
      <Zap className="absolute -right-6 -top-6 h-32 w-32 text-indigo-500/5 -rotate-12 group-hover:rotate-0 transition-transform duration-700" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-black text-slate-900 italic uppercase tracking-tight">
              {s?.streak_title || 'Founder Momentum'}
            </h3>
            <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse uppercase">
              {s?.streak_badge || 'STREAK'}: {streak} {s?.days || 'DAYS'}
            </span>
          </div>
          <p className="text-sm text-slate-500 max-w-md leading-relaxed">
            {s?.streak_subtitle || 'Consistency is the only secret. Work 10 consecutive days to unlock rewards.'}
          </p>
        </div>

        {/* Box Premio */}
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 p-4 rounded-2xl shadow-sm">
          <Gift className="h-6 w-6 text-amber-500" />
          <div>
            <p className="text-[10px] font-bold text-amber-600 uppercase leading-none mb-1">
              {s?.streak_reward || 'Next Reward'}
            </p>
            <p className="text-sm font-black text-amber-900">+1 AI Credit</p>
          </div>
        </div>
      </div>

      {/* Progress Slots (1-10) */}
      <div className="grid grid-cols-5 md:grid-cols-10 gap-3 relative z-10">
        {Array.from({ length: 10 }).map((_, i) => {
          const isFilled = i < progress;
          const isNext = i === progress;

          return (
            <div key={i} className="relative">
                <div 
                    className={`h-14 rounded-xl border-2 transition-all duration-500 flex items-center justify-center
                        ${isFilled 
                            ? 'bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-200' 
                            : isNext 
                                ? 'bg-white border-indigo-200 border-dashed animate-pulse' 
                                : 'bg-slate-50 border-slate-100'
                        }`}
                >
                    {isFilled ? (
                        <Zap className="h-6 w-6 text-white fill-white" />
                    ) : (
                        <span className="text-xs font-bold text-slate-300">{i + 1}</span>
                    )}
                </div>
            </div>
          )
        })}
      </div>
      
      {/* Milestone Celebration Box */}
      {streak > 0 && streak % 10 === 0 && (
        <div className="mt-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-between animate-in zoom-in-95 duration-500 relative z-10">
          <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                  <CheckCircle2 size={18} />
              </div>
              <div>
                  <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest leading-none mb-1">
                      Milestone Protocol Reached
                  </p>
                  <p className="text-sm font-bold text-emerald-600 italic">
                      +1 AI Credit injected into your vault for your {streak}-day consistency.
                  </p>
              </div>
          </div>
          <Sparkles className="text-emerald-400 h-5 w-5 animate-pulse" />
        </div>
      )}

      {/* Spiegazione in fondo */}
      <div className="mt-8 flex items-start gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-t border-slate-50 pt-4 relative z-10">
         <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-indigo-400" />
         <p className="leading-tight">
           {s?.streak_info || 'Each slot fills up by completing at least one task or adding a resource during the day.'}
         </p>
      </div>
    </div>
  )
}
