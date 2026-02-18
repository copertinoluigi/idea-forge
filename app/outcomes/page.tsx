'use client'
import Link from 'next/link'
import { ArrowLeft, Clock, TrendingUp, Zap, BarChart3, Star, CheckCircle, Target } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function OutcomesPage() {
    const outcomes = [
        { 
            icon: <Clock className="text-blue-600" />, 
            title: "Reclaim Your Focus", 
            text: "Founders save an average of 6 hours per week by centralizing operational data that was previously scattered across 5+ different platforms.",
            stat: "-35% Friction"
        },
        { 
            icon: <Target className="text-emerald-600" />, 
            title: "Operational Clarity", 
            text: "Identify project overhead and 'zombie' resource leaks 40% faster using our integrated ecosystem velocity analysis.",
            stat: "+22% Yield"
        },
        { 
            icon: <Zap className="text-amber-600" />, 
            title: "Strategic Velocity", 
            text: "Generate professional, data-backed strategic briefs in under 120 seconds. Perfect for partners, internal audits, or initiative planning.",
            stat: "Instant ROI"
        },
    ]

    return (
        <div className="min-h-screen bg-white text-slate-900 pt-32 px-6 overflow-hidden font-sans">
            {/* BACK BUTTON */}
            <div className="fixed top-8 left-8 z-50">
                <Link href="/" className="group flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-all bg-slate-50 px-4 py-2 rounded-full border border-slate-100 shadow-sm font-bold">
                    <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest italic">Hub Origin</span>
                </Link>
            </div>

            <div className="max-w-5xl mx-auto">
                {/* HEADER */}
                <div className="text-center mb-24">
                    <h1 className="text-5xl md:text-8xl font-black mb-6 tracking-tighter uppercase leading-[0.85] text-slate-900 italic">Proven <br/><span className="text-indigo-600">Outcomes.</span></h1>
                    <p className="text-slate-400 font-bold uppercase tracking-[0.4em] text-[10px]">How MindHub transforms your daily operations</p>
                </div>
                
                {/* OUTCOMES LIST */}
                <div className="grid gap-8">
                    {outcomes.map((o, i) => (
                        <div key={i} className="group relative flex flex-col md:flex-row items-center gap-10 p-10 md:p-16 bg-slate-50 rounded-[4rem] border border-slate-100 hover:bg-white hover:shadow-2xl hover:shadow-indigo-100 transition-all duration-700">
                            <div className="h-24 w-24 rounded-[2.5rem] bg-white shadow-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform border border-slate-100">
                                {o.icon}
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <h3 className="text-2xl font-black mb-3 uppercase italic tracking-tight text-slate-900">{o.title}</h3>
                                <p className="text-slate-500 font-medium text-lg leading-relaxed">{o.text}</p>
                            </div>
                            <div className="text-5xl font-black text-indigo-600/10 group-hover:text-indigo-600 transition-colors">
                                {o.stat}
                            </div>
                        </div>
                    ))}
                </div>

                {/* FINAL CTA BOX */}
                <div className="mt-32 p-16 rounded-[4rem] bg-slate-900 text-white text-center relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full"></div>
                    <div className="relative z-10">
                        <BarChart3 className="mx-auto h-12 w-12 text-indigo-400 mb-8" />
                        <h2 className="text-3xl font-black mb-4 uppercase italic tracking-tight">Ready to see the difference?</h2>
                        <p className="text-slate-400 mb-10 max-w-md mx-auto font-medium leading-relaxed">Join the founders who have reclaimed their strategic clarity. Your node is ready for initialization.</p>
                        <Link href="/auth/signup">
                            <Button className="rounded-2xl h-14 px-10 bg-indigo-600 font-black uppercase tracking-widest hover:bg-white hover:text-indigo-600 text-white border-0 transition-all shadow-xl">Establish Identity</Button>
                        </Link>
                    </div>
                </div>
            </div>
            <div className="h-24" />
        </div>
    )
}
