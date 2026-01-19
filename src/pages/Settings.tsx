import { useState, useEffect } from 'react';
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
import { Loader2, Key, Server, ArrowLeft, Save, Sparkles } from 'lucide-react';

interface SettingsProps {
  onBack: () => void;
}

export function Settings({ onBack }: SettingsProps) {
  const [aiProvider, setAiProvider] = useState('google');
  const [apiKey, setApiKey] = useState('');
  const [mcpEndpoint, setMcpEndpoint] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (profile) {
      setAiProvider(profile.ai_provider || 'google');
      if (profile.encrypted_api_key) {
        try {
          setApiKey(atob(profile.encrypted_api_key));
        } catch {
          setApiKey('');
        }
      }
      setMcpEndpoint(profile.mcp_endpoint || '');
      setInitialLoading(false);
    }
  }, [profile]);

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
        return 'Google AI Studio';
      case 'openai':
        return 'OpenAI Platform';
      case 'anthropic':
        return 'Anthropic Console';
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
      };
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();

      toast({
        title: 'Impostazioni Aggiornate',
        description: 'La tua configurazione è stata salvata con successo.',
      });
    } catch (error) {
      toast({
        title: 'Errore',
        description: error instanceof Error ? error.message : 'Impossibile salvare le impostazioni',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
        <Loader2 className="h-8 w-8 text-violet-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-4">
      <div className="max-w-2xl mx-auto py-8">
        <Button
          onClick={onBack}
          variant="ghost"
          className="mb-6 text-gray-400 hover:text-white hover:bg-gray-800"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Torna alla Chat
        </Button>

        <Card className="backdrop-blur-sm bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-white">Impostazioni</CardTitle>
            <CardDescription className="text-gray-400">
              Gestisci la tua chiave API AI e la configurazione del server MCP
            </CardDescription>
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
                      {AI_PROVIDERS.map((p) => (
  <SelectItem key={p.value} value={p.value}>
    {p.label}
  </SelectItem>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    Il tuo provider AI preferito per l'analisi delle conversazioni
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
                    Ottieni la chiave da {getProviderHelp()}
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
                    L'endpoint del server MCP per la generazione progetti
                  </p>
                </div>
              </div>

              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Informazioni Profilo</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Nome:</span>
                    <span className="text-white">{profile?.display_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Email:</span>
                    <span className="text-white">{profile?.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Provider Attuale:</span>
                    <span className="text-violet-400 font-medium">
                      {AI_PROVIDERS.find((p) => p.value === aiProvider)?.label}
                    </span>
                  </div>
                </div>
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
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salva Impostazioni
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
