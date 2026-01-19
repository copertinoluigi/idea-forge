import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ChatMessage } from '@/components/ChatMessage';
import { useToast } from '@/hooks/use-toast';
import {
  Send,
  Sparkles,
  Code,
  Settings,
  LogOut,
  Hash,
  MessageSquare
} from 'lucide-react';
import type { Database } from '@/lib/database.types';

type Message = Database['public']['Tables']['messages']['Row'] & {
  profiles: {
    display_name: string;
  } | null;
};

type Room = Database['public']['Tables']['rooms']['Row'];

interface ChatProps {
  activeRoomId: string | null;
  onRoomChange: (id: string) => void;
  onNavigateToSettings: () => void;
  onSummarize: (selectedMessages: Message[]) => void;
  onDevelop: () => void;
}

export function Chat({ 
  activeRoomId, 
  onRoomChange, 
  onNavigateToSettings, 
  onSummarize, 
  onDevelop 
}: ChatProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Selection Mode
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, signOut } = useAuth(); // Rimosso 'profile' perché non usato qui
  const { toast } = useToast();

  const activeRoom = rooms.find(r => r.id === activeRoomId);

  useEffect(() => {
    if (user) loadRooms();
  }, [user]);

  useEffect(() => {
    if (activeRoomId) {
      loadMessages();
      const unsubscribe = subscribeToRoom();
      return () => { unsubscribe(); };
    }
  }, [activeRoomId]);

  const loadRooms = async () => {
    const { data: existingRooms } = await supabase
      .from('rooms')
      .select('*')
      .order('created_at', { ascending: true });

    if (existingRooms) {
      setRooms(existingRooms);
      if (!activeRoomId && existingRooms.length > 0) {
        onRoomChange(existingRooms[0].id);
      }
    }
  };

  const subscribeToRoom = () => {
    const channel = supabase
      .channel(`room-${activeRoomId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `room_id=eq.${activeRoomId}`
      }, async (payload) => {
        const { data: p } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', payload.new.user_id)
          .single();
        setMessages((prev) => [...prev, { ...payload.new, profiles: p } as Message]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  };

  const loadMessages = async () => {
    if (!activeRoomId) return;
    const { data } = await supabase
      .from('messages')
      .select('*, profiles(display_name)')
      .eq('room_id', activeRoomId)
      .order('created_at', { ascending: true });
    setMessages((data as Message[]) || []);
    setTimeout(scrollToBottom, 100);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !activeRoomId) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('messages').insert({
        user_id: user.id,
        content: newMessage.trim(),
        room_id: activeRoomId,
        is_system: false
      });
      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      toast({ title: 'Errore', description: 'Invio fallito', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSummarizeClick = () => {
    if (!isSelectionMode) {
      setIsSelectionMode(true);
      toast({ title: "Selection Mode", description: "Seleziona i messaggi da riassumere." });
    } else {
      if (selectedMessageIds.length === 0) {
        setIsSelectionMode(false);
        return;
      }
      const selectedMsgs = messages.filter(m => selectedMessageIds.includes(m.id));
      onSummarize(selectedMsgs);
      setIsSelectionMode(false);
      setSelectedMessageIds([]);
    }
  };

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="h-screen flex bg-gray-950 text-white overflow-hidden">
      {/* Sidebar Sinistra Navigazione */}
      <aside className="w-64 border-r border-gray-800 bg-gray-900/50 flex flex-col hidden md:flex">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <Sparkles className="h-6 w-6 text-violet-400" />
            <h1 className="font-black text-xl tracking-tighter italic">IDEAFORGE</h1>
          </div>
          <nav className="space-y-1">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2 mb-4">Workspace</p>
            {rooms.map(room => (
              <button
                key={room.id}
                onClick={() => onRoomChange(room.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  activeRoomId === room.id 
                  ? 'bg-violet-600 text-white shadow-lg' 
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                }`}
              >
                {room.is_private ? <MessageSquare className="h-4 w-4" /> : <Hash className="h-4 w-4" />}
                <span className="truncate font-medium">{room.name}</span>
              </button>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-4 border-t border-gray-800 space-y-2">
          <Button onClick={onNavigateToSettings} variant="ghost" className="w-full justify-start text-gray-400 hover:text-white">
            <Settings className="h-4 w-4 mr-2" /> Settings
          </Button>
          <Button onClick={() => signOut()} variant="ghost" className="w-full justify-start text-red-400 hover:text-red-300">
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>
      </aside>

      {/* Main Chat */}
      <main className="flex-1 flex flex-col min-w-0 bg-gray-950">
        <header className="h-16 border-b border-gray-800 bg-gray-900/50 backdrop-blur-xl px-6 flex items-center justify-between">
          <h2 className="font-bold text-sm tracking-tight">{activeRoom?.name || 'Seleziona stanza'}</h2>
          <div className="flex items-center gap-3">
            <Button 
              onClick={handleSummarizeClick} 
              size="sm" 
              className={`${isSelectionMode ? 'bg-green-600 animate-pulse' : 'bg-violet-600'} rounded-full font-bold`}
            >
              <Sparkles className="mr-2 h-4 w-4" /> 
              {isSelectionMode ? `Confirm (${selectedMessageIds.length})` : 'Summarize'}
            </Button>
            <Button onClick={onDevelop} size="sm" className="bg-emerald-600 hover:bg-emerald-500 rounded-full font-bold px-6">
              <Code className="mr-2 h-4 w-4" /> Develop
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              isOwn={message.user_id === user?.id}
              isSelectionMode={isSelectionMode}
              isSelected={selectedMessageIds.includes(message.id)}
              onSelect={(id) => setSelectedMessageIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="p-6 bg-gray-900/30 border-t border-gray-800">
          <div className="max-w-4xl mx-auto flex gap-4">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={isSelectionMode ? "Modalità selezione attiva..." : "Condividi un'idea..."}
              disabled={isSelectionMode}
              className="flex-1 bg-gray-800/50 border-gray-700 text-white rounded-2xl focus:ring-violet-500/50"
            />
            <Button type="submit" disabled={loading || !newMessage.trim() || isSelectionMode} className="bg-violet-600 rounded-2xl h-[52px] px-6">
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
