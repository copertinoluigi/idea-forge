import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ChatMessage } from '@/components/ChatMessage';
import { useToast } from '@/hooks/use-toast';
import { AddRoomModal } from '@/components/AddRoomModal';
import { chatWithAI } from '@/lib/ai-service';
import { format, isToday, isYesterday } from 'date-fns';
import { it } from 'date-fns/locale';
import { 
  Send, Sparkles, Code, Settings, LogOut, Plus, Hash, 
  MessageSquare, ShieldCheck, Loader2, Menu, X, Paperclip, Smile
} from 'lucide-react';
import type { Database } from '@/lib/database.types';

type Message = Database['public']['Tables']['messages']['Row'] & { profiles: { display_name: string } | null };
type Room = Database['public']['Tables']['rooms']['Row'];

// STEP C: Native Emoji List
const EMOJIS = ["😊", "😂", "🚀", "💡", "🔥", "✅", "❌", "🤔", "👍", "🎨", "💻", "🤖", "📈", "📅", "🔒", "✨", "🎯", "📝", "🌍", "⚡"];

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
  
  // Nuovi stati per Media ed Emoji
  const [isUploading, setIsUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages', 
        filter: `room_id=eq.${activeRoomId}` 
      }, async (payload) => {
        if (payload.new.room_id !== activeRoomIdRef.current) return;
        const { data: p } = await supabase.from('profiles').select('display_name').eq('id', payload.new.user_id).single();
        setMessages(prev => (prev.some(m => m.id === payload.new.id) ? prev : [...prev, { ...payload.new, profiles: p } as Message]));
        setTimeout(scrollToBottom, 50);
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeRoomId]);

  useEffect(() => {
  const handleResize = () => {
    if (window.visualViewport) {
      // Forza l'altezza della main area a quella del viewport visibile (senza tastiera)
      const height = window.visualViewport.height;
      document.documentElement.style.setProperty('--vh', `${height}px`);
    }
  };

  window.visualViewport?.addEventListener('resize', handleResize);
  window.visualViewport?.addEventListener('scroll', handleResize);
  handleResize();

  return () => {
    window.visualViewport?.removeEventListener('resize', handleResize);
    window.visualViewport?.removeEventListener('scroll', handleResize);
  };
}, []);
  
  const loadRoomsAndSync = async () => {
    if (!user) return;
    setRoomsLoading(true);
    try {
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
      const savedId = profile?.last_room_id || localStorage.getItem('lastActiveRoomId');
      if (savedId && memberRooms.some(r => r.id === savedId)) onRoomChange(savedId);
      else if (privateConsole) onRoomChange(privateConsole.id);
    } finally { setRoomsLoading(false); }
  };

  const loadMessages = async (id: string) => {
    const { data } = await supabase.from('messages').select('*, profiles(display_name)').eq('room_id', id).order('created_at', { ascending: true });
    if (data) setMessages(data as Message[]);
    setTimeout(scrollToBottom, 100);
  };

  const handleRoomSwitch = async (id: string) => {
    onRoomChange(id);
    setIsSidebarOpen(false);
    if (user) {
      await supabase.from('profiles').update({ last_room_id: id }).eq('id', user.id);
      await refreshProfile();
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !user || !activeRoomId || loading) return;
    const content = newMessage.trim();
    setNewMessage('');
    setShowEmojiPicker(false);
    setLoading(true);
    try {
      await supabase.from('messages').insert({ user_id: user.id, content, room_id: activeRoomId });
      const activeR = rooms.find(r => r.id === activeRoomId);
      if (activeR?.is_private) {
        const reply = await chatWithAI({ messages: [{content}], provider: activeR.ai_provider, apiKey: activeR.encrypted_api_key || profile?.encrypted_api_key || '' });
        await supabase.from('messages').insert({ user_id: user.id, content: reply, room_id: activeRoomId, is_system: true });
      }
    } finally { setLoading(false); }
  };

  // STEP B: Upload Immagini
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeRoomId || !user) return;
    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).slice(2)}_${Date.now()}.${fileExt}`;
      const filePath = `${activeRoomId}/${fileName}`;

      const { error: upErr } = await supabase.storage.from('room-assets').upload(filePath, file);
      if (upErr) throw upErr;

      const { data: { publicUrl } } = supabase.storage.from('room-assets').getPublicUrl(filePath);

      await supabase.from('messages').insert({
        user_id: user.id,
        room_id: activeRoomId,
        content: "",
        attachments: [{ url: publicUrl, name: file.name, type: file.type }] as any
      });
    } catch (err) {
      toast({ title: "Errore durante l'upload", variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const copyJoinCode = () => {
    const room = rooms.find(r => r.id === activeRoomId);
    if (room?.join_code) {
      navigator.clipboard.writeText(room.join_code);
      toast({ title: "Codice Copiato" });
    }
  };

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  const activeRoom = rooms.find(r => r.id === activeRoomId);
  const isAdmin = user?.email === 'info@luigicopertino.it' || user?.email === 'unixgigi@gmail.com';

  return (
    <div className="h-screen w-full flex bg-gray-950 text-white overflow-hidden font-sans relative">
      
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-gray-900 border-r border-gray-800 pt-[env(safe-area-inset-top)] transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center justify-between border-b border-gray-800 bg-gray-900">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-400" />
              <h1 className="font-black italic text-xl tracking-widest text-white uppercase">BYOI</h1>
            </div>
            <Button variant="ghost" size="icon" className="md:hidden text-gray-500" onClick={() => setIsSidebarOpen(false)}><X /></Button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 space-y-1 py-4 custom-scrollbar">
             <div className="flex items-center justify-between px-3 mb-4">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Workspace</span>
                <Button onClick={() => setIsAddRoomOpen(true)} variant="ghost" size="icon" className="h-6 w-6 hover:text-violet-400"><Plus className="h-4 w-4" /></Button>
             </div>
            {roomsLoading ? (
              <div className="flex justify-center p-4"><Loader2 className="animate-spin h-4 w-4 inline text-gray-700" /></div>
            ) : rooms.map(room => (
              <button key={room.id} onClick={() => handleRoomSwitch(room.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${activeRoomId === room.id ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/40' : 'text-gray-400 hover:bg-gray-800'}`}>
                {room.is_private ? <MessageSquare className="h-4 w-4" /> : <Hash className="h-4 w-4" />}
                <span className="truncate font-bold tracking-tight">{room.name}</span>
              </button>
            ))}
          </div>

          <div className="p-4 border-t border-gray-800 space-y-1 bg-gray-950/50">
            {isAdmin && <Button onClick={onNavigateToAdmin} variant="ghost" className="w-full justify-start text-xs text-emerald-400 font-bold hover:bg-emerald-500/10"><ShieldCheck className="h-4 w-4 mr-2" /> Admin</Button>}
            <Button onClick={onNavigateToSettings} variant="ghost" className="w-full justify-start text-sm text-gray-400 font-bold hover:bg-gray-800 hover:text-white transition-colors"><Settings className="h-4 w-4 mr-2" /> Settings</Button>
            <Button onClick={() => signOut()} variant="ghost" className="w-full justify-start text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"><LogOut className="h-4 w-4 mr-2" /> Logout</Button>
          </div>
        </div>
      </aside>

      {isSidebarOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsSidebarOpen(false)} />}

      <main className="flex-1 flex flex-col min-w-0 bg-gray-950 h-full relative">
        <header className="h-[calc(4rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] border-b border-gray-800 bg-gray-900/50 backdrop-blur-xl px-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3 overflow-hidden">
            <Button variant="ghost" size="icon" className="md:hidden text-gray-400" onClick={() => setIsSidebarOpen(true)}><Menu /></Button>
            <div className="flex flex-col text-left overflow-hidden">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm text-white uppercase italic truncate max-w-[120px] md:max-w-none">{activeRoom?.name || 'BYOI'}</h2>
                {!activeRoom?.is_private && activeRoom?.join_code && (
                  <button onClick={copyJoinCode} className="bg-gray-800 text-[9px] px-2 py-0.5 rounded text-violet-400 font-mono border border-gray-700 hover:text-white active:scale-95 transition-all">#{activeRoom.join_code}</button>
                )}
              </div>
              <span className="text-[8px] text-violet-400 font-black uppercase tracking-widest">{activeRoom?.ai_provider} active</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => { if(!isSelectionMode) setIsSelectionMode(true); else { onSummarize(messages.filter(m => selectedMessageIds.includes(m.id))); setIsSelectionMode(false); setSelectedMessageIds([]); } }} size="sm" className={`${isSelectionMode ? 'bg-green-600 animate-pulse' : 'bg-violet-600 shadow-lg shadow-violet-900/30'} text-white rounded-full font-black px-3 h-8 text-[9px] uppercase`}><Sparkles className="mr-1 h-3 w-3" /> <span className="hidden xs:inline">{isSelectionMode ? 'Confirm' : 'Summarize'}</span></Button>
            <Button onClick={onDevelop} disabled={!activeRoom?.mcp_endpoint} size="sm" className="bg-emerald-600 text-white rounded-full font-black px-3 h-8 text-[9px] uppercase shadow-lg shadow-emerald-900/30"><Code className="mr-1 h-3 w-3" /> <span className="hidden xs:inline">Develop</span></Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-2 custom-scrollbar pb-32">
          {messages.map((m, index) => {
            const currentDate = new Date(m.created_at);
            const previousDate = index > 0 ? new Date(messages[index - 1].created_at) : null;
            const showDateSeparator = !previousDate || format(currentDate, 'yyyy-MM-dd') !== format(previousDate, 'yyyy-MM-dd');

            let dateLabel = format(currentDate, 'd MMMM yyyy', { locale: it });
            if (isToday(currentDate)) dateLabel = 'Oggi';
            else if (isYesterday(currentDate)) dateLabel = 'Ieri';

            return (
              <div key={m.id} className="w-full">
                {showDateSeparator && (
                  <div className="flex items-center justify-center my-8 gap-4 px-4">
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-gray-800 to-gray-800" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 bg-gray-950 px-3 whitespace-nowrap">
                      {dateLabel}
                    </span>
                    <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-gray-800 to-gray-800" />
                  </div>
                )}
                <ChatMessage 
                  message={m} 
                  isOwn={m.user_id === user?.id} 
                  isSelectionMode={isSelectionMode} 
                  isSelected={selectedMessageIds.includes(m.id)} 
                  onSelect={(id) => setSelectedMessageIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])} 
                />
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT AREA DEFINITIVA */}
        <div className="p-4 md:p-6 bg-gray-950 border-t border-gray-800 sticky bottom-0 z-30">
          <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-2 items-center relative">
            
            {showEmojiPicker && (
              <div className="absolute bottom-[120%] left-0 z-50 p-2 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl grid grid-cols-5 gap-1 animate-in slide-in-from-bottom-2">
                {EMOJIS.map(emoji => (
                  <button 
                    key={emoji} 
                    type="button" 
                    onClick={() => setNewMessage(p => p + emoji)} 
                    className="w-10 h-10 flex items-center justify-center text-xl hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />

            <div className="flex gap-1">
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                disabled={isUploading || isSelectionMode}
                onClick={() => fileInputRef.current?.click()}
                className="text-gray-400 hover:text-white"
              >
                {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Paperclip className="h-5 w-5" />}
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`text-gray-400 hover:text-white ${showEmojiPicker ? 'text-violet-400 bg-gray-900' : ''}`}
              >
                <Smile className="h-5 w-5" />
              </Button>
            </div>

            <Textarea 
              value={newMessage} 
              onChange={(e) => setNewMessage(e.target.value)} 
              placeholder="Messaggio..." 
              disabled={isSelectionMode || !activeRoomId || isUploading} 
              className="flex-1 bg-gray-900 border-gray-800 text-white rounded-xl focus:ring-1 focus:ring-violet-500/50 min-h-[48px] h-12 max-h-[150px] resize-none text-base py-3 px-4 shadow-inner" 
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && window.innerWidth > 768) { e.preventDefault(); handleSend(e); } }} 
            />
            <Button type="submit" disabled={loading || !newMessage.trim() || !activeRoomId} className="bg-violet-600 hover:bg-violet-500 text-white rounded-xl h-12 w-12 flex-shrink-0 shadow-lg flex items-center justify-center p-0"><Send className="h-5 w-5" /></Button>
          </form>
        </div>
      </main>
      <AddRoomModal isOpen={isAddRoomOpen} onClose={() => setIsAddRoomOpen(false)} onSuccess={() => { loadRoomsAndSync(); setIsAddRoomOpen(false); }} />
    </div>
  );
}
