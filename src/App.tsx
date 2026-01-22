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
  const { user, profile, loading, profileLoading } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [currentView, setCurrentView] = useState<'chat' | 'settings' | 'admin'>('chat');
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [summarySidebarOpen, setSummarySidebarOpen] = useState(false);
  const [developModalOpen, setDevelopModalOpen] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [pendingMessages, setPendingMessages] = useState<any[]>([]);
  const { toast } = useToast();

  // ═══════════════════════════════════════════════════════════════════
  // 📱 FIX ANTI-PANNING iOS (Mantiene l'interfaccia stabile)
  // ═══════════════════════════════════════════════════════════════════
  useEffect(() => {
    const handleViewportChange = () => {
      if (window.visualViewport) {
        const vv = window.visualViewport;
        document.documentElement.style.setProperty('--vh', `${vv.height}px`);
        if (window.scrollY !== 0) {
          window.scrollTo(0, 0);
        }
      }
    };

    window.visualViewport?.addEventListener('resize', handleViewportChange);
    window.visualViewport?.addEventListener('scroll', handleViewportChange);
    handleViewportChange();

    return () => {
      window.visualViewport?.removeEventListener('resize', handleViewportChange);
      window.visualViewport?.removeEventListener('scroll', handleViewportChange);
    };
  }, []);

  const handleRoomChange = (id: string) => {
    setActiveRoomId(id);
    localStorage.setItem('lastActiveRoomId', id);
  };

  // ═══════════════════════════════════════════════════════════════════
  // 🧠 LOGICA RIASSUNTO SPLITTATA (Modalità 1 e 2)
  // ═══════════════════════════════════════════════════════════════════
  const handleSummarize = async (selectedSummaryIds: string[], mode: 'snapshot' | 'simple' = 'snapshot') => {
    if (!activeRoomId || pendingMessages.length === 0) return;
    setIsSummarizing(true);
    try {
      const { data: room } = await supabase.from('rooms').select('*').eq('id', activeRoomId).single();
      const { data: sums } = await supabase.from('summaries').select('content').in('id', selectedSummaryIds);
      
      // Istruzioni dinamiche in base alla modalità scelta
      const customInstructions = mode === 'simple' 
        ? "Genera un riassunto colloquiale, asciutto e veloce dei punti chiave. Usa un tono informale ma preciso."
        : "Analizza la conversazione e trasforma le idee in un asset strutturato (Snapshot) con sezioni definite, pronto per essere usato come base tecnica (Blueprint).";

      const result = await summarizeConversation({
        messages: pendingMessages.map(m => ({ user: 'Member', content: m.content })),
        previousSummaries: sums?.map(s => s.content) || [],
        provider: room?.ai_provider || 'google-flash',
        apiKey: room?.encrypted_api_key || profile?.encrypted_api_key || '',
        customInstructions // Passiamo le istruzioni specifiche al servizio AI
      });

      const timestamp = new Date().toLocaleString('it-IT', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
      const title = mode === 'simple' ? `Recap ${timestamp}` : `Snapshot ${timestamp}`;

      await supabase.from('summaries').insert({ 
        room_id: activeRoomId, 
        title: title, 
        content: result 
      });

      toast({ title: mode === 'simple' ? "Recap generato" : "Snapshot salvato" });
      setSummarySidebarOpen(false);
    } catch (err: any) {
      toast({ title: "Errore AI", description: err.message, variant: "destructive" });
    } finally { 
      setIsSummarizing(false); 
      setPendingMessages([]); 
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // 🔐 LOGICHE DI CARICAMENTO E AUTENTICAZIONE
  // ═══════════════════════════════════════════════════════════════════
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-violet-500 h-10 w-10 mx-auto" />
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em]">BYOI Auth Check...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return authMode === 'login' ? <Login onToggleMode={() => setAuthMode('register')} /> : <Register onToggleMode={() => setAuthMode('login')} />;
  }

  if (!profile && profileLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-violet-500 h-10 w-10 mx-auto" />
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em]">Caricamento Profilo...</p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // 🎯 RENDER APP SHELL (Layout Protettore)
  // ═══════════════════════════════════════════════════════════════════
  return (
    <div className="app-shell">
      {profile && profile.has_completed_setup === false ? (
        <Setup />
      ) : currentView === 'settings' ? (
        <Settings onBack={() => setCurrentView('chat')} />
      ) : currentView === 'admin' ? (
        <AdminDashboard onBack={() => setCurrentView('chat')} />
      ) : (
        <>
          <Chat
            activeRoomId={activeRoomId}
            onRoomChange={handleRoomChange}
            onNavigateToSettings={() => setCurrentView('settings')}
            onNavigateToAdmin={() => setCurrentView('admin')}
            // Passiamo i messaggi selezionati allo stato locale e apriamo la sidebar
            onSummarize={(msgs) => { setPendingMessages(msgs); setSummarySidebarOpen(true); }}
            onDevelop={() => setDevelopModalOpen(true)}
          />
          <SummarySidebar 
            isOpen={summarySidebarOpen} 
            roomId={activeRoomId} 
            onClose={() => setSummarySidebarOpen(false)} 
            onGenerate={handleSummarize} // Ora accetta (ids, mode)
            loading={isSummarizing} 
          />
          <DevelopModal 
            isOpen={developModalOpen} 
            onClose={() => setDevelopModalOpen(false)} 
            onDevelop={async () => {}} 
          />
          <Toaster />
        </>
      )}
    </div>
  );
}

export default function App() { 
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  ); 
}
