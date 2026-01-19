import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Save, Shield, Cpu } from 'lucide-react';
import { AI_PROVIDERS, type AIProvider } from '@/lib/ai-service';

interface SettingsProps {
  onBack: () => void;
}

export function Settings({ onBack }: SettingsProps) {
  const { profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    display_name: '',
    ai_provider: 'google' as AIProvider,
    encrypted_api_key: '',
    mcp_endpoint: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || '',
        ai_provider: (profile.ai_provider as AIProvider) || 'google',
        encrypted_api_key: profile.encrypted_api_key || '',
        mcp_endpoint: profile.mcp_endpoint || '',
      });
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: formData.display_name,
          ai_provider: formData.ai_provider,
          encrypted_api_key: formData.encrypted_api_key,
          mcp_endpoint: formData.mcp_endpoint,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (error) throw error;

      await refreshProfile();
      toast({
        title: 'Impostazioni salvate',
        description: 'Le tue preferenze sono state aggiornate con successo.',
      });
    } catch (error: any) {
      toast({
        title: 'Errore',
        description: error.message || 'Impossibile salvare le impostazioni',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedProvider = AI_PROVIDERS.find(p => p.value === formData.ai_provider);

  return (
    <div className="min-h-screen bg-gray-950 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna alla Chat
          </Button>
          <h1 className="text-2xl font-bold text-white">Impostazioni</h1>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="h-5 w-5 text-violet-400" />
                Configurazione AI
              </CardTitle>
              <CardDescription className="text-gray-400">
                Gestisci le tue chiavi API e il provider preferito.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Nome Visualizzato</label>
                <Input
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="Il tuo nome"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Provider AI</label>
                <Select
                  value={formData.ai_provider}
                  onValueChange={(value: AIProvider) => setFormData({ ...formData, ai_provider: value })}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Seleziona provider" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    {AI_PROVIDERS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label} ({p.model})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">API Key</label>
                <Input
                  type="password"
                  value={formData.encrypted_api_key}
                  onChange={(e) => setFormData({ ...formData, encrypted_api_key: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder={selectedProvider?.value === 'google' ? 'AIza...' : 'sk-...'}
                />
                <p className="text-[10px] text-gray-500 italic">
                  La tua chiave è salvata in modo sicuro e usata solo per le tue richieste.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Cpu className="h-5 w-5 text-emerald-400" />
                Server MCP
              </CardTitle>
              <CardDescription className="text-gray-400">
                Configura l'endpoint del tuo Model Context Protocol per lo sviluppo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Endpoint MCP</label>
                <Input
                  value={formData.mcp_endpoint}
                  onChange={(e) => setFormData({ ...formData, mcp_endpoint: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="https://tuo-mcp-server.com/api"
                />
              </div>
            </CardContent>
          </Card>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salva Impostazioni
          </Button>
        </form>
      </div>
    </div>
  );
}
