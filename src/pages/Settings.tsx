import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Save, Shield, User, Cpu } from 'lucide-react';
import { AI_PROVIDERS, type AIProvider } from '@/lib/ai-service';

export function Settings({ onBack }: { onBack: () => void }) {
  const { profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    display_name: '',
    ai_provider: 'google-flash' as AIProvider,
    encrypted_api_key: '',
    mcp_endpoint: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || '',
        ai_provider: (profile.ai_provider as AIProvider) || 'google-flash',
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
      const { error } = await supabase.from('profiles').update({
        display_name: formData.display_name,
        ai_provider: formData.ai_provider,
        encrypted_api_key: formData.encrypted_api_key,
        mcp_endpoint: formData.mcp_endpoint,
        updated_at: new Date().toISOString()
      }).eq('id', profile.id);

      if (error) throw error;
      await refreshProfile();
      toast({ title: 'Impostazioni salvate', description: 'Le tue preferenze globali sono state aggiornate.' });
    } catch (error: any) {
      toast({ title: 'Errore', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const selectedConfig = AI_PROVIDERS.find(p => p.value === formData.ai_provider);

  return (
    <div className="min-h-screen bg-gray-950 p-4 md:p-8 text-white font-sans">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onBack} className="text-gray-400 hover:text-white">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Chat
          </Button>
          <h1 className="text-xl font-black italic uppercase tracking-tighter">Global Settings</h1>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <Card className="bg-gray-900 border-gray-800 shadow-xl">
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-widest text-violet-400 flex items-center gap-2">
                <User className="h-4 w-4"/> Profilo Utente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs text-gray-500">Nome Visualizzato</Label>
                <Input value={formData.display_name} onChange={e => setFormData({...formData, display_name: e.target.value})} className="bg-gray-950 border-gray-800" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800 shadow-xl">
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                <Shield className="h-4 w-4"/> Motore AI Predefinito
              </CardTitle>
              <CardDescription className="text-[10px] text-gray-500">Queste chiavi verranno usate per la tua Console Privata.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs text-gray-500">Provider & Modello</Label>
                <Select value={formData.ai_provider} onValueChange={(v: AIProvider) => setFormData({...formData, ai_provider: v})}>
                  <SelectTrigger className="bg-gray-950 border-gray-800"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-800 text-white">
                    {AI_PROVIDERS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-gray-500">API Key</Label>
                <Input type="password" value={formData.encrypted_api_key} onChange={e => setFormData({...formData, encrypted_api_key: e.target.value})} placeholder={selectedConfig?.provider === 'google' ? 'AIza...' : 'sk-...'} className="bg-gray-950 border-gray-800" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800 shadow-xl">
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-widest text-amber-400 flex items-center gap-2">
                <Cpu className="h-4 w-4"/> Infrastructure (MCP)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs text-gray-500">Default Endpoint</Label>
                <Input value={formData.mcp_endpoint} onChange={e => setFormData({...formData, mcp_endpoint: e.target.value})} placeholder="https://vps-mcp.com/api" className="bg-gray-950 border-gray-800" />
              </div>
            </CardContent>
          </Card>

          <Button type="submit" disabled={loading} className="w-full bg-violet-600 hover:bg-violet-500 h-12 font-bold uppercase">
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <><Save className="mr-2 h-5 w-5" /> Salva Configurazione</>}
          </Button>
        </form>
      </div>
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode, className?: string }) {
  return <label className={`block font-bold tracking-tight ${className}`}>{children}</label>;
}
