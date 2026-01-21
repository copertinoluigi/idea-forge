import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ChatMessage } from '@/components/ChatMessage';
import { useToast } from '@/hooks/use-toast';
import { AddRoomModal } from '@/components/AddRoomModal';
import { chatWithAI } from '@/lib/ai-service';
import { Send, Sparkles, Code, Settings, LogOut, Plus, Hash, MessageSquare, ShieldCheck, Loader2, Menu, X, Copy } from 'lucide-react';
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
  
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeRoomIdRef = useRef(activeRoomId);

  useEffect(() => { activeRoomIdRef.current = activeRoomId; }, [activeRoomId]);
  useEffect(() => { if (user) loadRooms(); }, [user]);

  useEffect(() => {
    if (!activeRoomId) return;
    loadMessages(activeRoomId);
    const channel = supabase.channel(`room-${activeRoomId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${activeRoomId}` }, 
      async (payload) => {
        if (payload.new.room_id !== activeRoomIdRef.current) return;
        const { data: p } = await supabase.from('profiles').select('display_name').eq('id', payload.new.user_id).single();
        setMessages(prev => (prev.some(m => m.id === payload.new.id) ? prev : [...prev, { ...payload.new, profiles: p } as Message]));
        setTimeout(scrollToBottom, 50);
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeRoomId]);

  const loadRooms = async () => {
    if (!user) return;
    setRoomsLoading(true);
    const { data: memberships } = await supabase.from('room_members').select('rooms (*)').eq('user_email', user.email);
    const memberRooms = (memberships?.map(m => m.rooms).filter(Boolean) as unknown as Room[]) || [];
    setRooms(memberRooms);
    const savedId = localStorage.getItem('lastActiveRoomId');
    if (savedId && memberRooms.some(r => r.id === savedId)) {
      onRoomChange(savedId);
    } else if (memberRooms.length > 0) {
      onRoomChange(memberRooms[0].id);
    }
    setRoomsLoading(false);
  };

  const loadMessages = async (id: string) => {
    const { data } = await supabase.from('messages').select('*, profiles(display_name)').eq('room_id', id).order('created_at', { ascending: true });
    setMessages(data as Message[] || []);
    setTimeout(scrollToBottom, 50);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !activeRoomId || loading) return;
    const content = newMessage.trim();
    setNewMessage('');
    setLoading(true);
    try {
      await supabase.from('messages').insert({ user_id: user.id, content, room_id: activeRoomId });
      const activeR = rooms.find(r => r.id === activeRoomId);
      if (activeR?.is_private) {
        const reply = await chatWithAI({ messages: [{content}], provider: activeR.ai_provider, apiKey: activeR.encrypted_api_key || profile?.encrypted_api_key || '' });
        await supabase.from('messages').insert({ user_id: user.id, content: reply, room_id: activeRoomId, is_system: true });
      }
    } catch (err: any) { toast({ title: "Errore", description: err.message, variant: "destructive" }); } finally { setLoading(false); }
  };

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  const activeRoom = rooms.find(r => r.id === activeRoomId);

  return (
    <div className="h-screen w-full flex bg-gray-950 text-white overflow-hidden font-sans relative">
      
      {/* SIDEBAR SINISTRA (Responsive) */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-gray-900 border-r border-gray-800 transition-transform md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center justify-between">
            <h1 className="font-black italic text-xl tracking-widest text-white uppercase">BYOI</h1>
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsSidebarOpen(false)}><X /></Button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 space-y-1">
             <div className="flex items-center justify-between px-3 mb-2">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Stanze</span>
                <Button onClick={() => setIsAddRoomOpen(true)} variant="ghost" size="icon" className="h-6 w-6"><Plus className="h-4 w-4" /></Button>
             </div>
            {rooms.map(room => (
              <button key={room.id} onClick={() => { onRoomChange(room.id); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${activeRoomId === room.id ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/40' : 'text-gray-400 hover:bg-gray-800'}`}>
                {room.is_private ? <MessageSquare className="h-4 w-4" /> : <Hash className="h-4 w-4" />}
                <span className="truncate font-bold">{room.name}</span>
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-gray-800 space-y-1">
            <Button onClick={onNavigateToSettings} variant="ghost" className="w-full justify-start text-gray-400 hover:text-white"><Settings className="h-4 w-4 mr-2" /> Settings</Button>
            <Button onClick={() => signOut()} variant="ghost" className="w-full justify-start text-red-400 hover:text-red-300"><LogOut className="h-4 w-4 mr-2" /> Logout</Button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 bg-gray-950 h-full">
        <header className="h-16 border-b border-gray-800 bg-gray-900/50 backdrop-blur-xl px-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="md:hidden text-gray-400" onClick={() => setIsSidebarOpen(true)}><Menu /></Button>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm text-white uppercase italic truncate max-w-[120px] md:max-w-none">{activeRoom?.name || 'Caricamento...'}</h2>
                {!activeRoom?.is_private && activeRoom?.join_code && (
                  <button onClick={() => { navigator.clipboard.writeText(activeRoom.join_code!); toast({title: "Copiato"}); }} className="bg-gray-800 text-[9px] px-2 py-0.5 rounded text-violet-400 font-mono flex items-center gap-1 border border-gray-700">#{activeRoom.join_code} <Copy className="h-2 w-2" /></button>
                )}
              </div>
              <span className="text-[8px] text-gray-500 uppercase font-black">{activeRoom?.ai_provider} active</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => { if(!isSelectionMode) setIsSelectionMode(true); else { onSummarize(messages.filter(m => selectedMessageIds.includes(m.id))); setIsSelectionMode(false); setSelectedMessageIds([]); } }} size="sm" className={`${isSelectionMode ? 'bg-green-600 animate-pulse' : 'bg-violet-600'} text-white rounded-full font-black px-3 h-8 text-[9px] uppercase`}><Sparkles className="mr-1 h-3 w-3" /> {isSelectionMode ? `Confirm (${selectedMessageIds.length})` : 'Summarize'}</Button>
            <Button onClick={onDevelop} disabled={!activeRoom?.mcp_endpoint} size="sm" className="bg-emerald-600 text-white rounded-full font-black px-3 h-8 text-[9px] uppercase"><Code className="mr-1 h-3 w-3" /> Develop</Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar pb-24 md:pb-6">
          {messages.map((m) => (
            <ChatMessage key={m.id} message={m} isOwn={m.user_id === user?.id} isSelectionMode={isSelectionMode} isSelected={selectedMessageIds.includes(m.id)} onSelect={(id) => setSelectedMessageIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="p-4 md:p-6 bg-gray-900/30 border-t border-gray-800 sticky bottom-0 z-30">
          <div className="max-w-4xl mx-auto flex gap-3">
            <Textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Scrivi..." disabled={isSelectionMode || !activeRoomId} className="flex-1 bg-gray-950 border-gray-800 text-white rounded-xl focus:ring-violet-500/50 min-h-[48px] h-[48px] md:h-auto resize-none text-base" onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && window.innerWidth > 768) { e.preventDefault(); handleSend(e); } }} />
            <Button type="submit" disabled={loading || !newMessage.trim() || !activeRoomId} className="bg-violet-600 rounded-xl h-[48px] w-[48px] md:w-auto md:px-6 shadow-xl"><Send className="h-5 w-5" /></Button>
          </div>
        </form>
      </main>
      <AddRoomModal isOpen={isAddRoomOpen} onClose={() => setIsAddRoomOpen(false)} onSuccess={() => { loadRooms(); setIsAddRoomOpen(false); }} />
    </div>
  );
}
