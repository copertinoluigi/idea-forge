import { format } from 'date-fns';
import { CheckCircle2 } from 'lucide-react';
import type { Database } from '@/lib/database.types';

type Message = Database['public']['Tables']['messages']['Row'] & {
  profiles: { display_name: string; } | null;
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
      <div className="flex justify-center my-4 w-full">
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-400">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`flex w-full ${isOwn ? 'justify-end' : 'justify-start'} mb-4 transition-all ${isSelectionMode ? 'cursor-pointer hover:opacity-80' : ''}`}
      onClick={() => isSelectionMode && onSelect?.(message.id)}
    >
      <div className={`flex items-start gap-3 max-w-[85%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
        {isSelectionMode && (
          <div className={`mt-4 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
            isSelected ? 'bg-violet-500 border-violet-500' : 'border-gray-600'
          }`}>
            {isSelected && <CheckCircle2 className="h-4 w-4 text-white" />}
          </div>
        )}
        
        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
          {!isOwn && (
            <span className="text-[10px] text-violet-400 font-bold mb-1 px-2 uppercase tracking-tighter">
              {message.profiles?.display_name || 'User'}
            </span>
          )}
          <div className={`rounded-2xl px-4 py-2 shadow-lg ${
            isOwn ? 'bg-violet-600 text-white rounded-br-none' : 'bg-gray-800 text-gray-100 rounded-bl-none border border-gray-700'
          }`}>
            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
            <p className={`text-[9px] mt-1 text-right ${isOwn ? 'text-violet-200' : 'text-gray-500'}`}>
              {format(new Date(message.created_at), 'HH:mm')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
