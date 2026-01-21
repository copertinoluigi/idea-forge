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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
  
  const { user, profile, signOut, refreshProfile } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeRoomIdRef = useRef(activeRoomId);

  useEffect(() => { activeRoomIdRef.current = activeRoomId; }, [activeRoomId]);
  useEffect(() => { if (user) loadRoomsAndSync(); }, [user]);

  useEffect(() => {
    if (!activeRoomId) return;
    loadMessages(activeRoomId);
    const channel = supabase.channel(`room-fixed-${activeRoomId}`)
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
    const { data: memberships } = await supabase.from('room_members').select('rooms (*)').eq('user_email', user.email);
    let memberRooms = (memberships?.map(m => m.rooms).filter(Boolean) as unknown as Room[]) || [];
    let privateConsole = memberRooms.find(r => r.is_private);

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
    const savedId = localStorage.getItem('lastActiveRoomId');
    if (savedId && memberRooms.some(r => r.id === savedId)) onRoomChange(savedId);
    else if (privateConsole) onRoomChange(privateConsole.id);
    setRoomsLoading(false);
  };

  const loadMessages = async (id: string) => {
    const { data } = await supabase.from('messages').select('*, profiles(display_name)').eq('room_id', id).order('created_at', { ascending: true });
    if (data) setMessages(data as Message[]);
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
  const isAdmin = user?.email === 'info@luigicopertino.it' || user?.email === 'unixgigi@gmail.com';

  return (
    <div className="h-full w-full flex relative overflow-hidden">
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-gray-900 border-r border-gray-800 transition-transform md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center justify-between border-b border-gray-800">
            <h1 className="font-black italic text-xl tracking-widest text-white uppercase">BYOI</h1>
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsSidebarOpen(false)}><X /></Button>
          </div>
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
             <div className="flex items-center justify-between mb-4"><span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Workspace</span><Button onClick={() => setIsAddRoomOpen(true)} variant="ghost" size="icon" className="h-6 w-6"><Plus className="h-4 w-4" /></Button></div>
            {roomsLoading ? <div className="p-4 text-center"><Loader2 className="animate-spin h-4 w-4 inline" /></div> : rooms.map(room => (
              <button key={room.id} onClick={() => { onRoomChange(room.id); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${activeRoomId === room.id ? 'bg-violet-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800'}`}>
                {room.is_private ? <MessageSquare className="h-4 w-4" /> : <Hash className="h-4 w-4" />}
                <span className="truncate font-bold">{room.name}</span>
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-gray-800 space-y-1">
            {isAdmin && <Button onClick={onNavigateToAdmin} variant="ghost" className="w-full justify-start text-emerald-400 font-bold hover:bg-emerald-500/10"><ShieldCheck className="h-4 w-4 mr-2" /> Admin</Button>}
            <Button onClick={onNavigateToSettings} variant="ghost" className="w-full justify-start text-gray-400 hover:text-white"><Settings className="h-4 w-4 mr-2" /> Settings</Button>
            <Button onClick={() => signOut()} variant="ghost" className="w-full justify-start text-red-400 hover:bg-red-500/10"><LogOut className="h-4 w-4 mr-2" /> Logout</Button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-gray-950 h-full relative">
        <header className="h-16 border-b border-gray-800 bg-gray-900/50 backdrop-blur-xl px-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="md:hidden text-gray-400" onClick={() => setIsSidebarOpen(true)}><Menu /></Button>
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm text-white uppercase italic truncate max-w-[150px]">{activeRoom?.name || 'BYOI'}</h2>
                {!activeRoom?.is_private && activeRoom?.join_code && (
                  <button onClick={() => { navigator.clipboard.writeText(activeRoom.join_code!); toast({title: "Copiato"}); }} className="bg-gray-800 text-[10px] px-2 py-0.5 rounded text-violet-400 font-mono border border-gray-700">#{activeRoom.join_code} <Copy className="h-2 w-2" /></button>
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

        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar pb-24">
          {messages.map((m) => (
            <ChatMessage key={m.id} message={m} isOwn={m.user_id === user?.id} isSelectionMode={isSelectionMode} isSelected={selectedMessageIds.includes(m.id)} onSelect={(id) => setSelectedMessageIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-gray-950 border-t border-gray-800 sticky bottom-0 z-30">
          <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-3 items-center">
            <Textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Messaggio..." disabled={isSelectionMode || !activeRoomId} className="flex-1 bg-gray-900 border-gray-800 text-white rounded-xl focus:ring-1 focus:ring-violet-500/50 min-h-[48px] max-h-[150px] resize-none text-base py-3 px-4 shadow-inner" onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && window.innerWidth > 768) { e.preventDefault(); handleSend(e); } }} />
            <Button type="submit" disabled={loading || !newMessage.trim() || !activeRoomId} className="bg-violet-600 hover:bg-violet-500 text-white rounded-xl h-12 w-12 flex-shrink-0 shadow-lg transition-transform active:scale-95 flex items-center justify-center p-0"><Send className="h-5 w-5" /></Button>
          </form>
        </div>
      </main>
      <AddRoomModal isOpen={isAddRoomOpen} onClose={() => setIsAddRoomOpen(false)} onSuccess={() => { loadRoomsAndSync(); setIsAddRoomOpen(false); }} />
    </div>
  );
}
