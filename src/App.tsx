import { useState } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { Setup } from '@/pages/Setup';
import { Chat } from '@/pages/Chat';
import { Settings } from '@/pages/Settings';
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
  const [currentView, setCurrentView] = useState<'chat' | 'settings'>('chat');
  
  // Modals & Sidebars
  const [summarySidebarOpen, setSummarySidebarOpen] = useState(false);
  const [developModalOpen, setDevelopModalOpen] = useState(false);
  
  // State per la logica Multi-Stanza e Summarize
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [pendingMessageIds, setPendingMessageIds] = useState<string[]>([]);

  const { toast } = useToast();

  /**
   * Logica Chirurgica per il Riassunto a Strati (Layered Context)
   * Riceve i messaggi selezionati dalla Chat e i riassunti scelti dalla Sidebar.
   */
  const handleSummarize = async (selectedSummaryIds: string[]) => {
    if (!profile?.encrypted_api_key || !activeRoomId) {
      toast({ 
        title: "Configurazione incompleta", 
        description: "Assicurati di aver impostato l'API Key e di essere in una stanza.", 
        variant: "destructive" 
      });
      return;
    }

    if (pendingMessageIds.length === 0) {
      toast({ title: "Nessun messaggio", description: "Seleziona almeno un messaggio dalla chat.", variant: "destructive" });
      return;
    }

    setIsSummarizing(true);
    try {
      // 1. Recupera i contenuti dei messaggi selezionati
      const { data: msgs, error: msgsError } = await supabase
        .from('messages')
        .select('content, user_id')
        .in('id', pendingMessageIds);

      if (msgsError) throw msgsError;

      // 2. Recupera i contenuti dei riassunti precedenti selezionati
      let previousLayers: string[] = [];
      if (selectedSummaryIds.length > 0) {
        const { data: sums, error: sumsError } = await supabase
          .from('summaries')
          .select('content')
          .in('id', selectedSummaryIds);
        
        if (sumsError) throw sumsError;
        previousLayers = sums?.map(s => s.content) || [];
      }

      // 3. Formatta per l'AI
      const formattedMsgs = msgs?.map(m => ({
        user: 'Team Member',
        content: m.content
      })) || [];

      // 4. Chiama Gemini/OpenAI/Anthropic tramite il nostro servizio AI
      const result = await summarizeConversation({
        messages: formattedMsgs,
        previousSummaries: previousLayers,
        provider: profile.ai_provider as any,
        apiKey: profile.encrypted_api_key
      });

      // 5. Salva il nuovo riassunto nel database (Snapshot Archive)
      const timestamp = new Date().toLocaleString('it-IT', { 
        day: '2d', month: '2d', year: 'numeric', 
        hour: '2d', minute: '2d' 
      });
      
      const { error: saveError } = await supabase
        .from('summaries')
        .insert({
          room_id: activeRoomId,
          title: `Summary ${timestamp}`,
          content: result
        });

      if (saveError) throw saveError;

      toast({ 
        title: "Analisi completata", 
        description: "Il nuovo riassunto è stato salvato nell'archivio della stanza." 
      });
      
      // Reset stati e chiusura sidebar
      setPendingMessageIds([]);
      setSummarySidebarOpen(false);

    } catch (err: any) {
      console.error('Summarize error:', err);
      toast({ 
        title: "Errore durante l'analisi", 
        description: err.message || "Errore sconosciuto", 
        variant: "destructive" 
      });
    } finally {
      setIsSummarizing(false);
    }
  };

  /**
   * Logica per il pulsante Develop (Interfaccia verso MCP)
   */
  const handleDevelop = async () => {
    if (!profile?.mcp_endpoint) {
      toast({ 
        title: "Configurazione mancante", 
        description: "Inserisci l'endpoint del tuo server MCP nelle Impostazioni.", 
        variant: "destructive" 
      });
      return;
    }

    // Qui implementeremo la chiamata reale all'MCP Bridge in Fase 3
    await new Promise((resolve) => setTimeout(resolve, 5000));

    toast({
      title: 'Sviluppo avviato',
      description: 'L\'agente MCP sta elaborando il progetto. Riceverai una email a breve.',
    });
  };

  /**
   * Gestione dello stato di caricamento iniziale
   */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
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
   * Gestione setup iniziale AI/MCP
   */
  if (!profile?.has_completed_setup) {
    return <Setup />;
  }

  /**
   * Vista Impostazioni
   */
  if (currentView === 'settings') {
    return <Settings onBack={() => setCurrentView('chat')} />;
  }

  /**
   * Vista Principale (Chat + Sidebars)
   */
  return (
    <>
      <Chat
        activeRoomId={activeRoomId}
        onRoomChange={setActiveRoomId}
        onNavigateToSettings={() => setCurrentView('settings')}
        onSummarize={(selectedMessages) => {
          // Quando l'utente conferma la selezione in Chat.tsx
          const ids = selectedMessages.map(m => m.id);
          setPendingMessageIds(ids);
          setSummarySidebarOpen(true); // Apriamo la sidebar per permettere di scegliere i layer precedenti
        }}
        onDevelop={() => setDevelopModalOpen(true)}
      />

      <SummarySidebar
        isOpen={summarySidebarOpen}
        roomId={activeRoomId}
        onClose={() => {
          setSummarySidebarOpen(false);
          setPendingMessageIds([]); // Reset se chiude senza generare
        }}
        onGenerate={handleSummarize}
        loading={isSummarizing}
      />

      <DevelopModal
        isOpen={developModalOpen}
        onClose={() => setDevelopModalOpen(false)}
        onDevelop={handleDevelop}
      />
    </>
  );
}

/**
 * Entry point dell'applicazione con AuthProvider
 */
function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster />
    </AuthProvider>
  );
}

export default App;
