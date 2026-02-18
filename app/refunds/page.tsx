'use client'
import Link from 'next/link'
import { ArrowLeft, RefreshCcw, ShieldCheck, Mail, Info, ZapOff } from "lucide-react" 

export default function RefundsPage() {
    return (
        <div className="min-h-screen bg-white text-slate-900 pt-32 pb-20 font-sans">
            {/* BACK BUTTON */}
            <div className="fixed top-8 left-8 z-50">
                <Link href="/" className="group flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-all bg-slate-50 px-4 py-2 rounded-full border border-slate-100 shadow-sm font-bold">
                    <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest italic">Hub Origin</span>
                </Link>
            </div>

            <div className="mx-auto max-w-4xl px-6">
                {/* HEADER */}
                <div className="mb-20 text-center">
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4 italic uppercase text-slate-900 leading-none">Refund <br/>Protocol.</h1>
                    <p className="text-indigo-600 font-black uppercase tracking-[0.4em] text-[10px]">Operational Satisfaction Guarantee — v1.9.8</p>
                </div>

                <div className="grid gap-8">
                    {/* THE GUARANTEE */}
                    <div className="p-10 rounded-[3.5rem] bg-slate-50 border border-slate-100 flex flex-col md:flex-row gap-8 items-start hover:bg-white hover:shadow-2xl transition-all duration-500">
                        <div className="h-16 w-16 rounded-[1.5rem] bg-white shadow-sm flex items-center justify-center text-indigo-600 shrink-0 border border-slate-100 shadow-inner">
                            <RefreshCcw size={28} />
                        </div>
                        <div>
                            <h3 className="font-black text-xl mb-3 uppercase italic tracking-tight">14-Day Clarity Window</h3>
                            <p className="text-slate-500 leading-relaxed font-medium text-sm">
                                We want MindHub to be your definitive Strategic OS. If the platform does not provide the operational clarity you expected, you are eligible for a full refund within <strong>14 days</strong> of your initial subscription purchase. 
                            </p>
                        </div>
                    </div>

                    {/* AI CREDIT EXCEPTION */}
                    <div className="p-10 rounded-[3.5rem] bg-slate-900 text-white flex flex-col md:flex-row gap-8 items-start shadow-2xl shadow-indigo-100">
                        <div className="h-16 w-16 rounded-[1.5rem] bg-white/10 flex items-center justify-center text-rose-400 shrink-0">
                            <ZapOff size={28} />
                        </div>
                        <div>
                            <h3 className="font-black text-xl mb-3 uppercase italic tracking-tight text-white">Strategic Credit Consumption</h3>
                            <p className="text-slate-400 leading-relaxed font-medium text-sm">
                                To prevent abuse of our AI models, refunds cannot be processed if more than <strong>2 Strategic AI Reports</strong> have been generated during the trial period. AI computational costs are non-refundable once the insights have been delivered to your dashboard.
                            </p>
                        </div>
                    </div>

                    {/* HOW TO REQUEST */}
                    <div className="p-10 rounded-[3.5rem] bg-slate-50 border border-slate-100 flex flex-col md:flex-row gap-8 items-start">
                        <div className="h-16 w-16 rounded-[1.5rem] bg-white shadow-sm flex items-center justify-center text-emerald-600 shrink-0 border border-slate-100">
                            <ShieldCheck size={28} />
                        </div>
                        <div>
                            <h3 className="font-black text-xl mb-3 uppercase italic tracking-tight">The Protocol</h3>
                            <p className="text-slate-500 leading-relaxed font-medium text-sm">
                                To initiate a refund, simply email our support team with your account identity (email). As we use authorized Merchants of Record (Paddle/Lemon Squeezy), the refund will be credited back to your original payment method within 5-10 business days.
                            </p>
                        </div>
                    </div>
                </div>

                {/* CALL TO ACTION / SUPPORT */}
                <div className="mt-20 p-10 bg-indigo-50/30 rounded-[3rem] text-center border border-indigo-100/50">
                    <Mail className="mx-auto text-indigo-600 mb-4" />
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-2">Request Assistance</p>
                    <p className="text-lg font-black text-slate-900">support@mindhub.website</p>
                    <div className="mt-6 flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
                        <Info size={14} /> Requests are processed within 24 operational hours.
                    </div>
                </div>
            </div>
            <div className="h-20" />
        </div>
    )
}
