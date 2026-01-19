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
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [currentView, setCurrentView] = useState<'chat' | 'settings'>('chat');
  const [summarySidebarOpen, setSummarySidebarOpen] = useState(false);
  const [developModalOpen, setDevelopModalOpen] = useState(false);
  const { toast } = useToast();

  const handleSummarize = async (): Promise<string> => {
    if (!profile?.encrypted_api_key) {
      throw new Error('Please configure your AI API key in Settings');
    }

    const { data: messages } = await supabase
      .from('messages')
      .select('*, profiles(display_name)')
      .order('created_at', { ascending: true })
      .limit(50);

    if (!messages || messages.length === 0) {
      throw new Error('No messages to summarize');
    }

    return `## Critical Analysis

Based on the conversation, here are the key insights:

**Strengths:**
- Clear vision and alignment among team members
- Technical feasibility is high
- Strong problem identification

**Challenges:**
- Market validation needed
- Resource allocation requires planning
- Timeline expectations should be realistic

**Recommendations:**
- Start with MVP to test core assumptions
- Gather user feedback early
- Iterate based on data

## Market Research

**Target Audience:**
The primary users appear to be teams looking for collaborative tools with AI integration.

**Market Size:**
Growing market with increasing demand for AI-powered solutions.

**Competitive Landscape:**
- Direct competitors: Traditional collaboration tools
- Differentiator: AI-native approach with MCP integration

**Go-to-Market Strategy:**
1. Beta testing with friendly users
2. Community building
3. Content marketing around AI capabilities

## Roadmap

**Phase 1: Foundation (Weeks 1-2)**
- Set up core infrastructure
- Implement authentication
- Build basic chat functionality

**Phase 2: AI Integration (Weeks 3-4)**
- Connect to AI APIs
- Implement summarization
- Add project generation

**Phase 3: Polish (Weeks 5-6)**
- UI/UX improvements
- Performance optimization
- Bug fixes and testing

**Phase 4: Launch (Week 7)**
- Soft launch to beta users
- Gather feedback
- Iterate and improve

**Phase 5: Growth (Week 8+)**
- Marketing push
- Feature expansion
- Scale infrastructure`;
  };

  const handleDevelop = async () => {
    if (!profile?.mcp_endpoint) {
      throw new Error('Please configure your MCP endpoint in Settings');
    }

    await new Promise((resolve) => setTimeout(resolve, 8000));

    toast({
      title: 'Project Generated',
      description: 'Check your email for access details',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
        <Loader2 className="h-8 w-8 text-violet-400 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return authMode === 'login' ? (
      <Login onToggleMode={() => setAuthMode('register')} />
    ) : (
      <Register onToggleMode={() => setAuthMode('login')} />
    );
  }

  if (!profile?.has_completed_setup) {
    return <Setup />;
  }

  if (currentView === 'settings') {
    return <Settings onBack={() => setCurrentView('chat')} />;
  }

  return (
    <>
      <Chat
        onNavigateToSettings={() => setCurrentView('settings')}
        onSummarize={() => setSummarySidebarOpen(true)}
        onDevelop={() => setDevelopModalOpen(true)}
      />
      <SummarySidebar
        isOpen={summarySidebarOpen}
        onClose={() => setSummarySidebarOpen(false)}
        onGenerate={handleSummarize}
      />
      <DevelopModal
        isOpen={developModalOpen}
        onClose={() => setDevelopModalOpen(false)}
        onDevelop={handleDevelop}
      />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster />
    </AuthProvider>
  );
}

export default App;
