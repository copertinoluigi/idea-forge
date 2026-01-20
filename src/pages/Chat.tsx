import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ChatMessage } from '@/components/ChatMessage';
import { useToast } from '@/hooks/use-toast';
import { AddRoomModal } from '@/components/AddRoomModal';
import { chatWithAI } from '@/lib/ai-service';
import { 
  Send, Sparkles, Code, Settings, LogOut, Plus, Hash, 
  MessageSquare, ShieldCheck, Loader2, Menu, X, History 
} from 'lucide-react';
import type { Database } from '@/lib/database.types';

type Message = Database['public']['Tables']['messages']['Row'] & { profiles: { display_name: string } | null };
type Room = Database['public']['Tables']['rooms']['Row'];

interface ChatProps {
  activeRoomId: string | null;
  onRoomChange: (id: string) => void;
  onNavigateToSettings: () => void;
  onNavigateToAdmin: () => void;
  onSummarize: (selectedMessages: Message[]) => void;
  onDevelop: () => void;
}

export function Chat({ activeRoomId, onRoomChange, onNavigateToSettings, onNavigateToAdmin, onSummarize, onDevelop }: ChatProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
  
  // Mobile UI States
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { user, profile, signOut, refreshProfile } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeRoomIdRef = useRef(activeRoomId);

  useEffect(() => { activeRoomIdRef.current = activeRoomId; }, [activeRoomId]);
  useEffect(() => { if (user) loadRoomsAndSync(); }, [user]);

  useEffect(() => {
    if (!activeRoomId) return;
    loadMessages(activeRoomId);
    const channel = supabase.channel(`room-mob-${activeRoomId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${activeRoomId}` }, 
      async (payload) => {
        if (payload.new.room_id !== activeRoomIdRef.current) return;
        const { data: p } = await supabase.from('profiles').select('display_name').eq('id', payload.new.user_id).single();
        setMessages(prev => (prev.some(m => m.id === payload.new.id) ? prev : [...prev, { ...payload.new, profiles: p } as Message]));
        setTimeout(scrollToBottom, 50);
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeRoomId]);

  const loadRoomsAndSync = async () => {
    if (!user) return;
    setRoomsLoading(true);
    try {
      const { data: memberships } = await supabase.from('room_members').select('rooms (*)').eq('user_email', user.email);
      let memberRooms = (memberships?.map(m => m.rooms).filter(Boolean) as unknown as Room[]) || [];
      const privateConsole = memberRooms.find(r => r.is_private);

      if (!privateConsole) {
        const { data: newRoom } = await supabase.from('rooms').insert({
          name: 'La mia Console', is_private: true, created_by: user.id, ai_provider: 'google-flash'
        }).select().single();
        if (newRoom) {
          await supabase.from('room_members').insert({ room_id: newRoom.id, user_email: user.email, user_id: user.id, role: 'owner' });
          memberRooms = [newRoom, ...memberRooms];
          privateConsole = newRoom;
        }
      }
      setRooms(memberRooms);
      const savedId = profile?.last_room_id;
      if (savedId && memberRooms.some(r => r.id === savedId)) {
        onRoomChange(savedId);
      } else if (privateConsole) {
        onRoomChange(privateConsole.id);
      }
    } finally { setRoomsLoading(false); }
  };

  const loadMessages = async (id: string) => {
    const { data } = await supabase.from('messages').select('*, profiles(display_name)').eq('room_id', id).order('created_at', { ascending: true });
    if (data) setMessages(data as Message[]);
    setTimeout(scrollToBottom, 100);
  };

  const handleRoomSwitch = async (id: string) => {
    onRoomChange(id);
    setIsSidebarOpen(false); // Chiude sidebar su mobile dopo click
    if (user) {
      await supabase.from('profiles').update({ last_room_id: id }).eq('id', user.id);
      await refreshProfile();
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !activeRoomId || loading) return;
    const content = newMessage.trim();
    setNewMessage('');
    setLoading(true);
    try {
      await supabase.from('messages').insert({ user_id: user.id, content, room_id: activeRoomId });
      if (rooms.find(r => r.id === activeRoomId)?.is_private) {
        const reply = await chatWithAI({ messages: [{content}], provider: 'google-flash', apiKey: profile?.encrypted_api_key || '' });
        await supabase.from('messages').insert({ user_id: user.id, content: reply, room_id: activeRoomId, is_system: true });
      }
    } finally { setLoading(false); }
  };

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  const isAdmin = user?.email === 'info@luigicopertino.it' || user?.email === 'unixgigi@gmail.com';

  return (
    <div className="flex h-screen w-full bg-gray-950 text-white overflow-hidden fixed inset-0">
      
      {/* SIDEBAR SINISTRA (MOBILE & DESKTOP) */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-gray-900 border-r border-gray-800 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="text-violet-400 h-5 w-5" />
              <h1 className="font-black italic uppercase tracking-widest text-lg">IdeaForge</h1>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)} className="md:hidden">
              <X className="h-5 w-5 text-gray-500" />
            </Button>
          </div>

          <div className="px-4 mb-4 flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2">Stanze</span>
            <Button onClick={() => setIsAddRoomOpen(true)} variant="ghost" size="icon" className="h-7 w-7 bg-gray-800 hover:text-violet-400"><Plus className="h-4 w-4" /></Button>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 space-y-1 custom-scrollbar">
            {roomsLoading ? <div className="flex justify-center p-4"><Loader2 className="animate-spin h-5 w-5 text-gray-700" /></div> : rooms.map(room => (
              <button key={room.id} onClick={() => handleRoomSwitch(room.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${activeRoomId === room.id ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/40' : 'text-gray-400 hover:bg-gray-800'}`}>
                {room.is_private ? <MessageSquare className="h-4 w-4" /> : <Hash className="h-4 w-4" />}
                <span className="truncate font-bold">{room.name}</span>
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-800 space-y-1">
            {isAdmin && <Button onClick={onNavigateToAdmin} variant="ghost" className="w-full justify-start text-xs text-emerald-400 font-bold hover:bg-emerald-500/10"><ShieldCheck className="h-4 w-4 mr-2" /> Admin</Button>}
            <Button onClick={onNavigateToSettings} variant="ghost" className="w-full justify-start text-sm text-gray-400 font-bold hover:bg-gray-800"><Settings className="h-4 w-4 mr-2" /> Settings</Button>
            <Button onClick={() => signOut()} variant="ghost" className="w-full justify-start text-sm text-red-400 font-bold hover:bg-red-500/10"><LogOut className="h-4 w-4 mr-2" /> Logout</Button>
          </div>
        </div>
      </aside>

      {/* OVERLAY MOBILE */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* AREA CHAT PRINCIPALE */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        <header className="h-16 border-b border-gray-800 bg-gray-950/80 backdrop-blur-xl px-4 md:px-6 flex items-center justify-between sticky top-0 z-30">
  <div className="flex items-center gap-3">
    <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)} className="md:hidden">
      <Menu className="h-6 w-6 text-gray-400" />
    </Button>
    <div className="flex flex-col text-left overflow-hidden">
      <div className="flex items-center gap-2">
        <h2 className="font-bold text-sm text-white truncate uppercase italic tracking-tight">
          {activeRoom?.name || 'Caricamento...'}
        </h2>
        {/* MOSTRA IL CODICE SOLO SE NON È PRIVATA */}
        {!activeRoom?.is_private && activeRoom?.join_code && (
          <button 
            onClick={copyJoinCode}
            className="bg-gray-800 text-[10px] px-2 py-0.5 rounded border border-gray-700 text-violet-400 hover:text-white font-mono flex items-center gap-1 transition-all active:scale-95"
          >
            #{activeRoom.join_code} <Copy className="h-2.5 w-2.5" />
          </button>
        )}
      </div>
      <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">
        {activeRoom?.ai_provider} Core Active
      </span>
    </div>
  </div>

  <div className="flex items-center gap-2">
    {/* I bottoni Summarize e Develop restano invariati */}
    <Button onClick={handleSummarizeClick} size="sm" className={`${isSelectionMode ? 'bg-green-600' : 'bg-violet-600'} text-white rounded-full font-black px-3 md:px-5 h-9 text-[10px] uppercase`}>
      <Sparkles className="mr-1.5 h-3.5 w-3.5" /> 
      <span className="hidden xs:inline">{isSelectionMode ? `Conferma (${selectedMessageIds.length})` : 'Summarize'}</span>
    </Button>
    <Button onClick={onDevelop} disabled={!activeRoom?.mcp_endpoint} size="sm" className="bg-emerald-600 text-white rounded-full font-black px-3 md:px-5 h-9 text-[10px] uppercase shadow-lg shadow-emerald-900/20">
      <Code className="h-3.5 w-3.5 md:mr-1.5" />
      <span className="hidden md:inline">Develop</span>
    </Button>
  </div>
</header>

        {/* LISTA MESSAGGI (OTTIMIZZATA PER TOUCH) */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar pb-24 md:pb-6">
          {messages.map((m) => (
            <ChatMessage 
              key={m.id} 
              message={m} 
              isOwn={m.user_id === user?.id} 
              isSelectionMode={isSelectionMode} 
              isSelected={selectedMessageIds.includes(m.id)} 
              onSelect={(id) => setSelectedMessageIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])} 
            />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT AREA (OTTIMIZZATA PER MOBILE KEYBOARD) */}
        <div className="p-4 md:p-6 bg-gray-950/80 backdrop-blur-md border-t border-gray-800 sticky bottom-0 z-30">
          <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-2 md:gap-4 items-end">
            <Textarea 
              value={newMessage} 
              onChange={(e) => setNewMessage(e.target.value)} 
              placeholder={activeRoomId ? "Messaggio..." : "Scegli una stanza..."} 
              disabled={isSelectionMode || !activeRoomId} 
              className="flex-1 bg-gray-900 border-gray-800 text-white placeholder:text-gray-600 rounded-2xl min-h-[48px] max-h-[150px] py-3 px-4 text-base focus:ring-1 focus:ring-violet-500/50 resize-none" 
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && window.innerWidth > 768) { e.preventDefault(); handleSend(e); } }} 
            />
            <Button 
              type="submit" 
              disabled={loading || !newMessage.trim() || !activeRoomId} 
              className="bg-violet-600 hover:bg-violet-500 text-white rounded-2xl h-12 w-12 md:w-auto md:px-6 shadow-xl flex-shrink-0"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </form>
        </div>
      </main>

      <AddRoomModal isOpen={isAddRoomOpen} onClose={() => setIsAddRoomOpen(false)} onSuccess={() => { loadRoomsAndSync(); setIsAddRoomOpen(false); }} />
    </div>
  );
}
