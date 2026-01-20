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
  
  const [summarySidebarOpen, setSummarySidebarOpen] = useState(false);
  const [developModalOpen, setDevelopModalOpen] = useState(false);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(localStorage.getItem('lastActiveRoomId'));
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [pendingMessages, setPendingMessages] = useState<any[]>([]);
  
  const { toast } = useToast();

  const handleRoomChange = (id: string) => {
    setActiveRoomId(id);
    localStorage.setItem('lastActiveRoomId', id);
  };

  const handleSummarize = async (selectedSummaryIds: string[]) => {
    if (!activeRoomId || pendingMessages.length === 0) return;
    setIsSummarizing(true);
    try {
      const { data: room } = await supabase.from('rooms').select('*').eq('id', activeRoomId).single();
      if (!room?.encrypted_api_key) throw new Error("API Key mancante per questa stanza.");

      const { data: sums } = await supabase.from('summaries').select('content').in('id', selectedSummaryIds);
      
      const result = await summarizeConversation({
        messages: pendingMessages.map(m => ({ user: 'Member', content: m.content })),
        previousSummaries: sums?.map(s => s.content) || [],
        provider: room.ai_provider,
        apiKey: room.encrypted_api_key
      });

      const timestamp = new Date().toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      await supabase.from('summaries').insert({ room_id: activeRoomId, title: `Analisi ${timestamp}`, content: result });

      toast({ title: "Analisi completata" });
      setSummarySidebarOpen(false);
      setPendingMessages([]);
    } catch (err: any) {
      toast({ title: "Errore AI", description: err.message, variant: "destructive" });
    } finally {
      setIsSummarizing(false);
    }
  };

  // LOGICA DI RENDERING CHIARA
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-950">
        <Loader2 className="h-10 w-10 text-violet-500 animate-spin" />
      </div>
    );
  }

  // 1. Se non c'è utente -> Login
  if (!user) {
    return authMode === 'login' ? (
      <Login onToggleMode={() => setAuthMode('register')} />
    ) : (
      <Register onToggleMode={() => setAuthMode('login')} />
    );
  }

  // 2. Se c'è utente ma non ha finito il setup -> Setup
  if (!profile?.has_completed_setup) {
    return <Setup />;
  }

  // 3. Router interno per le viste speciali
  if (currentView === 'settings') return <Settings onBack={() => setCurrentView('chat')} />;
  if (currentView === 'admin' && (user.email === 'info@luigicopertino.it' || user.email === 'unixgigi@gmail.com')) {
    return <AdminDashboard onBack={() => setCurrentView('chat')} />;
  }

  // 4. Vista principale
  return (
    <>
      <Chat
        activeRoomId={activeRoomId}
        onRoomChange={handleRoomChange}
        onNavigateToSettings={() => setCurrentView('settings')}
        onNavigateToAdmin={() => setCurrentView('admin')}
        onSummarize={(msgs) => { setPendingMessages(msgs); setSummarySidebarOpen(true); }}
        onDevelop={() => setDevelopModalOpen(true)}
      />
      <SummarySidebar isOpen={summarySidebarOpen} roomId={activeRoomId} onClose={() => setSummarySidebarOpen(false)} onGenerate={handleSummarize} loading={isSummarizing} />
      <DevelopModal isOpen={developModalOpen} onClose={() => setDevelopModalOpen(false)} onDevelop={async () => { toast({title: "Richiesta MCP inviata"}); setDevelopModalOpen(false); }} />
      <Toaster />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
