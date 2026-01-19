import { format } from 'date-fns';
import type { Database } from '@/lib/database.types';

type Message = Database['public']['Tables']['messages']['Row'] & {
  profiles: {
    display_name: string;
  } | null;
};

interface ChatMessageProps {
  message: Message;
  isOwn: boolean;
}

export function ChatMessage({ message, isOwn }: ChatMessageProps) {
  if (message.is_system) {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-400">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
        {!isOwn && (
          <span className="text-xs text-violet-400 font-medium mb-1 px-2">
            {message.profiles?.display_name || 'Unknown'}
          </span>
        )}
        <div
          className={`rounded-2xl px-4 py-2 ${
            isOwn
              ? 'bg-violet-600 text-white rounded-br-none'
              : 'bg-gray-800 text-gray-100 rounded-bl-none'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
          <p
            className={`text-xs mt-1 ${
              isOwn ? 'text-violet-200' : 'text-gray-500'
            }`}
          >
            {format(new Date(message.created_at), 'HH:mm')}
          </p>
        </div>
      </div>
    </div>
  );
}
