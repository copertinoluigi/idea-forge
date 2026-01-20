import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { AI_PROVIDERS, type AIProvider } from '@/lib/ai-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

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
      await supabase.from('profiles').update({
        ai_provider: aiProvider,
        encrypted_api_key: apiKey,
        mcp_endpoint: mcpEndpoint,
        has_completed_setup: true,
      }).eq('id', user.id);
      await refreshProfile();
      toast({ title: 'Setup Completato!' });
    } catch (error: any) {
      toast({ title: 'Errore', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <Card className="w-full max-w-md bg-gray-900 border-gray-800 text-white">
        <CardHeader><CardTitle>Benvenuto su IdeaForge</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select value={aiProvider} onValueChange={(v: AIProvider) => setAiProvider(v)}>
              <SelectTrigger className="bg-gray-800 border-gray-700"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 text-white">
                {AI_PROVIDERS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="password" placeholder="API Key" value={apiKey} onChange={e => setApiKey(e.target.value)} required className="bg-gray-800 border-gray-700" />
            <Input placeholder="MCP Endpoint" value={mcpEndpoint} onChange={e => setMcpEndpoint(e.target.value)} required className="bg-gray-800 border-gray-700" />
            <Button type="submit" disabled={loading} className="w-full bg-violet-600">{loading ? <Loader2 className="animate-spin" /> : 'Completa Setup'}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
