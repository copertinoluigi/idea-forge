'use client'
import Link from 'next/link'
import { ArrowLeft, Scale, AlertTriangle, ShieldCheck, Coins, Mail } from "lucide-react" 

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 pt-32 pb-20 font-sans">
            <div className="fixed top-8 left-8 z-50">
                <Link href="/" className="group flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-all bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-slate-200 shadow-sm font-bold">
                    <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest italic">Back to Origin</span>
                </Link>
            </div>
            
            <div className="mx-auto max-w-3xl px-6">
                <div className="mb-16 text-center">
                    <div className="inline-flex items-center justify-center h-16 w-16 rounded-[2rem] bg-indigo-600 text-white mb-6 shadow-xl shadow-indigo-100">
                        <Scale size={32} />
                    </div>
                    <h1 className="text-5xl font-black tracking-tighter mb-4 italic uppercase">Terms of Service</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">Legal Framework Version 1.9.8</p>
                </div>

                <div className="bg-white rounded-[3.5rem] p-10 md:p-16 border border-slate-100 shadow-2xl shadow-slate-200/50 space-y-12 text-slate-600 leading-relaxed font-medium">
                    <section>
                        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-4 flex items-center gap-2 italic">
                            <span className="h-1.5 w-6 bg-indigo-600 rounded-full"></span> 1. Nature of Service
                        </h2>
                        <p>MindHub Protocol is a proprietary <strong>Business Intelligence and Data Visualization dashboard</strong> for managing project roadmaps and operational assets. By initializing your account, you acknowledge that MindHub is a decision-support tool and NOT a financial, accounting, or legal consultancy service. All strategic decisions, data entry, and compliance obligations remain the sole responsibility of the user.</p>
                    </section>
                    
                    <section>
                        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-4 flex items-center gap-2 italic">
                            <span className="h-1.5 w-6 bg-indigo-600 rounded-full"></span> 2. Sovereignty & Refunds
                        </h2>
                        <p>We stand by the quality of our OS. MindHub offers a <strong>14-day money-back guarantee</strong> (unless AI Credits have been extensively consumed). If the system does not provide the operational clarity you expected, you may request a refund by contacting our support team or through our authorized payment partners. Refunds are processed according to the terms of the Merchant of Record.</p>
                    </section>

                    <section className="p-8 bg-indigo-50/50 rounded-[2.5rem] border border-indigo-100">
                        <h2 className="text-lg font-black text-indigo-900 uppercase tracking-tight mb-4 flex items-center gap-2">
                            <Coins size={20} /> 3. Strategic Credit Economy
                        </h2>
                        <p className="text-sm text-indigo-700 font-medium">AI Insights (Strategic Analysis modules) are powered by a credit system. Credits included in subscription plans are renewed monthly, while top-up credits do not expire as long as the account remains active. We reserve the right to adjust credit consumption rates based on upstream computational costs.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-4 flex items-center gap-2 italic">
                            <span className="h-1.5 w-6 bg-indigo-600 rounded-full"></span> 4. User Responsibilities
                        </h2>
                        <p>Users are responsible for the accuracy of the data provided. Reverse engineering the "Vault Engine" logic, redistributing proprietary design patterns, or using the platform for any illegal activities or unauthorized financial intermediation will result in immediate termination of service.</p>
                    </section>

                    <section className="pt-6 border-t border-slate-100">
                        <div className="flex items-center gap-3 text-slate-900 font-bold text-sm mb-4">
                            <Mail size={18} className="text-indigo-600" /> Operational Support
                        </div>
                        <p className="text-sm">For legal inquiries or support requests regarding your "Node" or subscription, please contact us at: <span className="font-bold text-indigo-600">support@mindhub.website</span></p>
                    </section>

                    <div className="p-8 bg-red-50 border border-red-100 rounded-[2.5rem] flex gap-4">
                        <AlertTriangle className="text-red-600 shrink-0" />
                        <div className="text-xs font-bold text-red-900 uppercase tracking-tight leading-relaxed">
                            Limitation of Liability: MindHub is a data visualization software. We are not liable for business results, tax discrepancies, or data management errors. Users must consult certified professionals for legal, tax, or official financial advice.
                        </div>
                    </div>
                </div>
            </div>
            <div className="h-20" />
        </div>
    )
}
