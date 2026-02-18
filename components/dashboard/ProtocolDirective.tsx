'use client'
import { useState } from 'react'
import { Info, ChevronDown, ChevronUp, Sparkles, Target } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DirectiveProps {
  title: string
  steps: { label: string; desc: string }[]
  outcome: string
}

export default function ProtocolDirective({ title, steps, outcome }: DirectiveProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="w-full lg:w-80 shrink-0">
      {/* MOBILE TOGGLE */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden w-full flex items-center justify-between p-4 bg-indigo-600 text-white rounded-2xl mb-4 shadow-lg shadow-indigo-200 font-bold text-xs uppercase tracking-widest"
      >
        <div className="flex items-center gap-2">
          <Sparkles size={16} />
          <span>System Directives: {title}</span>
        </div>
        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {/* MAIN CONTENT BOX */}
      <div className={cn(
        "bg-white border border-slate-200 rounded-[2rem] p-6 shadow-xl lg:sticky lg:top-8 transition-all duration-300 overflow-hidden",
        !isOpen && "hidden lg:block"
      )}>
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
            <Target size={20} />
          </div>
          <h3 className="font-black text-xs uppercase tracking-tighter text-slate-900">
            Operational Protocol
          </h3>
        </div>

        <div className="space-y-6">
          {steps.map((step, idx) => (
            <div key={idx} className="relative pl-6 border-l-2 border-slate-100">
              <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-white border-2 border-indigo-500 shadow-sm" />
              <p className="text-[10px] font-black uppercase text-indigo-600 mb-1">{step.label}</p>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100">
          <p className="text-[9px] font-black uppercase text-slate-400 mb-3 tracking-widest italic">Expected Outcome</p>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-[11px] text-slate-600 font-bold leading-relaxed">
              {outcome}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-2 opacity-30 italic">
          <Info size={12} />
          <span className="text-[9px] font-bold">MindHub Intelligence v1.8.9</span>
        </div>
      </div>
    </div>
  )
}
