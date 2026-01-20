import { useState } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { Setup } from '@/pages/Setup';
import { Chat } from '@/pages/Chat';
import { Settings } from '@/pages/Settings';
import { AdminDashboard } from '@/pages/AdminDashboard'; // Lo creeremo ora
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
  const [summarySidebarOpen, setSummarySidebarOpen] = useState(false);
  const [developModalOpen, setDevelopModalOpen] = useState(false);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [pendingMessageIds, setPendingMessageIds] = useState<string[]>([]);
  const { toast } = useToast();

  const handleSummarize = async (selectedSummaryIds: string[]) => {
    if (!activeRoomId) return;
    setIsSummarizing(true);
    try {
      // Recupera la stanza per avere la chiave API specifica della stanza
      const { data: room } = await supabase.from('rooms').select('*').eq('id', activeRoomId).single();
      if (!room?.encrypted_api_key) throw new Error("API Key non trovata per questa stanza");

      const { data: msgs } = await supabase.from('messages').select('content').in('id', pendingMessageIds);
      const { data: sums } = await supabase.from('summaries').select('content').in('id', selectedSummaryIds);
      
      const result = await summarizeConversation({
        messages: msgs?.map(m => ({ user: 'Team Member', content: m.content })) || [],
        previousSummaries: sums?.map(s => s.content) || [],
        provider: room.ai_provider as any,
        apiKey: room.encrypted_api_key
      });

      const timestamp = new Date().toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      await supabase.from('summaries').insert({ room_id: activeRoomId, title: `Summary ${timestamp}`, content: result });
      toast({ title: "Analisi completata" });
      setSummarySidebarOpen(false);
    } catch (err: any) {
      toast({ title: "Errore", description: err.message, variant: "destructive" });
    } finally {
      setIsSummarizing(false);
      setPendingMessageIds([]);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-gray-950"><Loader2 className="h-8 w-8 text-violet-400 animate-spin" /></div>;
  if (!user) return authMode === 'login' ? <Login onToggleMode={() => setAuthMode('register')} /> : <Register onToggleMode={() => setAuthMode('login')} />;
  if (!profile?.has_completed_setup) return <Setup />;
  if (currentView === 'settings') return <Settings onBack={() => setCurrentView('chat')} />;
  if (currentView === 'admin' && user.email === 'info@luigicopertino.it') return <AdminDashboard onBack={() => setCurrentView('chat')} />;

  return (
    <>
      <Chat
        activeRoomId={activeRoomId}
        onRoomChange={setActiveRoomId}
        onNavigateToSettings={() => setCurrentView('settings')}
        onNavigateToAdmin={() => setCurrentView('admin')}
        onSummarize={(messages) => { setPendingMessageIds(messages.map(m => m.id)); setSummarySidebarOpen(true); }}
        onDevelop={() => setDevelopModalOpen(true)}
      />
      <SummarySidebar isOpen={summarySidebarOpen} roomId={activeRoomId} onClose={() => setSummarySidebarOpen(false)} onGenerate={handleSummarize} loading={isSummarizing} />
      <DevelopModal isOpen={developModalOpen} onClose={() => setDevelopModalOpen(false)} onDevelop={async () => {}} />
    </>
  );
}

function App() { return <AuthProvider><AppContent /><Toaster /></AuthProvider>; }
export default App;
