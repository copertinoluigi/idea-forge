'use client'

import { cn } from '@/lib/utils'
import { Sparkles, User } from 'lucide-react'

interface MessageProps {
  message: {
    id: string
    content: string
    is_system: boolean
    created_at: string
    profiles?: { display_name?: string; first_name?: string } | null
  }
  isOwn: boolean
  showAvatar: boolean
}

export default function ChatMessage({ message, isOwn, showAvatar }: MessageProps) {
  const time = new Date(message.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
  const senderName = message.is_system ? 'AI Assistant' : (message.profiles?.first_name || message.profiles?.display_name || 'User')

  return (
    <div className={cn("flex gap-3 group", !showAvatar && "pl-11", message.is_system ? "items-start" : "items-start")}>
      {showAvatar && (
        <div className={cn(
          "h-8 w-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-black shadow-sm",
          message.is_system
            ? "bg-gradient-to-br from-primary to-blue-600 text-white"
            : "bg-slate-100 text-slate-500 border border-slate-200"
        )}>
          {message.is_system ? <Sparkles size={14} /> : <User size={14} />}
        </div>
      )}

      <div className="flex-1 min-w-0">
        {showAvatar && (
          <div className="flex items-center gap-2 mb-1">
            <span className={cn(
              "text-[10px] font-black uppercase tracking-widest",
              message.is_system ? "text-primary" : "text-slate-500"
            )}>
              {senderName}
            </span>
            <span className="text-[9px] text-slate-300 font-medium">{time}</span>
          </div>
        )}

        <div className={cn(
          "text-sm leading-relaxed rounded-2xl px-4 py-3 inline-block max-w-full",
          message.is_system
            ? "bg-primary/5 border border-primary/10 text-slate-800"
            : isOwn
              ? "bg-slate-900 text-white"
              : "bg-slate-100 text-slate-800"
        )}>
          <MessageContent content={message.content} isSystem={message.is_system} />
        </div>
      </div>
    </div>
  )
}

function MessageContent({ content, isSystem }: { content: string; isSystem: boolean }) {
  if (!isSystem) {
    return <p className="whitespace-pre-wrap break-words">{content}</p>
  }

  // Simple markdown rendering for AI messages
  const parts = content.split(/(```[\s\S]*?```)/g)

  return (
    <div className="prose prose-sm max-w-none prose-slate prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none">
      {parts.map((part, i) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const lines = part.slice(3, -3).split('\n')
          const lang = lines[0].trim()
          const code = lang ? lines.slice(1).join('\n') : lines.join('\n')
          return (
            <div key={i} className="relative my-3 rounded-xl overflow-hidden border border-slate-200 bg-slate-900">
              {lang && (
                <div className="px-4 py-1.5 bg-slate-800 text-[9px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-700">
                  {lang}
                </div>
              )}
              <pre className="p-4 overflow-x-auto text-xs leading-relaxed">
                <code className="text-slate-200 !bg-transparent !p-0">{code}</code>
              </pre>
            </div>
          )
        }

        // Render inline markdown
        return (
          <div key={i} className="whitespace-pre-wrap break-words">
            {part.split('\n').map((line, j) => {
              // Headers
              if (line.startsWith('### ')) return <h4 key={j} className="text-xs font-black mt-3 mb-1 text-slate-700">{line.slice(4)}</h4>
              if (line.startsWith('## ')) return <h3 key={j} className="text-sm font-black mt-4 mb-1.5 text-slate-800">{line.slice(3)}</h3>
              if (line.startsWith('# ')) return <h2 key={j} className="text-base font-black mt-4 mb-2 text-slate-900">{line.slice(2)}</h2>

              // Lists
              if (line.match(/^[-*] /)) {
                return <div key={j} className="flex gap-2 py-0.5"><span className="text-primary shrink-0">•</span><span>{renderInline(line.slice(2))}</span></div>
              }
              if (line.match(/^\d+\. /)) {
                const num = line.match(/^(\d+)\. /)
                return <div key={j} className="flex gap-2 py-0.5"><span className="text-primary font-bold shrink-0">{num?.[1]}.</span><span>{renderInline(line.replace(/^\d+\. /, ''))}</span></div>
              }

              // Empty line
              if (line.trim() === '') return <div key={j} className="h-2" />

              // Regular paragraph
              return <p key={j} className="py-0.5">{renderInline(line)}</p>
            })}
          </div>
        )
      })}
    </div>
  )
}

function renderInline(text: string) {
  // Bold
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) {
      return <strong key={i} className="font-bold">{p.slice(2, -2)}</strong>
    }
    // Inline code
    const codeParts = p.split(/(`[^`]+`)/g)
    return codeParts.map((cp, j) => {
      if (cp.startsWith('`') && cp.endsWith('`')) {
        return <code key={`${i}-${j}`} className="text-primary bg-primary/10 px-1 py-0.5 rounded text-xs font-mono">{cp.slice(1, -1)}</code>
      }
      // Italic
      const italicParts = cp.split(/(\*[^*]+\*)/g)
      return italicParts.map((ip, k) => {
        if (ip.startsWith('*') && ip.endsWith('*') && !ip.startsWith('**')) {
          return <em key={`${i}-${j}-${k}`}>{ip.slice(1, -1)}</em>
        }
        return <span key={`${i}-${j}-${k}`}>{ip}</span>
      })
    })
  })
}
