'use client'

import { useState, useEffect } from 'react'
import { getRoomSummaries } from '@/app/actions-rooms'
import { X, BookOpen, Sparkles, FileText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Summary {
  id: string
  title: string
  content: string
  created_at: string
}

interface SummarySidebarProps {
  roomId: string
  onClose: () => void
  onGenerate: (mode: 'snapshot' | 'simple') => Promise<{ title: string; content: string } | null>
}

export default function SummarySidebar({ roomId, onClose, onGenerate }: SummarySidebarProps) {
  const [summaries, setSummaries] = useState<Summary[]>([])
  const [selectedSummary, setSelectedSummary] = useState<Summary | null>(null)
  const [generating, setGenerating] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const data = await getRoomSummaries(roomId)
      setSummaries(data)
      setLoading(false)
    }
    load()
  }, [roomId])

  const handleGenerate = async (mode: 'snapshot' | 'simple') => {
    setGenerating(true)
    const result = await onGenerate(mode)
    if (result) {
      // Reload summaries
      const data = await getRoomSummaries(roomId)
      setSummaries(data)
    }
    setGenerating(false)
  }

  return (
    <div className="w-80 lg:w-96 border-l border-slate-200 bg-slate-50 flex flex-col h-full shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen size={16} className="text-primary" />
          <h3 className="font-black text-xs uppercase tracking-widest text-slate-900">Summaries</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0">
          <X size={14} />
        </Button>
      </div>

      {/* Generate Buttons */}
      <div className="p-4 space-y-2 border-b border-slate-200">
        <Button
          onClick={() => handleGenerate('snapshot')}
          disabled={generating}
          className="w-full h-10 rounded-xl text-[10px] font-black uppercase tracking-widest"
        >
          {generating ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Sparkles size={14} className="mr-2" />}
          Generate Snapshot
        </Button>
        <Button
          onClick={() => handleGenerate('simple')}
          disabled={generating}
          variant="outline"
          className="w-full h-10 rounded-xl text-[10px] font-black uppercase tracking-widest"
        >
          {generating ? <Loader2 size={14} className="mr-2 animate-spin" /> : <FileText size={14} className="mr-2" />}
          Quick Recap
        </Button>
      </div>

      {/* Summary List or Detail */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
          </div>
        ) : selectedSummary ? (
          <div className="p-4">
            <button
              onClick={() => setSelectedSummary(null)}
              className="text-[10px] font-bold text-primary uppercase tracking-widest mb-4 hover:underline"
            >
              ← Back to list
            </button>
            <h4 className="font-black text-sm text-slate-900 mb-1">{selectedSummary.title}</h4>
            <p className="text-[10px] text-slate-400 mb-4">
              {new Date(selectedSummary.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
            <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap text-xs leading-relaxed">
              {selectedSummary.content}
            </div>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {summaries.length === 0 ? (
              <div className="text-center py-10 px-4">
                <BookOpen className="h-8 w-8 text-slate-200 mx-auto mb-3" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No summaries yet</p>
                <p className="text-[10px] text-slate-300 mt-1">Generate a snapshot from the conversation above.</p>
              </div>
            ) : (
              summaries.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSummary(s)}
                  className="w-full text-left p-3 rounded-xl hover:bg-white border border-transparent hover:border-slate-200 transition-all"
                >
                  <p className="text-xs font-bold text-slate-800 truncate">{s.title}</p>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{s.content.substring(0, 120)}...</p>
                  <p className="text-[9px] text-slate-300 mt-1.5">
                    {new Date(s.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                  </p>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
