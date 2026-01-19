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
  const [aiProvider, setAiProvider] = useState('google');
  const [apiKey, setApiKey] = useState('');
  const [mcpEndpoint, setMcpEndpoint] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();

  const getPlaceholder = () => {
    switch (aiProvider) {
      case 'google':
        return 'AIza...';
      case 'openai':
        return 'sk-...';
      case 'anthropic':
        return 'sk-ant-...';
      default:
        return '';
    }
  };

  const getProviderHelp = () => {
    switch (aiProvider) {
      case 'google':
        return 'Ottieni la chiave da Google AI Studio (https://aistudio.google.com/apikey)';
      case 'openai':
        return 'Ottieni la chiave da OpenAI Platform (https://platform.openai.com/api-keys)';
      case 'anthropic':
        return 'Ottieni la chiave da Anthropic Console (https://console.anthropic.com/)';
      default:
        return '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
      const updateData: ProfileUpdate = {
        ai_provider: aiProvider,
        encrypted_api_key: btoa(apiKey),
        mcp_endpoint: mcpEndpoint,
        has_completed_setup: true,
      };
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();

      toast({
        title: 'Setup Completato!',
        description: 'Configurazione salvata con successo.',
      });
    } catch (error) {
      toast({
        title: 'Errore',
        description: error instanceof Error ? error.message : 'Impossibile salvare la configurazione',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-violet-900/20 via-transparent to-transparent"></div>

      <Card className="w-full max-w-2xl relative backdrop-blur-sm bg-gray-900/50 border-gray-800">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
              <CheckCircle2 className="h-6 w-6 text-violet-400" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-white">Initial Setup</CardTitle>
              <CardDescription className="text-gray-400">
                Configura le impostazioni AI e MCP per iniziare
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="aiProvider" className="text-gray-300 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-violet-400" />
                  Provider AI
                </Label>
                <Select value={aiProvider} onValueChange={setAiProvider}>
                  <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {AI_PROVIDERS.map((provider) => (
  <SelectItem key={provider.value} value={provider.value}>
    {provider.label}
  </SelectItem>
))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Scegli il tuo provider AI preferito per l'analisi delle conversazioni
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiKey" className="text-gray-300 flex items-center gap-2">
                  <Key className="h-4 w-4 text-violet-400" />
                  AI API Key
                </Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder={getPlaceholder()}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  required
                  className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 font-mono"
                />
                <p className="text-xs text-gray-500">
                  {getProviderHelp()}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mcpEndpoint" className="text-gray-300 flex items-center gap-2">
                  <Server className="h-4 w-4 text-green-400" />
                  MCP Server Endpoint
                </Label>
                <Input
                  id="mcpEndpoint"
                  type="url"
                  placeholder="https://your-mcp-server.com/api"
                  value={mcpEndpoint}
                  onChange={(e) => setMcpEndpoint(e.target.value)}
                  required
                  className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
                />
                <p className="text-xs text-gray-500">
                  L'endpoint MCP (Model Context Protocol) per la generazione progetti
                </p>
              </div>
            </div>

            <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg p-4">
              <h4 className="text-sm font-medium text-violet-300 mb-2">Cosa succede dopo?</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Accedi alla chat collaborativa del gruppo</li>
                <li>• Usa l'AI per riassumere conversazioni e generare insights</li>
                <li>• Trasforma idee in applicazioni funzionanti</li>
                <li>• Collabora con il tuo team in tempo reale</li>
              </ul>
            </div>

            <Button
              type="submit"
              className="w-full bg-violet-600 hover:bg-violet-500 text-white"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvataggio...
                </>
              ) : (
                'Completa Setup'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
