import { cookies } from "next/headers"
import Link from 'next/link'
import { getDictionary } from "@/lib/translations"
import { Mail, ArrowLeft, Globe, Zap, ShieldCheck } from "lucide-react"
import ContactForm from "./ContactForm"

export default async function ContactPage() {
    const lang = (await (await cookies()).get('mindhub_locale')?.value) || 'en'
    const dict = getDictionary(lang).contact

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 pt-32 pb-20">
            <div className="fixed top-8 left-8 z-50">
                <Link href="/" className="group flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-all bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm">
                    <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Return Home</span>
                </Link>
            </div>
            
            <div className="mx-auto max-w-4xl px-6">
                <div className="grid lg:grid-cols-2 gap-20 items-center">
                    <div>
                        <div className="h-16 w-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white mb-8 shadow-xl shadow-indigo-100">
                            <ShieldCheck size={32} />
                        </div>
                        <h1 className="text-5xl font-black mb-6 italic tracking-tighter uppercase leading-none text-slate-900">Connect with <br/><span className="text-indigo-600">Our Node.</span></h1>
                        <p className="text-lg text-slate-500 font-medium leading-relaxed mb-10">
                            Whether you're a founder seeking technical support or an architect looking for partnership, our node is standing by.
                        </p>
                        <div className="space-y-6">
                            <div className="flex gap-4 items-center">
                                <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-indigo-600"><Mail size={20} /></div>
                                <div className="text-sm font-black text-slate-900 tracking-tight italic uppercase">info@mindhub.website</div>
                            </div>
                            <div className="flex gap-4 items-center">
                                <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-indigo-600"><Globe size={20} /></div>
                                <div className="text-sm font-black text-slate-900 tracking-tight italic uppercase tracking-widest">MindHub Protocol Global</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-[3.5rem] p-10 md:p-12 shadow-2xl shadow-indigo-100/50">
                        <ContactForm dict={dict} />
                    </div>
                </div>
            </div>
        </div>
    )
}
