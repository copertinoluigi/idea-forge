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
  const { user, profile, loading, profileLoading } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [currentView, setCurrentView] = useState<'chat' | 'settings' | 'admin'>('chat');
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [summarySidebarOpen, setSummarySidebarOpen] = useState(false);
  const [developModalOpen, setDevelopModalOpen] = useState(false);
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
      const { data: sums } = await supabase.from('summaries').select('content').in('id', selectedSummaryIds);
      const result = await summarizeConversation({
        messages: pendingMessages.map(m => ({ user: 'Member', content: m.content })),
        previousSummaries: sums?.map(s => s.content) || [],
        provider: room?.ai_provider || 'google-flash',
        apiKey: room?.encrypted_api_key || profile?.encrypted_api_key || ''
      });
      const timestamp = new Date().toLocaleString('it-IT', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
      await supabase.from('summaries').insert({ room_id: activeRoomId, title: `Snapshot ${timestamp}`, content: result });
      toast({ title: "Layer salvato!" });
      setSummarySidebarOpen(false);
    } catch (err: any) {
      toast({ title: "Errore AI", description: err.message, variant: "destructive" });
    } finally { setIsSummarizing(false); setPendingMessages([]); }
  };

  // ═══════════════════════════════════════════════════════════════════
  // 🔐 STEP 1: AUTH LOADING (controllo sessione Supabase)
  // ═══════════════════════════════════════════════════════════════════
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-violet-500 h-10 w-10 mx-auto" />
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em]">
            BYOI Auth Check...
          </p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // 🚫 STEP 2: NO USER → LOGIN/REGISTER
  // ═══════════════════════════════════════════════════════════════════
  if (!user) {
    return authMode === 'login' ? (
      <Login onToggleMode={() => setAuthMode('register')} />
    ) : (
      <Register onToggleMode={() => setAuthMode('login')} />
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // ⏳ STEP 3: USER OK, PROFILO IN CARICAMENTO
  // ═══════════════════════════════════════════════════════════════════
  // Mostriamo un loader SOLO se il profilo è ancora null E sta caricando
  // (evita flash di contenuto per profili già in cache)
  if (!profile && profileLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-violet-500 h-10 w-10 mx-auto" />
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em]">
            Caricamento Profilo...
          </p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // ❌ STEP 4: PROFILO NULL DOPO CARICAMENTO → ERRORE CRITICO
  // ═══════════════════════════════════════════════════════════════════
  // Se l'utente è loggato ma il profilo è null e NON sta caricando,
  // significa che c'è un problema (RLS bloccata, DB down, etc.)
  if (!profile && !profileLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center space-y-6 max-w-md px-6">
          <div className="text-6xl">⚠️</div>
          <h1 className="text-xl font-bold text-white">Errore Sincronizzazione</h1>
          <p className="text-sm text-gray-400">
            Il tuo profilo non è stato caricato. Possibili cause:
          </p>
          <ul className="text-xs text-gray-500 text-left space-y-2">
            <li>• Database non raggiungibile</li>
            <li>• Permessi RLS bloccati</li>
            <li>• Profilo eliminato manualmente dal DB</li>
          </ul>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            🔄 Riprova
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // ✅ STEP 5: PROFILO OK → CONTROLLO SETUP
  // ═══════════════════════════════════════════════════════════════════
  if (profile && profile.has_completed_setup === false) {
    return <Setup />;
  }

  // ═══════════════════════════════════════════════════════════════════
  // 🎯 STEP 6: ROUTER VISTE AUTENTICATE
  // ═══════════════════════════════════════════════════════════════════
  if (currentView === 'settings') {
    return <Settings onBack={() => setCurrentView('chat')} />;
  }
  
  if (currentView === 'admin') {
    return <AdminDashboard onBack={() => setCurrentView('chat')} />;
  }

  // ═══════════════════════════════════════════════════════════════════
  // 💬 STEP 7: CHAT (DEFAULT VIEW)
  // ═══════════════════════════════════════════════════════════════════
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
      <SummarySidebar 
        isOpen={summarySidebarOpen} 
        roomId={activeRoomId} 
        onClose={() => setSummarySidebarOpen(false)} 
        onGenerate={handleSummarize} 
        loading={isSummarizing} 
      />
      <DevelopModal 
        isOpen={developModalOpen} 
        onClose={() => setDevelopModalOpen(false)} 
        onDevelop={async () => {}} 
      />
      <Toaster />
    </>
  );
}

export default function App() { 
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  ); 
}
