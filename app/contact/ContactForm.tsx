'use client'
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Send, Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { submitContactForm } from "@/app/actions"

export default function ContactForm({ dict }: { dict: any }) {
    const [isPending, setIsPending] = useState(false)

    async function handleSubmit(formData: FormData) {
        setIsPending(true)
        try {
            const result = await submitContactForm(formData)
            if (result?.success) {
                toast.success(dict.success || "Identity verified. Message sent.")
                const form = document.querySelector('form') as HTMLFormElement
                form?.reset()
            } else {
                toast.error(result?.error || "Error transmitting message.")
            }
        } catch (error) {
            toast.error("Network disruption. Try again.")
        } finally {
            setIsPending(false)
        }
    }

    return (
        <form action={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Identity Name</label>
                <input name="name" required placeholder="Elon" className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold placeholder:text-slate-300" />
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Master Email</label>
                <input name="email" type="email" required placeholder="founder@ecosystem.com" className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold placeholder:text-slate-300" />
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Strategic Message</label>
                <textarea name="message" required rows={4} placeholder="Describe your inquiry..." className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold placeholder:text-slate-300" />
            </div>
            <Button type="submit" disabled={isPending} className="w-full h-16 bg-indigo-600 hover:bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-200 transition-all active:scale-95">
                {isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
                Send Transmission
            </Button>
        </form>
    )
}
