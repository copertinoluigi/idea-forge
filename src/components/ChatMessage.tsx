import { format } from 'date-fns';
import { CheckCircle2, Bot } from 'lucide-react';
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
  // --- LOGICA MESSAGGIO AI (SYSTEM) ---
  if (message.is_system) {
    return (
      <div 
        className={`flex w-full justify-start mb-6 transition-all ${isSelectionMode ? 'cursor-pointer opacity-80' : ''}`}
        onClick={() => isSelectionMode && onSelect?.(message.id)}
      >
        <div className="flex items-start gap-3 max-w-[95%] md:max-w-[85%]">
          {isSelectionMode && (
            <div className={`mt-3 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
              isSelected ? 'bg-violet-500 border-violet-500' : 'border-gray-700'
            }`}>
              {isSelected && <CheckCircle2 className="h-3 w-3 text-white" />}
            </div>
          )}
          
          <div className="flex flex-col items-start w-full">
            <div className="flex items-center gap-2 mb-1.5 px-1">
              <div className="bg-violet-500/20 p-1 rounded">
                <Bot className="h-3 w-3 text-violet-400" />
              </div>
              <span className="text-[10px] text-violet-400 font-black uppercase tracking-widest">BYOI Intelligence</span>
            </div>

            <div className="rounded-2xl px-4 py-3 bg-gray-900/50 border border-gray-800 text-gray-200 shadow-sm w-full overflow-hidden">
              <div className="prose prose-invert prose-sm max-w-none 
                prose-p:leading-relaxed prose-p:mb-3 last:prose-p:mb-0
                prose-headings:text-white prose-headings:font-bold prose-headings:mb-2
                prose-ul:list-disc prose-ul:pl-4 prose-li:mb-1
                prose-table:border prose-table:border-gray-700 prose-th:bg-gray-800 prose-th:p-2 prose-td:p-2 prose-td:border-t prose-td:border-gray-800">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content}
                </ReactMarkdown>
              </div>
              <p className="text-[9px] mt-3 opacity-30 font-mono">
                {format(new Date(message.created_at), 'HH:mm')}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- LOGICA MESSAGGIO UTENTE (HUMAN) ---
  return (
    <div 
      className={`flex w-full ${isOwn ? 'justify-end' : 'justify-start'} mb-4 transition-all ${isSelectionMode ? 'cursor-pointer' : ''}`}
      onClick={() => isSelectionMode && onSelect?.(message.id)}
    >
      <div className={`flex items-start gap-2 max-w-[92%] md:max-w-[80%] ${isOwn ? 'flex-row-reverse text-right' : 'flex-row text-left'}`}>
        {isSelectionMode && (
          <div className={`mt-3 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
            isSelected ? 'bg-violet-500 border-violet-500' : 'border-gray-700'
          }`}>
            {isSelected && <CheckCircle2 className="h-3 w-3 text-white" />}
          </div>
        )}
        
        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
          {!isOwn && (
            <span className="text-[10px] text-violet-400 font-black mb-1 px-1 uppercase tracking-tighter">
              {message.profiles?.display_name || 'Anon'}
            </span>
          )}
          <div className={`rounded-2xl px-4 py-2.5 shadow-md ${
            isOwn 
              ? 'bg-violet-600 text-white rounded-br-none shadow-violet-900/20' 
              : 'bg-gray-800 text-gray-100 rounded-bl-none border border-gray-700'
          }`}>
            <p className="text-[15px] md:text-sm whitespace-pre-wrap break-words leading-relaxed font-medium">
              {message.content}
            </p>
            <p className={`text-[9px] mt-1 opacity-50 ${isOwn ? 'text-violet-100' : 'text-gray-500'}`}>
              {format(new Date(message.created_at), 'HH:mm')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
