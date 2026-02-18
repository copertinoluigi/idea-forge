'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
    Trash2, Lock, Globe, StickyNote, Send, 
    Loader2, ChevronDown, MessageSquarePlus 
} from 'lucide-react'
import { addProjectNoteAction, deleteProjectNoteAction, getPaginatedNotes } from '@/app/actions'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ProjectNotesProps {
    projectId: string
    initialNotes: any[]
    dict: any
}

export default function ProjectNotes({ projectId, initialNotes, dict }: ProjectNotesProps) {
    const [notes, setNotes] = useState(initialNotes)
    const [content, setContent] = useState('')
    const [isPublic, setIsPublic] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const [hasMore, setHasMore] = useState(initialNotes.length === 20)

    useEffect(() => {
        setNotes(initialNotes)
        setHasMore(initialNotes.length === 20)
    }, [initialNotes])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!content.trim()) return
        setIsSubmitting(true)
        
        try {
            const formData = new FormData()
            formData.append('projectId', projectId)
            formData.append('content', content)
            formData.append('isPublic', String(isPublic))
            
            await addProjectNoteAction(formData)
            setContent('')
            toast.success("Strategic update recorded")
        } catch (error) {
            toast.error("Failed to save note")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleLoadMore = async () => {
        setIsLoadingMore(true)
        try {
            const nextNotes = await getPaginatedNotes(projectId, notes.length)
            if (nextNotes.length < 20) setHasMore(false)
            setNotes([...notes, ...nextNotes])
        } catch (error) {
            toast.error("Error loading more")
        } finally {
            setIsLoadingMore(false)
        }
    }

    const handleDelete = async (noteId: string) => {
        try {
            await deleteProjectNoteAction(noteId, projectId)
            setNotes(notes.filter(n => n.id !== noteId))
            toast.success("Note deleted")
        } catch (error) {
            toast.error("Delete failed")
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                    <StickyNote className="h-6 w-6 text-indigo-600" /> 
                    {dict.title || "Project Ledger"}
                </h3>
                <span className="text-[10px] font-black bg-slate-100 px-3 py-1 rounded-full text-slate-500 uppercase tracking-widest">
                    {notes.length} RECORDS
                </span>
            </div>

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-[2rem] border-2 border-slate-100 shadow-sm focus-within:border-indigo-500 transition-all">
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={dict.placeholder}
                    className="w-full min-h-[100px] p-2 text-sm font-medium bg-transparent outline-none resize-none text-slate-800"
                />
                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setIsPublic(!isPublic)}>
                        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center transition-all", isPublic ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400")}>
                            {isPublic ? <Globe size={16} /> : <Lock size={16} />}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">{isPublic ? "Public Access" : "Architect Only"}</span>
                    </div>
                    <Button disabled={isSubmitting || !content.trim()} className="bg-slate-950 text-white rounded-xl px-8 h-12 font-black uppercase italic tracking-tighter shadow-lg">
                        {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : "Save Note"}
                    </Button>
                </div>
            </form>

            <div className="space-y-4">
                {notes.map((note) => (
                    <div key={note.id} className="bg-white border border-slate-100 p-6 rounded-[1.8rem] hover:border-indigo-100 transition-all group">
                        <div className="flex justify-between items-start mb-2">
                            <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded-full border tracking-tighter", note.is_public ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-200')}>
                                {note.is_public ? "Public Access" : "Private Record"}
                            </span>
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-bold text-slate-300">
                                    {new Date(note.created_at).toLocaleDateString()}
                                </span>
                                <button onClick={() => handleDelete(note.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-600 p-1">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                        <p className="text-sm font-medium text-slate-700 whitespace-pre-wrap leading-relaxed">{note.content}</p>
                    </div>
                ))}
            </div>

            {hasMore && (
                <Button onClick={handleLoadMore} disabled={isLoadingMore} className="w-full h-14 rounded-2xl bg-slate-50 text-slate-400 font-black uppercase text-[10px] border-2 border-dashed border-slate-200 mt-4">
                    {isLoadingMore ? <Loader2 className="animate-spin h-4 w-4" /> : "Load more updates"}
                </Button>
            )}
        </div>
    )
}
