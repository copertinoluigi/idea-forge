'use client'
import Link from 'next/link'
import { ArrowLeft, Quote, LayoutDashboard, Target, Zap } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 p-6 relative overflow-hidden flex flex-col items-center font-sans">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.03)_0%,transparent_70%)] -z-10" />

      {/* BACK BUTTON */}
      <div className="fixed top-8 left-8 z-50">
        <Link href="/" className="group flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-all bg-slate-50 px-4 py-2 rounded-full border border-slate-100 shadow-sm font-bold">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> 
            <span className="text-[10px] font-black uppercase tracking-widest italic">Hub Origin</span>
        </Link>
      </div>

      <div className="max-w-3xl w-full pt-32 pb-20">
        <div className="flex flex-col items-center mb-16 text-center">
            <div className="relative p-1.5 rounded-[3rem] bg-gradient-to-tr from-indigo-500 to-indigo-700 shadow-2xl shadow-indigo-100 mb-8">
                <img src="/imgs/luigi.jpg" alt="Luigi - MindHub Architect" className="h-32 w-32 rounded-[2.8rem] object-cover border-4 border-white shadow-inner" />
            </div>
            <h1 className="text-5xl md:text-6xl font-black mb-2 tracking-tighter uppercase italic leading-none text-slate-900">The Founder OS</h1>
            <p className="text-indigo-600 text-[10px] font-black tracking-[0.5em] uppercase">The Sovereign Manifesto — v1.9.8</p>
        </div>

        <div className="space-y-12 text-lg md:text-xl leading-relaxed text-slate-500 font-medium">
            <p className="text-2xl text-slate-900 font-black italic border-l-8 border-indigo-600 pl-8 leading-tight">
                I spent years winning at coding but losing at business operations. I was drowning in a fragmented stack: Jira for tasks, spreadsheets for resource tracking, Notion for notes. I was busy, but I wasn't sovereign.
            </p>
            
            <p>
                I realized that most solopreneurs fail not because of bad ideas, but because of <strong>operational and strategic blindness</strong>. We confuse gross volume with actual capacity, and task-completion with actual progress. We burn out because we don't have a clear view of where our energy and resources are actually going.
            </p>
            
            <div className="relative p-12 bg-slate-900 rounded-[4rem] text-white overflow-hidden shadow-2xl my-16">
                <Quote className="absolute top-8 right-8 text-indigo-500 opacity-20 h-20 w-20" />
                <p className="relative z-10 text-2xl font-black leading-tight italic tracking-tight">
                    "I needed a single Control Center. A place where my resource allocation is automated by logic, and where an AI partner challenges my roadmap before I waste another month."
                </p>
            </div>
            
            <p>
                MindHub is the system I use every single morning to run my life and my business projects. It’s built for the builders, the indie hackers, and the architects of the future who want to stop "playing CEO" and start actually being one.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10">
                <div className="flex flex-col items-center text-center p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <LayoutDashboard className="text-indigo-600 mb-3" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Order</span>
                </div>
                <div className="flex flex-col items-center text-center p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <Target className="text-emerald-600 mb-3" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Focus</span>
                </div>
                <div className="flex flex-col items-center text-center p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <Zap className="text-amber-600 mb-3" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Yield</span>
                </div>
            </div>
        </div>

        <div className="mt-32 pt-16 border-t border-slate-100 flex flex-col items-center">
            <p className="text-slate-900 font-black mb-2 text-4xl tracking-tighter uppercase italic">
                Luigi C.
            </p>
            <p className="text-[10px] text-slate-400 uppercase tracking-[0.4em] font-black">
                Architect, MindHub Protocol
            </p>
        </div>
      </div>
    </div>
  )
}
