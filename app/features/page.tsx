'use client'
import { Bot, LineChart, Calendar, Zap, FolderLock, FileOutput, ArrowLeft, BarChart2, MousePointer2, ShieldCheck, User, Coins, Target } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function FeaturesPage() {
    const details = [
        { 
            icon: <Target className="text-indigo-600" />, 
            title: "Resource Buffer Logic", 
            desc: "Stop confusing gross volume with actual capacity. MindHub automatically segregates incoming resources into Compliance Buffers, Project Budgets, and Operational Yield.",
            uc: "Instantly know exactly how much capital is available for reinvestment without touching next month's fixed overhead."
        },
        { 
            icon: <Bot className="text-emerald-600" />, 
            title: "AI Strategic Partner", 
            desc: "A data-driven logic layer that never sleeps. It analyzes your burn rate and velocity to identify which projects are scaling and which are losing operational ROI.",
            uc: "Get an objective audit that suggests reallocating resources from a stagnant project before you burn another month of effort."
        },
        { 
            icon: <Calendar className="text-blue-600" />, 
            title: "Unified Roadmap", 
            desc: "Your tasks don't exist in a vacuum. MindHub connects your iCal events, project deadlines, and operational renewals in a single, high-level timeline.",
            uc: "See a software renewal cost hitting your runway on the same day you have a critical project delivery deadline."
        },
        { 
            icon: <FolderLock className="text-amber-600" />, 
            title: "Strategic Asset Vault", 
            desc: "One secure place for your brand assets, NDAs, and legal foundations. No more hunting through cloud drives when a partner asks for a document.",
            uc: "Quickly access your registration docs or brand guidelines while you're on a strategic call with a potential collaborator."
        },
        { 
            icon: <FileOutput className="text-purple-600" />, 
            title: "Contextual Briefs", 
            desc: "Transform your dashboard data into structured business plans or strategic memos with a single click. Context-aware and professionally formatted.",
            uc: "Generate a 5-page strategic brief for a new initiative based on your current ecosystem runway and velocity."
        },
        { 
            icon: <BarChart2 className="text-rose-600" />, 
            title: "Founder Momentum", 
            desc: "Consistency is the only secret. Track your daily operational intensity over 90-day cycles to ensure you stay in the high-performance flow state.",
            uc: "Visually confirm if you are actually building every day or if you've been stuck in 'administrative mode' for too long."
        }
    ]

    return (
        <div className="min-h-screen bg-white text-slate-900 pt-32 pb-20 overflow-x-hidden font-sans">
            <div className="fixed top-8 left-8 z-50">
                <Link href="/" className="group flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-all bg-slate-50 px-4 py-2 rounded-full border border-slate-100 shadow-sm">
                    <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest italic">Hub Origin</span>
                </Link>
            </div>

            <div className="mx-auto max-w-7xl px-6 text-center lg:text-left">
                <div className="flex flex-col lg:flex-row gap-20 items-center mb-32">
                    <div className="flex-1 space-y-8">
                        <div className="inline-block h-14 w-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xl shadow-indigo-100">
                            <Zap />
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black leading-[0.9] tracking-tighter uppercase italic text-slate-900">
                            One App to <br/><span className="text-indigo-600">Rule the Chaos.</span>
                        </h1>
                        <p className="text-xl text-slate-500 leading-relaxed font-medium max-w-xl mx-auto lg:mx-0">
                            MindHub unifies your fragmented digital ecosystem. It’s a high-performance system engineered to eliminate operational uncertainty and maximize founder focus.
                        </p>
                        <div className="flex justify-center lg:justify-start">
                            <Link href="/auth/signup">
                                <Button size="lg" className="bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl px-10 h-16 font-black uppercase tracking-widest shadow-xl transition-all active:scale-95">
                                    Initialize Node
                                </Button>
                            </Link>
                        </div>
                    </div>

                    <div className="flex-1 relative">
                        <div className="absolute -inset-10 bg-indigo-100 blur-[120px] rounded-full opacity-50"></div>
                        <div className="relative rounded-[3rem] border-8 border-slate-900 overflow-hidden shadow-2xl bg-slate-900 aspect-video">
                            <video autoPlay loop muted playsInline className="w-full h-full object-cover">
                                <source src="/videos/mindhub.webm" type="video/webm" />
                            </video>
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {details.map((f, i) => (
                        <div key={i} className="p-10 bg-slate-50 border border-slate-100 rounded-[3rem] hover:bg-white hover:shadow-2xl hover:shadow-indigo-100 transition-all duration-500 flex flex-col">
                            <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-sm border border-slate-100">
                                {f.icon}
                            </div>
                            <h3 className="text-xl font-black mb-4 uppercase tracking-tight italic">{f.title}</h3>
                            <p className="text-slate-500 font-medium text-sm leading-relaxed mb-10 flex-1">{f.desc}</p>
                            
                            <div className="mt-auto p-5 bg-white rounded-2xl border border-slate-100">
                                <p className="text-[10px] uppercase font-black text-indigo-600 tracking-widest mb-2 flex items-center gap-2">
                                    <MousePointer2 size={12} /> Operational Context
                                </p>
                                <p className="text-xs italic text-slate-400 font-medium">"{f.uc}"</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
