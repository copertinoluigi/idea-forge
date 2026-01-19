import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';
import { AI_PROVIDERS, type AIProvider } from '@/lib/ai-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Key, Server, CheckCircle2, Sparkles } from 'lucide-react';

export function Setup() {
  const [aiProvider, setAiProvider] = useState<AIProvider>('google');
  const [apiKey, setApiKey] = useState('');
  const [mcpEndpoint, setMcpEndpoint] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();

  const getPlaceholder = () => {
    switch (aiProvider) {
      case 'google': return 'AIza...';
      case 'openai': return 'sk-...';
      case 'anthropic': return 'sk-ant-...';
      default: return '';
    }
  };

  const getProviderHelp = () => {
    switch (aiProvider) {
      case 'google': return 'Ottieni la chiave da Google AI Studio (https://aistudio.google.com/apikey)';
      case 'openai': return 'Ottieni la chiave da OpenAI Platform (https://platform.openai.com/api-keys)';
      case 'anthropic': return 'Ottieni la chiave da Anthropic Console (https://console.anthropic.com/)';
      default: return '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      // Usiamo il tipo Update dalla definizione del database
      const { error } = await supabase
        .from('profiles')
        .update({
          ai_provider: aiProvider,
          encrypted_api_key: apiKey, // Salviamo la chiave (il btoa era superfluo se non gestito ovunque)
          mcp_endpoint: mcpEndpoint,
          has_completed_setup: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();

      toast({
        title: 'Setup Completato!',
        description: 'Configurazione salvata con successo.',
      });
    } catch (error: any) {
      toast({
        title: 'Errore',
        description: error.message || 'Impossibile salvare la configurazione',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-violet-900/20 via-transparent to-transparent"></div>

      <Card className="w-full max-w-2xl relative backdrop-blur-sm bg-gray-900/50 border-gray-800 shadow-2xl">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
              <Sparkles className="h-6 w-6 text-violet-400" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-white">Initial Setup</CardTitle>
              <CardDescription className="text-gray-400">
                Benvenuto su IdeaForge. Configura i tuoi motori AI per iniziare.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="aiProvider" className="text-gray-300 flex items-center gap-2">
                  Provider AI
                </Label>
                <Select 
                  value={aiProvider} 
                  onValueChange={(value: AIProvider) => setAiProvider(value)}
                >
                  <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    {AI_PROVIDERS.map((provider: any) => (
                      <SelectItem key={provider.value} value={provider.value}>
                        {provider.label} ({provider.model})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiKey" className="text-gray-300 flex items-center gap-2">
                  <Key className="h-4 w-4 text-violet-400" />
                  API Key
                </Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder={getPlaceholder()}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  required
                  className="bg-gray-800/50 border-gray-700 text-white font-mono"
                />
                <p className="text-[10px] text-gray-500">{getProviderHelp()}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mcpEndpoint" className="text-gray-300 flex items-center gap-2">
                  <Server className="h-4 w-4 text-emerald-400" />
                  MCP Server Endpoint
                </Label>
                <Input
                  id="mcpEndpoint"
                  type="url"
                  placeholder="https://your-mcp-server.com/api"
                  value={mcpEndpoint}
                  onChange={(e) => setMcpEndpoint(e.target.value)}
                  required
                  className="bg-gray-800/50 border-gray-700 text-white"
                />
              </div>
            </div>

            <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-violet-400 uppercase tracking-widest">Pronto per il lancio</h4>
              <ul className="text-xs text-gray-400 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" /> 
                  Accesso immediato alla chat privata e di gruppo
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" /> 
                  Sistema di riassunto a strati (Layered Context) attivo
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" /> 
                  Integrazione diretta con il tuo server MCP
                </li>
              </ul>
            </div>

            <Button
              type="submit"
              className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold h-12"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                'ATTIVA WORKSPACE'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
