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
  
  // Modals & Sidebars
  const [summarySidebarOpen, setSummarySidebarOpen] = useState(false);
  const [developModalOpen, setDevelopModalOpen] = useState(false);
  
  // State per la logica Multi-Stanza e Summarize
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [pendingMessages, setPendingMessages] = useState<any[]>([]);

  const { toast } = useToast();

  /**
   * Logica per il Riassunto a Strati (Layered Context)
   * Riceve i riassunti scelti dalla Sidebar.
   */
  const handleSummarize = async (selectedSummaryIds: string[]) => {
    if (!activeRoomId || pendingMessages.length === 0) {
      toast({ title: "Attenzione", description: "Seleziona i messaggi e assicurati di essere in una stanza.", variant: "destructive" });
      return;
    }

    setIsSummarizing(true);
    try {
      // 1. Recupera la stanza per avere la chiave API specifica della stanza
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', activeRoomId)
        .single();

      if (roomError || !room?.encrypted_api_key) {
        throw new Error("API Key non trovata per questa stanza. Configurala nei settings della stanza.");
      }

      // 2. Recupera i contenuti dei riassunti precedenti selezionati (Layers)
      let previousLayers: string[] = [];
      if (selectedSummaryIds.length > 0) {
        const { data: sums } = await supabase
          .from('summaries')
          .select('content')
          .in('id', selectedSummaryIds);
        previousLayers = sums?.map(s => s.content) || [];
      }

      // 3. Formatta i messaggi selezionati
      const formattedMsgs = pendingMessages.map(m => ({
        user: 'Team Member',
        content: m.content
      }));

      // 4. Chiama il servizio AI
      const result = await summarizeConversation({
        messages: formattedMsgs,
        previousSummaries: previousLayers,
        provider: room.ai_provider as any,
        apiKey: room.encrypted_api_key
      });

      // 5. Salva il nuovo riassunto
      const timestamp = new Date().toLocaleString('it-IT', { 
        day: '2-digit', month: '2-digit', year: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
      });
      
      const { error: saveError } = await supabase
        .from('summaries')
        .insert({
          room_id: activeRoomId,
          title: `Summary ${timestamp}`,
          content: result
        });

      if (saveError) throw saveError;

      toast({ title: "Analisi completata", description: "Nuovo snapshot salvato con successo." });
      setSummarySidebarOpen(false);
      setPendingMessages([]);

    } catch (err: any) {
      console.error(err);
      toast({ title: "Errore AI", description: err.message, variant: "destructive" });
    } finally {
      setIsSummarizing(false);
    }
  };

  /**
   * Gestione dello stato di caricamento iniziale
   */
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-950">
        <Loader2 className="h-8 w-8 text-violet-400 animate-spin" />
      </div>
    );
  }

  /**
   * Gestione autenticazione
   */
  if (!user) {
    return authMode === 'login' ? (
      <Login onToggleMode={() => setAuthMode('register')} />
    ) : (
      <Register onToggleMode={() => setAuthMode('login')} />
    );
  }

  /**
   * Gestione setup iniziale obbligatorio
   */
  if (!profile?.has_completed_setup) {
    return <Setup />;
  }

  /**
   * Router interno
   */
  if (currentView === 'settings') {
    return <Settings onBack={() => setCurrentView('chat')} />;
  }

  if (currentView === 'admin' && user.email === 'info@luigicopertino.it') {
    return <AdminDashboard onBack={() => setCurrentView('chat')} />;
  }

  return (
    <>
      <Chat
        activeRoomId={activeRoomId}
        onRoomChange={setActiveRoomId}
        onNavigateToSettings={() => setCurrentView('settings')}
        onNavigateToAdmin={() => setCurrentView('admin')}
        onSummarize={(selectedMessages) => {
          setPendingMessages(selectedMessages);
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
          await new Promise(r => setTimeout(r, 4000));
          toast({ title: "Develop Triggered", description: "Richiesta inviata all'MCP." });
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
