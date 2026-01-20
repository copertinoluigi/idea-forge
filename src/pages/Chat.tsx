import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ChatMessage } from '@/components/ChatMessage';
import { useToast } from '@/hooks/use-toast';
import { AddRoomModal } from '@/components/AddRoomModal';
import { chatWithAI } from '@/lib/ai-service';
import { Send, Sparkles, Code, Settings, LogOut, Plus, Hash, MessageSquare, ShieldCheck, Loader2, Copy } from 'lucide-react';
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
  
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeRoom = rooms.find(r => r.id === activeRoomId);

  // Caricamento iniziale
  useEffect(() => {
    if (user) {
      loadRooms();
    }
  }, [user]);

  // Sincronizzazione Messaggi Realtime
  useEffect(() => {
    if (activeRoomId) {
      loadMessages();
      const channel = supabase.channel(`room-${activeRoomId}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages', 
          filter: `room_id=eq.${activeRoomId}` 
        }, async (payload) => {
          const { data: p } = await supabase.from('profiles').select('display_name').eq('id', payload.new.user_id).single();
          setMessages(prev => {
            if (prev.some(m => m.id === payload.new.id)) return prev;
            return [...prev, { ...payload.new, profiles: p } as Message];
          });
          setTimeout(scrollToBottom, 50);
        }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [activeRoomId]);

  const loadRooms = async () => {
    if (!user) return;
    setRoomsLoading(true);
    
    try {
      // 1. Cerchiamo le appartenenze
      const { data: memberships, error: mErr } = await supabase
        .from('room_members')
        .select('rooms (*)')
        .eq('user_email', user.email);

      if (mErr) throw mErr;

      let memberRooms = (memberships?.map(m => m.rooms).filter(Boolean) as unknown as Room[]) || [];
      let privateConsole = memberRooms.find(r => r.is_private);

      // 2. Se non esiste la console, la creiamo in modo forzato
      if (!privateConsole) {
        console.log("Console non trovata, creazione in corso...");
        const { data: newRoom, error: rErr } = await supabase.from('rooms').insert({
          name: 'La mia Console', 
          is_private: true, 
          created_by: user.id, 
          ai_provider: profile?.ai_provider || 'google-flash'
        }).select().single();

        if (rErr) throw rErr;

        if (newRoom) {
          const { error: memErr } = await supabase.from('room_members').insert({ 
            room_id: newRoom.id, 
            user_email: user.email, 
            user_id: user.id, 
            role: 'owner' 
          });
          if (memErr) throw memErr;
          
          memberRooms = [newRoom, ...memberRooms];
          privateConsole = newRoom;
        }
      }

      setRooms(memberRooms);

      // 3. Selezione della stanza (localStorage o Console)
      const savedId = localStorage.getItem('lastActiveRoomId');
      if (savedId && memberRooms.some(r => r.id === savedId)) {
        onRoomChange(savedId);
      } else if (privateConsole) {
        onRoomChange(privateConsole.id);
      }

    } catch (err: any) {
      console.error("Errore critico loadRooms:", err);
      toast({ title: "Errore Caricamento", description: err.message, variant: "destructive" });
    } finally {
      setRoomsLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!activeRoomId) return;
    const { data, error } = await supabase
      .from('messages')
      .select('*, profiles(display_name)')
      .eq('room_id', activeRoomId)
      .order('created_at', { ascending: true });
    
    if (!error) setMessages(data as Message[]);
    setTimeout(scrollToBottom, 50);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !activeRoomId || loading) return;
    
    const content = newMessage.trim();
    setNewMessage('');
    setLoading(true);

    try {
      const { error: sendError } = await supabase.from('messages').insert({ 
        user_id: user.id, 
        content, 
        room_id: activeRoomId 
      });
      if (sendError) throw sendError;

      if (activeRoom?.is_private) {
        const history = messages.map(m => ({ role: m.is_system ? 'assistant' : 'user', content: m.content }));
        history.push({ role: 'user', content });

        const reply = await chatWithAI({
          messages: history,
          provider: activeRoom.ai_provider,
          apiKey: activeRoom.encrypted_api_key || profile?.encrypted_api_key || ''
        });

        await supabase.from('messages').insert({
          user_id: user.id, 
          content: reply, 
          room_id: activeRoomId, 
          is_system: true 
        });
      }
    } catch (err: any) {
      toast({ title: "Errore Invio", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  const isAdmin = user?.email === 'info@luigicopertino.it' || user?.email === 'unixgigi@gmail.com';

  return (
    <div className="h-screen flex bg-gray-950 text-white overflow-hidden font-sans">
      {/* SIDEBAR */}
      <aside className="w-64 border-r border-gray-800 bg-gray-900/50 flex flex-col hidden md:flex">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8 justify-center">
            <Sparkles className="h-6 w-6 text-violet-400" />
            <h1 className="font-black text-xl italic uppercase text-white tracking-tighter">IdeaForge</h1>
          </div>
          <div className="flex items-center justify-between mb-4 px-2">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Workspace</p>
            <Button onClick={() => setIsAddRoomOpen(true)} variant="ghost" size="icon" className="h-5 w-5 text-gray-400 hover:text-violet-400"><Plus className="h-4 w-4" /></Button>
          </div>
          <nav className="space-y-1 overflow-y-auto">
            {roomsLoading ? (
              <div className="flex justify-center p-4"><Loader2 className="animate-spin h-4 w-4 text-gray-700" /></div>
            ) : rooms.map(room => (
              <button key={room.id} onClick={() => onRoomChange(room.id)} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all duration-200 ${activeRoomId === room.id ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/30' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                {room.is_private ? <MessageSquare className="h-4 w-4" /> : <Hash className="h-4 w-4" />}
                <span className="truncate font-bold tracking-tight">{room.name}</span>
              </button>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-4 border-t border-gray-800 space-y-1">
          {isAdmin && <Button onClick={onNavigateToAdmin} variant="ghost" className="w-full justify-start text-xs text-emerald-400 font-bold hover:bg-emerald-500/10 hover:text-emerald-300 transition-colors"><ShieldCheck className="h-4 w-4 mr-2" /> Gestione Riservata</Button>}
          <Button onClick={onNavigateToSettings} variant="ghost" className="w-full justify-start text-sm text-gray-300 font-bold hover:bg-gray-800 hover:text-white transition-colors"><Settings className="h-4 w-4 mr-2" /> Settings</Button>
          <Button onClick={() => signOut()} variant="ghost" className="w-full justify-start text-sm text-red-400 font-bold hover:bg-red-500/10 hover:text-red-300 transition-colors"><LogOut className="h-4 w-4 mr-2" /> Logout</Button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col min-w-0 bg-gray-950">
        <header className="h-16 border-b border-gray-800 bg-gray-900/50 backdrop-blur-xl px-6 flex items-center justify-between">
          <div className="flex flex-col text-left">
            <h2 className="font-bold text-sm text-white uppercase tracking-tighter italic">{activeRoom?.name || 'Inizializzazione...'}</h2>
            <span className="text-[9px] text-violet-400 font-black uppercase tracking-[0.2em]">{activeRoom?.ai_provider || 'Engine'} active</span>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => { if(!isSelectionMode) setIsSelectionMode(true); else { onSummarize(messages.filter(m => selectedMessageIds.includes(m.id))); setIsSelectionMode(false); setSelectedMessageIds([]); } }} size="sm" className={`${isSelectionMode ? 'bg-green-600' : 'bg-violet-600 shadow-lg'} text-white rounded-full font-black px-5 text-[10px] uppercase tracking-widest`}><Sparkles className="mr-2 h-3.5 w-3.5" /> {isSelectionMode ? `Conferma (${selectedMessageIds.length})` : 'Summarize'}</Button>
            <Button onClick={() => onDevelop()} disabled={!activeRoom?.mcp_endpoint} size="sm" className={`${activeRoom?.mcp_endpoint ? 'bg-emerald-600' : 'bg-gray-800 text-gray-500 opacity-50'} text-white rounded-full font-black px-5 text-[10px] uppercase tracking-widest`}><Code className="mr-2 h-3.5 w-3.5" /> Develop</Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((m) => (
            <ChatMessage key={m.id} message={m} isOwn={m.user_id === user?.id} isSelectionMode={isSelectionMode} isSelected={selectedMessageIds.includes(m.id)} onSelect={(id) => setSelectedMessageIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="p-6 bg-gray-900/30 border-t border-gray-800">
          <div className="max-w-4xl mx-auto flex gap-4">
            <Textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder={isSelectionMode ? "Seleziona i messaggi e conferma in alto..." : "Scrivi alla tua AI o al gruppo..."} disabled={isSelectionMode || !activeRoomId} className="flex-1 bg-gray-950 border-gray-800 text-white placeholder:text-gray-600 rounded-2xl focus:ring-violet-500/50 min-h-[56px] resize-none py-4 font-medium" onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }} />
            <Button type="submit" disabled={loading || !newMessage.trim() || isSelectionMode || !activeRoomId} className="bg-violet-600 hover:bg-violet-500 text-white rounded-2xl h-[56px] px-6 shadow-xl shadow-violet-900/30">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </div>
        </form>
      </main>
      <AddRoomModal isOpen={isAddRoomOpen} onClose={() => setIsAddRoomOpen(false)} onSuccess={() => { loadRooms(); setIsAddRoomOpen(false); }} />
    </div>
  );
}
