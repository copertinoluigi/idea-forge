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

// STEP C: Native Emoji Picker Component (Zero Dependencies)
const EMOJIS = ["😊", "😂", "🚀", "💡", "🔥", "✅", "❌", "🤔", "👍", "🎨", "💻", "🤖", "📈", "📅", "🔒", "✨"];

export function Chat({ activeRoomId, onRoomChange, onNavigateToSettings, onNavigateToAdmin, onSummarize, onDevelop }: any) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
  
  // STEP B & C: Stati per media ed emoji
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
    const channel = supabase.channel(`room-${activeRoomId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${activeRoomId}` }, async (p) => {
        if (p.new.room_id !== activeRoomIdRef.current) return;
        const { data: prof } = await supabase.from('profiles').select('display_name').eq('id', p.new.user_id).single();
        setMessages(prev => [...prev, { ...p.new, profiles: prof } as Message]);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeRoomId]);

  const loadRoomsAndSync = async () => {
    if (!user) return;
    const { data: memberships } = await supabase.from('room_members').select('rooms (*)').eq('user_email', user.email);
    let mRooms = (memberships?.map(m => m.rooms).filter(Boolean) as unknown as Room[]) || [];
    setRooms(mRooms);
    const savedId = profile?.last_room_id || localStorage.getItem('lastActiveRoomId');
    if (savedId && mRooms.some(r => r.id === savedId)) onRoomChange(savedId);
    setRoomsLoading(false);
  };

  const loadMessages = async (id: string) => {
    const { data } = await supabase.from('messages').select('*, profiles(display_name)').eq('room_id', id).order('created_at', { ascending: true });
    if (data) setMessages(data as Message[]);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !user || !activeRoomId || loading) return;
    const content = newMessage;
    setNewMessage('');
    setShowEmojiPicker(false);
    await supabase.from('messages').insert({ user_id: user.id, content, room_id: activeRoomId });
  };

  // STEP B: Logica Caricamento Immagine
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeRoomId || !user) return;
    try {
      setIsUploading(true);
      const filePath = `${activeRoomId}/${Date.now()}_${file.name}`;
      const { error: upErr } = await supabase.storage.from('room-assets').upload(filePath, file);
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('room-assets').getPublicUrl(filePath);
      await supabase.from('messages').insert({
        user_id: user.id, room_id: activeRoomId, content: "", 
        attachments: [{ url: publicUrl, name: file.name, type: file.type }] as any
      });
    } catch (err) {
      toast({ title: "Errore upload", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const activeRoom = rooms.find(r => r.id === activeRoomId);

  return (
    <div className="h-screen w-full flex bg-gray-950 text-white overflow-hidden">
      {/* SIDEBAR (Stessa logica di prima, condensata) */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-gray-900 border-r border-gray-800 transition-transform md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full p-4">
          <div className="flex items-center justify-between mb-8 px-2">
            <div className="flex items-center gap-2"><Sparkles className="text-violet-400 w-5 h-5" /><h1 className="font-black uppercase tracking-widest">BYOI</h1></div>
            <X className="md:hidden cursor-pointer" onClick={() => setIsSidebarOpen(false)} />
          </div>
          <div className="flex-1 overflow-y-auto space-y-1">
            {rooms.map(r => (
              <button key={r.id} onClick={() => { onRoomChange(r.id); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm ${activeRoomId === r.id ? 'bg-violet-600' : 'hover:bg-gray-800 text-gray-400'}`}>
                <Hash className="w-4 h-4" /> <span className="truncate font-bold">{r.name}</span>
              </button>
            ))}
          </div>
          <div className="pt-4 border-t border-gray-800">
            <Button onClick={onNavigateToSettings} variant="ghost" className="w-full justify-start text-gray-400"><Settings className="w-4 h-4 mr-2" /> Settings</Button>
            <Button onClick={() => signOut()} variant="ghost" className="w-full justify-start text-red-400"><LogOut className="w-4 h-4 mr-2" /> Logout</Button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative min-w-0">
        <header className="h-16 border-b border-gray-800 bg-gray-900/50 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Menu className="md:hidden cursor-pointer" onClick={() => setIsSidebarOpen(true)} />
            <h2 className="font-bold uppercase italic text-sm truncate">{activeRoom?.name}</h2>
          </div>
          <Button onClick={() => isSelectionMode ? (onSummarize(messages.filter(m => selectedMessageIds.includes(m.id))), setIsSelectionMode(false)) : setIsSelectionMode(true)} size="sm" className="bg-violet-600 rounded-full text-[10px] font-black uppercase">
            <Sparkles className="w-3 h-3 mr-1" /> {isSelectionMode ? 'Confirm' : 'Summarize'}
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar pb-32">
          {messages.map((m, i) => (
            <ChatMessage key={m.id} message={m} isOwn={m.user_id === user?.id} isSelectionMode={isSelectionMode} isSelected={selectedMessageIds.includes(m.id)} onSelect={(id) => setSelectedMessageIds(prev => prev.includes(id) ? prev.filter(x => x!==id) : [...prev, id])} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT AREA CON INTEGRAZIONE NATIVA */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-gray-950 via-gray-950 to-transparent">
          <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-2 items-center bg-gray-900 p-2 rounded-2xl border border-gray-800 shadow-2xl relative">
            
            {/* Native Emoji Picker Panel */}
            {showEmojiPicker && (
              <div className="absolute bottom-full left-0 mb-2 p-3 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl grid grid-cols-8 gap-2 animate-in slide-in-from-bottom-2">
                {EMOJIS.map(e => (
                  <button key={e} type="button" onClick={() => setNewMessage(p => p + e)} className="text-xl hover:scale-125 transition-transform">{e}</button>
                ))}
              </div>
            )}

            <div className="flex gap-1">
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
              <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="text-gray-400 hover:text-white">
                {isUploading ? <Loader2 className="animate-spin w-5 h-5" /> : <Paperclip className="w-5 h-5" />}
              </Button>
              <Button type="button" variant="ghost" size="icon" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={`text-gray-400 ${showEmojiPicker ? 'text-violet-400' : ''}`}>
                <Smile className="w-5 h-5" />
              </Button>
            </div>

            <Textarea 
              value={newMessage} 
              onChange={(e) => setNewMessage(e.target.value)} 
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Messaggio..." 
              className="flex-1 bg-transparent border-none focus-visible:ring-0 min-h-[40px] max-h-[120px] resize-none py-2"
            />
            
            <Button type="submit" disabled={!newMessage.trim()} className="bg-violet-600 hover:bg-violet-500 rounded-xl w-10 h-10 p-0">
              <Send className="w-5 h-5" />
            </Button>
          </form>
        </div>
      </main>
      <AddRoomModal isOpen={isAddRoomOpen} onClose={() => setIsAddRoomOpen(false)} onSuccess={() => loadRoomsAndSync()} />
    </div>
  );
}
