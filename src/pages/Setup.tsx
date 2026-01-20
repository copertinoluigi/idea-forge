import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { AI_PROVIDERS, type AIProvider } from '@/lib/ai-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles } from 'lucide-react';

export function Setup() {
  const [aiProvider, setAiProvider] = useState<AIProvider>('google-flash');
  const [apiKey, setApiKey] = useState('');
  const [mcpEndpoint, setMcpEndpoint] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    
    try {
      console.log("Inizio salvataggio setup per utente:", user.id);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          ai_provider: aiProvider,
          encrypted_api_key: apiKey,
          mcp_endpoint: mcpEndpoint,
          has_completed_setup: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      console.log("Database aggiornato, rinfresco profilo...");
      await refreshProfile();
      
      toast({ title: 'Configurazione Salvata', description: 'Benvenuto in IdeaForge.' });
    } catch (error: any) {
      console.error("Setup Error:", error);
      toast({
        title: 'Errore durante il setup',
        description: error.message || 'Verifica la connessione al database.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4 font-sans text-left">
      <Card className="w-full max-w-md bg-gray-900 border-gray-800 text-white shadow-2xl">
        <CardHeader className="text-center">
          <div className="bg-violet-500/10 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 border border-violet-500/20">
            <Sparkles className="text-violet-400 h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-black uppercase italic tracking-tighter">Benvenuto su IdeaForge</CardTitle>
          <CardDescription className="text-gray-500 text-xs">Configura il tuo motore AI predefinito per iniziare.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">AI Engine</label>
              <Select value={aiProvider} onValueChange={(v: AIProvider) => setAiProvider(v)}>
                <SelectTrigger className="bg-gray-950 border-gray-800 h-12"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-800 text-white">
                  {AI_PROVIDERS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">API Key</label>
              <Input type="password" placeholder="sk-..." value={apiKey} onChange={e => setApiKey(e.target.value)} required className="bg-gray-950 border-gray-800 h-12 font-mono" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Endpoint MCP (Opzionale)</label>
              <Input placeholder="https://vps-mcp.com/api" value={mcpEndpoint} onChange={e => setMcpEndpoint(e.target.value)} className="bg-gray-950 border-gray-800 h-12" />
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-violet-600 hover:bg-violet-500 h-12 font-black uppercase tracking-widest mt-4">
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Completa Setup'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
