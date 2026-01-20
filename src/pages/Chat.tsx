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
  Plus,
  Hash,
  MessageSquare,
  ShieldCheck
} from 'lucide-react';
import type { Database } from '@/lib/database.types';

type Message = Database['public']['Tables']['messages']['Row'] & {
  profiles: { display_name: string } | null;
};
type Room = Database['public']['Tables']['rooms']['Row'];

interface ChatProps {
  activeRoomId: string | null;
  onRoomChange: (id: string) => void;
  onNavigateToSettings: () => void;
  onSummarize: (selectedMessages: Message[]) => void;
  onDevelop: () => void;
}

export function Chat({ activeRoomId, onRoomChange, onNavigateToSettings, onSummarize, onDevelop }: ChatProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
  
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeRoom = rooms.find(r => r.id === activeRoomId);

  useEffect(() => {
    if (user) loadRooms();
  }, [user]);

  useEffect(() => {
    if (activeRoomId) {
      loadMessages();
      const subscription = subscribeToRoom();
      return () => { subscription(); };
    }
  }, [activeRoomId]);

  const loadRooms = async () => {
    if (!user) return;
    
    // Carica stanze create da me o dove sono membro
    const { data, error } = await supabase
      .from('rooms')
      .select(`
        *,
        room_members!inner(user_email)
      `)
      .eq('room_members.user_email', user.email);

    if (data) {
      setRooms(data);
      if (!activeRoomId && data.length > 0) onRoomChange(data[0].id);
    }
  };

  const loadMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*, profiles(display_name)')
      .eq('room_id', activeRoomId)
      .order('created_at', { ascending: true });
    setMessages((data as Message[]) || []);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const subscribeToRoom = () => {
    const channel = supabase.channel(`room-${activeRoomId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${activeRoomId}` }, 
      async (payload) => {
        const { data: p } = await supabase.from('profiles').select('display_name').eq('id', payload.new.user_id).single();
        setMessages(prev => [...prev, { ...payload.new, profiles: p } as Message]);
      }).subscribe();
    return () => supabase.removeChannel(channel);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !activeRoomId) return;
    try {
      const { error } = await supabase.from('messages').insert({
        user_id: user.id,
        content: newMessage.trim(),
        room_id: activeRoomId
      });
      if (error) throw error;
      setNewMessage('');
    } catch (err) {
      toast({ title: "Errore invio", variant: "destructive" });
    }
  };

  return (
    <div className="h-screen flex bg-gray-950 text-white overflow-hidden">
      {/* Sidebar Sinistra */}
      <aside className="w-64 border-r border-gray-800 bg-gray-900/50 flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <Sparkles className="h-6 w-6 text-violet-400" />
            <h1 className="font-black text-xl italic tracking-tighter">IDEAFORGE</h1>
          </div>
          
          <div className="flex items-center justify-between mb-4 px-2">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Workspace</p>
            <Button variant="ghost" size="icon" className="h-5 w-5 hover:text-violet-400">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <nav className="space-y-1">
            {rooms.map(room => (
              <button
                key={room.id}
                onClick={() => onRoomChange(room.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  activeRoomId === room.id ? 'bg-violet-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800'
                }`}
              >
                {room.is_private ? <MessageSquare className="h-4 w-4" /> : <Hash className="h-4 w-4" />}
                <span className="truncate font-medium">{room.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-4 border-t border-gray-800 space-y-1">
          {user?.email === 'unixgigi@gmail.com' && ( // Esempio Hardcoded Admin
            <Button variant="ghost" className="w-full justify-start text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10">
              <ShieldCheck className="h-4 w-4 mr-2" /> Gestione Riservata
            </Button>
          )}
          <Button onClick={onNavigateToSettings} variant="ghost" className="w-full justify-start text-sm text-gray-400 hover:text-white">
            <Settings className="h-4 w-4 mr-2" /> Impostazioni
          </Button>
          <Button onClick={() => signOut()} variant="ghost" className="w-full justify-start text-sm text-red-400 hover:text-red-300">
            <LogOut className="h-4 w-4 mr-2" /> Esci
          </Button>
        </div>
      </aside>

      {/* Main Chat */}
      <main className="flex-1 flex flex-col min-w-0 bg-gray-950">
        <header className="h-16 border-b border-gray-800 bg-gray-900/50 backdrop-blur-xl px-6 flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="font-bold text-sm">{activeRoom?.name || 'Seleziona stanza'}</h2>
            <span className="text-[9px] text-gray-500 uppercase tracking-widest">{activeRoom?.ai_provider} Core</span>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => {
                if(!isSelectionMode) {
                  setIsSelectionMode(true);
                  toast({title: "Selection Mode Attiva"});
                } else {
                  const selMsgs = messages.filter(m => selectedMessageIds.includes(m.id));
                  onSummarize(selMsgs);
                  setIsSelectionMode(false);
                  setSelectedMessageIds([]);
                }
              }}
              size="sm" 
              className={`${isSelectionMode ? 'bg-green-600' : 'bg-violet-600'} rounded-full font-bold px-4`}
            >
              <Sparkles className="mr-2 h-4 w-4" /> {isSelectionMode ? `Confirm (${selectedMessageIds.length})` : 'Summarize'}
            </Button>
            <Button onClick={onDevelop} size="sm" className="bg-emerald-600 rounded-full font-bold px-4"><Code className="mr-2 h-4 w-4" /> Develop</Button>
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
              placeholder={isSelectionMode ? "Scegli i messaggi per il riassunto..." : "Condividi un'idea..."}
              disabled={isSelectionMode}
              className="flex-1 bg-gray-800/50 border-gray-700 text-white rounded-2xl focus:ring-violet-500/50 min-h-[52px]"
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
