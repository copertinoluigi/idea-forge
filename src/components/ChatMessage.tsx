import { format, isToday, isYesterday } from 'date-fns';
import { it } from 'date-fns/locale';
import { CheckCircle2, Bot, Copy, Terminal, Check } from 'lucide-react';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Database } from '@/lib/database.types';

type Message = Database['public']['Tables']['messages']['Row'] & {
  profiles: { display_name: string } | null;
};

interface ChatMessageProps {
  message: Message;
  isOwn: boolean;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
}

export function ChatMessage({ message, isOwn, isSelectionMode, isSelected, onSelect }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- RENDERING DEI BLOCCHI DI CODICE ---
  const components = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      const codeContent = String(children).replace(/\n$/, '');

      return !inline ? (
        <div className="relative my-4 group/code w-full">
          <div className="absolute right-3 top-3 opacity-0 group-hover/code:opacity-100 transition-opacity z-10">
            <button
              onClick={() => copyToClipboard(codeContent)}
              className="p-1.5 rounded-md bg-gray-800 border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-800/80 border-b border-gray-700 rounded-t-xl">
            <Terminal className="h-3.5 w-3.5 text-violet-400" />
            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
              {match ? match[1] : 'code'}
            </span>
          </div>
          <pre className="p-4 bg-black/50 overflow-x-auto rounded-b-xl border-x border-b border-gray-700 custom-scrollbar">
            <code className="text-xs font-mono text-violet-100" {...props}>
              {children}
            </code>
          </pre>
        </div>
      ) : (
        <code className="px-1.5 py-0.5 bg-gray-800 rounded text-violet-300 font-mono text-[13px]" {...props}>
          {children}
        </code>
      );
    }
  };

  if (message.is_system) {
    return (
      <div 
        className={`flex w-full justify-start mb-8 transition-all ${isSelectionMode ? 'cursor-pointer hover:scale-[1.01]' : ''}`}
        onClick={() => isSelectionMode && onSelect?.(message.id)}
      >
        <div className="flex items-start gap-3 max-w-[98%] md:max-w-[85%] w-full">
          {isSelectionMode && (
            <div className={`mt-4 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
              isSelected ? 'bg-violet-500 border-violet-500 scale-110 shadow-lg shadow-violet-500/20' : 'border-gray-700'
            }`}>
              {isSelected && <CheckCircle2 className="h-4 w-4 text-white" />}
            </div>
          )}
          
          <div className="flex flex-col items-start w-full">
            <div className="flex items-center gap-2 mb-2 px-1">
              <div className="bg-violet-600/20 p-1.5 rounded-lg border border-violet-500/20">
                <Bot className="h-4 w-4 text-violet-400" />
              </div>
              <span className="text-[10px] text-violet-400 font-black uppercase tracking-widest antialiased">
                BYOI Intelligence
              </span>
            </div>

            <div className="rounded-2xl px-5 py-4 bg-gray-900/40 border border-gray-800/60 text-gray-200 shadow-2xl backdrop-blur-sm w-full">
              <div className="prose prose-invert prose-sm max-w-none 
                prose-p:leading-relaxed prose-p:text-gray-300 prose-p:mb-4 last:prose-p:mb-0
                prose-headings:text-white prose-headings:font-black prose-headings:tracking-tight
                prose-ul:list-disc prose-ul:pl-5
                prose-strong:text-violet-400 prose-strong:font-bold">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                  {message.content}
                </ReactMarkdown>
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-800/50">
                <span className="text-[9px] text-gray-600 font-mono uppercase tracking-widest font-bold">
                  {format(new Date(message.created_at), 'HH:mm')}
                </span>
                <div className="h-1 w-1 rounded-full bg-violet-500/30" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`flex w-full ${isOwn ? 'justify-end' : 'justify-start'} mb-4 transition-all ${isSelectionMode ? 'cursor-pointer hover:scale-[1.01]' : ''}`}
      onClick={() => isSelectionMode && onSelect?.(message.id)}
    >
      <div className={`flex items-start gap-3 max-w-[92%] md:max-w-[80%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
        {isSelectionMode && (
          <div className={`mt-3 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
            isSelected ? 'bg-violet-500 border-violet-500 scale-110 shadow-lg shadow-violet-500/20' : 'border-gray-700'
          }`}>
            {isSelected && <CheckCircle2 className="h-4 w-4 text-white" />}
          </div>
        )}
        
        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
          {!isOwn && (
            <span className="text-[10px] text-violet-400 font-black mb-1.5 px-2 uppercase tracking-widest antialiased">
              {message.profiles?.display_name || 'Collaboratore'}
            </span>
          )}
          <div className={`rounded-2xl px-4 py-3 shadow-xl ${
            isOwn 
              ? 'bg-violet-600 text-white rounded-br-none shadow-violet-900/20' 
              : 'bg-gray-800/80 text-gray-100 rounded-bl-none border border-gray-700 shadow-black/20 backdrop-blur-sm'
          }`}>
            <p className="text-[15px] md:text-sm whitespace-pre-wrap break-words leading-relaxed font-medium antialiased">
              {message.content}
            </p>
            <p className={`text-[9px] mt-1.5 font-bold opacity-40 ${isOwn ? 'text-violet-100' : 'text-gray-500'}`}>
              {format(new Date(message.created_at), 'HH:mm')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
