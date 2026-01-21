import { useState, useEffect } from 'react'; // Aggiunto useEffect
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
  // 📱 FIX GLOBALE TASTIERA & VIEWPORT (iOS PWA)
  // ═══════════════════════════════════════════════════════════════════
  useEffect(() => {
    const updateHeight = () => {
      if (window.visualViewport) {
        // Imposta l'altezza reale visibile escludendo la tastiera
        document.documentElement.style.setProperty('--vh', `${window.visualViewport.height}px`);
        // Impedisce spostamenti indesiderati di Safari
        if (window.visualViewport.height < window.innerHeight) {
          window.scrollTo(0, 0);
        }
      }
    };

    window.visualViewport?.addEventListener('resize', updateHeight);
    window.visualViewport?.addEventListener('scroll', updateHeight);
    updateHeight();

    return () => {
      window.visualViewport?.removeEventListener('resize', updateHeight);
      window.visualViewport?.removeEventListener('scroll', updateHeight);
    };
  }, []);

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

  // 🔐 STEP 1: AUTH LOADING
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

  // 🚫 STEP 2: NO USER
  if (!user) {
    return authMode === 'login' ? (
      <Login onToggleMode={() => setAuthMode('register')} />
    ) : (
      <Register onToggleMode={() => setAuthMode('login')} />
    );
  }

  // ⏳ STEP 3 & 4: PROFILO LOADING / ERRORI
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

  if (!profile && !profileLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center space-y-6 max-w-md px-6">
          <div className="text-6xl">⚠️</div>
          <h1 className="text-xl font-bold text-white">Errore Sincronizzazione</h1>
          <button onClick={() => window.location.reload()} className="px-6 py-3 bg-violet-600 text-white rounded-lg text-sm">🔄 Riprova</button>
        </div>
      </div>
    );
  }

  // 🎯 STEP 5, 6, 7: VISTE AUTENTICATE (Avvolte nell'app-shell per Safe Area iOS)
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
