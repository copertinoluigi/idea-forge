import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Save } from 'lucide-react';
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
      await supabase.from('profiles').update({
        display_name: formData.display_name,
        ai_provider: formData.ai_provider,
        encrypted_api_key: formData.encrypted_api_key,
        mcp_endpoint: formData.mcp_endpoint
      }).eq('id', profile.id);
      await refreshProfile();
      toast({ title: 'Impostazioni salvate' });
    } catch (error: any) {
      toast({ title: 'Errore', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const selectedConfig = AI_PROVIDERS.find(p => p.value === formData.ai_provider);

  return (
    <div className="min-h-screen bg-gray-950 p-8 text-white">
      <div className="max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" onClick={onBack}><ArrowLeft className="mr-2" /> Back</Button>
        <form onSubmit={handleSave} className="space-y-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader><CardTitle>Settings Globali</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Input value={formData.display_name} onChange={e => setFormData({...formData, display_name: e.target.value})} placeholder="Nome" className="bg-gray-800 border-gray-700" />
              <Select value={formData.ai_provider} onValueChange={(v: AIProvider) => setFormData({...formData, ai_provider: v})}>
                <SelectTrigger className="bg-gray-800 border-gray-700"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  {AI_PROVIDERS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input type="password" value={formData.encrypted_api_key} onChange={e => setFormData({...formData, encrypted_api_key: e.target.value})} placeholder={selectedConfig?.provider === 'google' ? 'AIza...' : 'sk-...'} className="bg-gray-800 border-gray-700" />
              <Input value={formData.mcp_endpoint} onChange={e => setFormData({...formData, mcp_endpoint: e.target.value})} placeholder="MCP Endpoint" className="bg-gray-800 border-gray-700" />
              <Button type="submit" disabled={loading} className="w-full bg-violet-600">{loading ? <Loader2 className="animate-spin" /> : <Save className="mr-2" />} Salva</Button>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
