import { useState, useEffect } from 'react';
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

  // Gestione del cambio stanza con salvataggio immediato
  const handleRoomChange = (id: string) => {
    setActiveRoomId(id);
    localStorage.setItem('lastActiveRoomId', id);
  };

  const handleSummarize = async (selectedSummaryIds: string[]) => {
    if (!activeRoomId || pendingMessages.length === 0) return;
    
    setIsSummarizing(true);
    try {
      // Recupera le impostazioni specifiche della stanza (API Key)
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', activeRoomId)
        .single();

      if (roomError || !room?.encrypted_api_key) {
        throw new Error("API Key mancante per questa stanza. Controlla le impostazioni della stanza.");
      }

      // Recupera i vecchi riassunti se selezionati
      const { data: sums } = await supabase
        .from('summaries')
        .select('content')
        .in('id', selectedSummaryIds);
      
      const result = await summarizeConversation({
        messages: pendingMessages.map(m => ({ user: 'Member', content: m.content })),
        previousSummaries: sums?.map(s => s.content) || [],
        provider: room.ai_provider,
        apiKey: room.encrypted_api_key
      });

      const timestamp = new Date().toLocaleString('it-IT', { 
        day: '2-digit', month: '2-digit', year: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
      });

      // Salva il nuovo layer nell'archivio
      const { error: saveError } = await supabase.from('summaries').insert({ 
        room_id: activeRoomId, 
        title: `Analisi ${timestamp}`, 
        content: result 
      });

      if (saveError) throw saveError;

      toast({ title: "Analisi completata", description: "Il nuovo layer è stato salvato in archivio." });
      setSummarySidebarOpen(false);
      setPendingMessages([]);

    } catch (err: any) {
      console.error("App: Summarize Error", err);
      toast({ title: "Errore AI", description: err.message, variant: "destructive" });
    } finally {
      setIsSummarizing(false);
    }
  };

  // --- LOGICA DI RENDERING ---

  // 1. Schermata di caricamento (con timeout di sicurezza per evitare l'hang infinito)
  const [showLoading, setShowLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) setShowLoading(false); // Forza l'uscita se Supabase è troppo lento
    }, 5000);
    if (!loading && (user ? profile : true)) setShowLoading(false);
    return () => clearTimeout(timer);
  }, [loading, user, profile]);

  if (showLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 text-violet-500 animate-spin mx-auto" />
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Sincronizzazione...</p>
        </div>
      </div>
    );
  }

  // 2. Se non loggato, mostra Login o Register
  if (!user) {
    return authMode === 'login' ? (
      <Login onToggleMode={() => setAuthMode('register')} />
    ) : (
      <Register onToggleMode={() => setAuthMode('login')} />
    );
  }

  // 3. Se loggato ma non ha fatto il setup iniziale, obbligalo
  if (!profile?.has_completed_setup) {
    return <Setup />;
  }

  // 4. Gestione delle viste (Router interno)
  if (currentView === 'settings') {
    return <Settings onBack={() => setCurrentView('chat')} />;
  }

  if (currentView === 'admin' && (user.email === 'info@luigicopertino.it' || user.email === 'unixgigi@gmail.com')) {
    return <AdminDashboard onBack={() => setCurrentView('chat')} />;
  }

  // 5. Vista principale: Chat
  return (
    <>
      <Chat
        activeRoomId={activeRoomId}
        onRoomChange={handleRoomChange}
        onNavigateToSettings={() => setCurrentView('settings')}
        onNavigateToAdmin={() => setCurrentView('admin')}
        onSummarize={(msgs) => { 
          setPendingMessages(msgs); 
          setSummarySidebarOpen(true); 
        }}
        onDevelop={() => setDevelopModalOpen(true)}
      />

      <SummarySidebar 
        isOpen={summarySidebarOpen} 
        roomId={activeRoomId} 
        onClose={() => {
          setSummarySidebarOpen(false);
          setPendingMessages([]);
        }} 
        onGenerate={handleSummarize} 
        loading={isSummarizing} 
      />

      <DevelopModal 
        isOpen={developModalOpen} 
        onClose={() => setDevelopModalOpen(false)} 
        onDevelop={async () => {
          // Logica placeholder per l'attivazione MCP (Fase 3)
          toast({ title: "Sviluppo avviato", description: "Richiesta inviata al server MCP." });
          setDevelopModalOpen(false);
        }} 
      />

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
