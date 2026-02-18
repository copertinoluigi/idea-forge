'use client'
import Link from 'next/link'
import { ArrowLeft, Lock, EyeOff, ShieldAlert, Database, UserCheck, Mail, CreditCard } from "lucide-react" 

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-white text-slate-900 pt-32 pb-20 font-sans">
            <div className="fixed top-8 left-8 z-50">
                <Link href="/" className="group flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-all bg-slate-50 px-4 py-2 rounded-full border border-slate-100 shadow-sm font-bold">
                    <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest italic">Hub Origin</span>
                </Link>
            </div>

            <div className="mx-auto max-w-4xl px-6">
                <div className="mb-20 text-center">
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4 italic uppercase text-slate-900 leading-none">Privacy <br/>Protocol.</h1>
                    <p className="text-indigo-600 font-black uppercase tracking-[0.4em] text-[10px]">The Sovereignty Standard — v1.9.8</p>
                </div>

                <div className="grid gap-8">
                    {/* INFRASTRUCTURE */}
                    <div className="p-10 rounded-[3.5rem] bg-slate-50 border border-slate-100 flex flex-col md:flex-row gap-8 items-start hover:bg-white hover:shadow-2xl transition-all duration-500">
                        <div className="h-16 w-16 rounded-[1.5rem] bg-white shadow-sm flex items-center justify-center text-indigo-600 shrink-0 border border-slate-100 shadow-inner"><Database size={28} /></div>
                        <div>
                            <h3 className="font-black text-xl mb-3 uppercase italic tracking-tight">Data Isolation & Sovereignty</h3>
                            <p className="text-slate-500 leading-relaxed font-medium text-sm">
                                MindHub is built on the principle of manual sovereignty. <strong>We do not connect to your bank accounts</strong> or use third-party scraping bots. We collect minimal identity data (Email) and operational metadata (Project titles, task descriptions, and manual resource entries). Your data is hosted on Supabase with enterprise-grade encryption-at-rest.
                            </p>
                        </div>
                    </div>

                    {/* AI PROCESSING */}
                    <div className="p-10 rounded-[3.5rem] bg-slate-900 text-white flex flex-col md:flex-row gap-8 items-start shadow-2xl shadow-indigo-100">
                        <div className="h-16 w-16 rounded-[1.5rem] bg-white/10 flex items-center justify-center text-indigo-400 shrink-0"><EyeOff size={28} /></div>
                        <div>
                            <h3 className="font-black text-xl mb-3 uppercase italic tracking-tight text-white">AI Neurality & Privacy</h3>
                            <p className="text-slate-400 leading-relaxed font-medium text-sm">
                                Strategic audits are processed via OpenAI's API. Under our zero-retention protocol, <strong>your data is never used to train global LLM models</strong>. The processing is ephemeral: the AI "reads" the operational snapshot you provide, generates the report, and immediately discards the context.
                            </p>
                        </div>
                    </div>

                    {/* PAYMENT SECURITY (Obbligatoria per Paddle) */}
                    <div className="p-10 rounded-[3.5rem] bg-slate-50 border border-slate-100 flex flex-col md:flex-row gap-8 items-start hover:bg-white transition-all">
                        <div className="h-16 w-16 rounded-[1.5rem] bg-white shadow-sm flex items-center justify-center text-emerald-600 shrink-0 border border-slate-100"><CreditCard size={28} /></div>
                        <div>
                            <h3 className="font-black text-xl mb-3 uppercase italic tracking-tight">Secure Transaction Layer</h3>
                            <p className="text-slate-500 leading-relaxed font-medium text-sm">
                                We do not store credit card details on our servers. All payments are handled by our authorized Merchant of Record (Paddle/Lemon Squeezy). They collect billing information necessary for tax compliance and fraud prevention according to global financial regulations.
                            </p>
                        </div>
                    </div>

                    {/* GDPR / DELETION */}
                    <div className="p-10 rounded-[3.5rem] bg-slate-50 border border-slate-100 flex flex-col md:flex-row gap-8 items-start">
                        <div className="h-16 w-16 rounded-[1.5rem] bg-white shadow-sm flex items-center justify-center text-red-500 shrink-0 border border-slate-100"><ShieldAlert size={28} /></div>
                        <div>
                            <h3 className="font-black text-xl mb-3 uppercase italic tracking-tight">Right to Self-Destruction</h3>
                            <p className="text-slate-500 leading-relaxed font-medium text-sm">
                                GDPR compliance is native to MindHub. You have the total right to "Self-Destruction". A single command in your Settings triggers a full, irreversible wipe of your entire ecosystem, including projects, assets, and profile records. We do not keep "ghost" data.
                            </p>
                        </div>
                    </div>
                </div>

                {/* CONTACT BOX */}
                <div className="mt-20 p-10 bg-slate-50 rounded-[3rem] text-center border border-slate-100">
                    <Mail className="mx-auto text-indigo-600 mb-4" />
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Data Protection Office</p>
                    <p className="text-sm font-black text-slate-900">support@mindhub.website</p>
                </div>
            </div>
            <div className="h-20" />
        </div>
    )
}
