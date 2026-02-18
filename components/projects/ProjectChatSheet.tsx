"use client"

import React, { useState, useEffect, useRef } from "react"
import { MessageSquare, Send, Sparkles, Loader2, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"
import { getProjectMessages, sendProjectMessage } from "@/app/actions-chat"
import { generateChatSummary } from "@/app/actions-ai"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

interface ProjectChatSheetProps {
    projectId: string
    projectTitle: string
    userId: string
    active: boolean
}

export function ProjectChatSheet({ projectId, projectTitle, userId, active }: ProjectChatSheetProps) {
    const supabase = createClient()
    const [messages, setMessages] = useState<any[]>([])
    const [newMessage, setNewMessage] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isSummarizing, setIsSummarizing] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [showAIConfirm, setShowAIConfirm] = useState(false)
    
    const scrollRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const loadMessages = async () => {
        setIsLoading(true)
        try {
            const data = await getProjectMessages(projectId)
            setMessages(data || [])
        } catch (error) { console.error(error) }
        setIsLoading(false)
    }

    const getNameColor = (uId: string) => {
        const colors = ['text-blue-600', 'text-emerald-600', 'text-orange-600', 'text-rose-600', 'text-purple-600', 'text-cyan-600'];
        const index = uId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[index % colors.length];
    }

    const formatDisplayName = (profile: any) => {
        if (!profile) return "USER"
        const first = profile.first_name || ""
        const last = profile.last_name || ""
        return (first && last) ? `${first} ${last.charAt(0).toUpperCase()}.` : "USER"
    }

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return
        const content = newMessage
        setNewMessage("")
        await sendProjectMessage(projectId, content)
        await loadMessages()
    }

    const executeAISummary = async () => {
        setShowAIConfirm(false)
        setIsSummarizing(true)
        try {
            await generateChatSummary(projectId)
            toast.success("AI Strategic Summary added")
            await loadMessages()
        } catch { toast.error("AI Error") }
        setIsSummarizing(false)
    }

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setIsUploading(true)
        try {
            const fileName = `${projectId}/${Date.now()}`
            const { data } = await supabase.storage.from('chat-attachments').upload(fileName, file)
            if (data) {
                const { data: { publicUrl } } = supabase.storage.from('chat-attachments').getPublicUrl(fileName)
                await sendProjectMessage(projectId, "Sent an image", 'human', publicUrl)
                await loadMessages()
            }
        } catch (error) { toast.error("Upload failed") }
        setIsUploading(false)
    }

    useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight }, [messages])

    return (
        <>
        <Sheet onOpenChange={(o) => o && loadMessages()}>
            <SheetTrigger asChild>
                <Button variant="outline" className={cn(
                    "flex flex-col items-center justify-center h-20 rounded-2xl border-2 transition-all w-full bg-white shadow-sm",
                    active ? "border-indigo-600 text-indigo-600" : "border-slate-100 text-slate-400 hover:border-slate-200"
                )}>
                    <MessageSquare size={20} className="mb-1" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Chat Nexus</span>
                </Button>
            </SheetTrigger>

            <SheetContent side="right" className="w-full md:max-w-[50vw] flex flex-col p-0 border-l border-slate-200 h-[100dvh] z-[100] bg-white text-slate-900">
                <SheetHeader className="p-6 border-b bg-white shrink-0">
                    <SheetTitle className="text-2xl font-black italic uppercase text-slate-900 tracking-tighter leading-none">Nexus Chat</SheetTitle>
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-1 opacity-70">{projectTitle}</p>
                </SheetHeader>

                <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
                    {messages.map((m) => {
                        const isMe = m.user_id === userId;
                        const isAI = m.message_type === 'ai_summary';
                        return (
                            <div key={m.id} className={cn("flex flex-col max-w-[85%] transition-all", isAI ? "mx-auto w-full" : isMe ? "ml-auto items-end" : "mr-auto items-start")}>
                                {!isAI && (
                                    <span className={cn("text-[10px] font-black uppercase tracking-widest mb-1 px-1", isMe ? "text-indigo-600" : getNameColor(m.user_id))}>
                                        {formatDisplayName(m.profiles)}
                                    </span>
                                )}
                                <div className={cn("p-4 rounded-2xl shadow-sm border", isAI ? "bg-indigo-900 text-white border-none w-full" : isMe ? "bg-indigo-50 border-indigo-100 text-slate-900 rounded-tr-none" : "bg-white border-slate-200 text-slate-900 rounded-tl-none")}>
                                    {m.image_url && <img src={m.image_url} className="mb-3 rounded-lg border border-black/5 max-h-80 w-full object-cover" />}
                                    <p className="text-[13px] font-medium leading-relaxed whitespace-pre-wrap">{m.content}</p>
                                    <div className="mt-2 text-[8px] font-bold opacity-20 uppercase tracking-tighter">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                <div className="p-6 border-t bg-white shrink-0">
                    <textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSendMessage() }} placeholder="Message team... (Ctrl+Enter)" className="w-full h-24 bg-slate-50 rounded-2xl p-4 text-sm font-medium border border-slate-100 focus:border-indigo-500 outline-none resize-none mb-4 text-slate-900" />
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={() => setShowAIConfirm(true)} className="h-10 text-[10px] font-black text-indigo-600 border-indigo-100 hover:bg-indigo-50 gap-2 uppercase tracking-tighter"><Sparkles size={14} /> AI</Button>
                            <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" accept="image/*" />
                            <Button variant="ghost" onClick={() => fileInputRef.current?.click()} className="h-10 w-10 p-0 text-slate-400 hover:text-slate-900" disabled={isUploading}>{isUploading ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={22} />}</Button>
                        </div>
                        <Button onClick={handleSendMessage} disabled={!newMessage.trim()} className="h-12 px-8 bg-slate-900 text-white font-black uppercase italic tracking-tighter rounded-xl hover:bg-indigo-600 shadow-lg">Send <Send size={16} className="ml-2" /></Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>

        {/* FIX: Dialog ora ha z-index superiore allo Sheet */}
        <Dialog open={showAIConfirm} onOpenChange={setShowAIConfirm}>
            <DialogContent className="rounded-[2.5rem] p-8 z-[150]"> 
                <DialogHeader className="items-center text-center">
                    <Sparkles className="text-indigo-600 h-10 w-10 mb-2" />
                    <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">AI Analysis</DialogTitle>
                    <DialogDescription className="font-medium pt-2 text-slate-500">Generating a summary costs **1 Credit**. Analyze team activity?</DialogDescription>
                </DialogHeader>
                <DialogFooter className="sm:justify-center gap-2 pt-4">
                    <Button variant="ghost" onClick={() => setShowAIConfirm(false)} className="font-bold uppercase tracking-widest text-[10px]">Cancel</Button>
                    <Button onClick={executeAISummary} className="bg-slate-900 text-white px-8 font-black uppercase italic tracking-tighter rounded-xl">Execute</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    )
}
