import { format } from 'date-fns';
import { CheckCircle2 } from 'lucide-react';
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
  if (message.is_system) {
    return (
      <div className="flex justify-center my-2 w-full px-4">
        <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl px-4 py-2 text-[11px] text-gray-300 text-center leading-relaxed max-w-[90%] font-medium">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`flex w-full ${isOwn ? 'justify-end' : 'justify-start'} mb-1 transition-all ${isSelectionMode ? 'cursor-pointer' : ''}`}
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
          <div className={`rounded-2xl px-4 py-2.5 shadow-sm ${
            isOwn 
              ? 'bg-violet-600 text-white rounded-br-none' 
              : 'bg-gray-900 text-gray-100 rounded-bl-none border border-gray-800'
          }`}>
            <p className="text-[14px] md:text-sm whitespace-pre-wrap break-words leading-snug">{message.content}</p>
            <p className={`text-[9px] mt-1 opacity-50 ${isOwn ? 'text-violet-100' : 'text-gray-500'}`}>
              {format(new Date(message.created_at), 'HH:mm')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
