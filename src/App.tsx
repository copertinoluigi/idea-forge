import { useState } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { Setup } from '@/pages/Setup';
import { Chat } from '@/pages/Chat';
import { Settings } from '@/pages/Settings';
import { AdminDashboard } from '@/pages/AdminDashboard';
import { SummarySidebar } from '@/components/SummarySidebar';
import { DevelopModal } from '@/components/DevelopModal';
import { Toaster } from '@/components/ui/toaster';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { summarizeConversation } from '@/lib/ai-service';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [currentView, setCurrentView] = useState<'chat' | 'settings' | 'admin'>('chat');
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [summarySidebarOpen, setSummarySidebarOpen] = useState(false);
  const [developModalOpen, setDevelopModalOpen] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [pendingMessages, setPendingMessages] = useState<any[]>([]);
  const { toast } = useToast();

  const handleSummarize = async (selectedSummaryIds: string[]) => {
    if (!activeRoomId || pendingMessages.length === 0) return;
    setIsSummarizing(true);
    try {
      const { data: room } = await supabase.from('rooms').select('*').eq('id', activeRoomId).single();
      const { data: sums } = await supabase.from('summaries').select('content').in('id', selectedSummaryIds);
      const result = await summarizeConversation({
        messages: pendingMessages.map(m => ({ user: 'Member', content: m.content })),
        previousSummaries: sums?.map(s => s.content) || [],
        provider: room?.ai_provider || 'google-flash',
        apiKey: room?.encrypted_api_key || profile?.encrypted_api_key || ''
      });

      const timestamp = new Date().toLocaleString('it-IT', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
      await supabase.from('summaries').insert({ room_id: activeRoomId, title: `Summary ${timestamp}`, content: result });
      toast({ title: "Analisi salvata" });
      setSummarySidebarOpen(false);
    } catch (err: any) {
      toast({ title: "Errore AI", description: err.message, variant: "destructive" });
    } finally { setIsSummarizing(false); setPendingMessages([]); }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-gray-950"><div className="text-center space-y-4"><Loader2 className="animate-spin text-violet-500 h-10 w-10 mx-auto" /><p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em]">IdeaForge Sincronizzazione...</p></div></div>;
  if (!user) return authMode === 'login' ? <Login onToggleMode={() => setAuthMode('register')} /> : <Register onToggleMode={() => setAuthMode('login')} />;
  if (!profile?.has_completed_setup) return <Setup />;
  
  if (currentView === 'settings') return <Settings onBack={() => setCurrentView('chat')} />;
  if (currentView === 'admin') return <AdminDashboard onBack={() => setCurrentView('chat')} />;

  return (
    <>
      <Chat
        activeRoomId={activeRoomId}
        onRoomChange={setActiveRoomId}
        onNavigateToSettings={() => setCurrentView('settings')}
        onNavigateToAdmin={() => setCurrentView('admin')}
        onSummarize={(msgs) => { setPendingMessages(msgs); setSummarySidebarOpen(true); }}
        onDevelop={() => setDevelopModalOpen(true)}
      />
      <SummarySidebar isOpen={summarySidebarOpen} roomId={activeRoomId} onClose={() => setSummarySidebarOpen(false)} onGenerate={handleSummarize} loading={isSummarizing} />
      <DevelopModal isOpen={developModalOpen} onClose={() => setDevelopModalOpen(false)} onDevelop={async () => { toast({title: "Richiesta inviata"}); setDevelopModalOpen(false); }} />
      <Toaster />
    </>
  );
}

function App() { return <AuthProvider><AppContent /></AuthProvider>; }
export default App;
