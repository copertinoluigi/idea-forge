import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AI_PROVIDERS, type AIProvider } from '@/lib/ai-service';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Users, Key, Server } from 'lucide-react';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateRoomModal({ isOpen, onClose, onSuccess }: CreateRoomModalProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [aiProvider, setAiProvider] = useState<AIProvider>('google');
  const [apiKey, setApiKey] = useState('');
  const [mcpEndpoint, setMcpEndpoint] = useState('');
  const [emails, setEmails] = useState(''); // Email separate da virgola
  
  const { user } = useAuth();
  const { toast } = useToast();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;

    setLoading(true);
    try {
      // 1. Crea la stanza
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .insert({
          name: name.trim(),
          ai_provider: aiProvider,
          encrypted_api_key: apiKey,
          mcp_endpoint: mcpEndpoint,
          created_by: user.id,
          is_private: false
        })
        .select()
        .single();

      if (roomError) throw roomError;

      // 2. Aggiungi il creatore come owner nei members
      const membersToInsert = [
        { room_id: room.id, user_email: user.email, role: 'owner', user_id: user.id }
      ];

      // 3. Aggiungi gli altri partecipanti
      if (emails.trim()) {
        const otherEmails = emails.split(',').map(e => e.trim().toLowerCase()).filter(e => e !== user.email);
        otherEmails.forEach(email => {
          membersToInsert.push({ room_id: room.id, user_email: email, role: 'member', user_id: null });
        });
      }

      const { error: memberError } = await supabase.from('room_members').insert(membersToInsert);
      if (memberError) throw memberError;

      toast({ title: "Stanza creata!", description: "Il tuo incubatore AI è pronto." });
      onSuccess();
      setName(''); setApiKey(''); setEmails('');
    } catch (err: any) {
      toast({ title: "Errore", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Crea Nuovo Incubatore</DialogTitle>
          <DialogDescription className="text-gray-400 text-xs">
            Configura il cervello AI e invita i tuoi collaboratori.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreate} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-xs uppercase text-gray-500 font-bold">Nome Progetto</Label>
            <Input 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="es. Tinder per Gatti" 
              className="bg-gray-800 border-gray-700"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase text-gray-500 font-bold">AI Engine</Label>
              <Select value={aiProvider} onValueChange={(v: AIProvider) => setAiProvider(v)}>
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  {AI_PROVIDERS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase text-gray-500 font-bold">API Key</Label>
              <Input 
                type="password" 
                value={apiKey} 
                onChange={(e) => setApiKey(e.target.value)} 
                placeholder="sk-..." 
                className="bg-gray-800 border-gray-700"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase text-gray-500 font-bold">Endpoint MCP</Label>
            <div className="flex gap-2">
              <div className="bg-gray-800 p-2 rounded-lg border border-gray-700 flex items-center"><Server className="h-4 w-4 text-emerald-400" /></div>
              <Input 
                value={mcpEndpoint} 
                onChange={(e) => setMcpEndpoint(e.target.value)} 
                placeholder="https://..." 
                className="bg-gray-800 border-gray-700 flex-1"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase text-gray-500 font-bold">Invita Collaboratori (Email)</Label>
            <div className="flex gap-2">
              <div className="bg-gray-800 p-2 rounded-lg border border-gray-700 flex items-center"><Users className="h-4 w-4 text-violet-400" /></div>
              <Input 
                value={emails} 
                onChange={(e) => setEmails(e.target.value)} 
                placeholder="mario@gmail.com, luca@libero.it" 
                className="bg-gray-800 border-gray-700 flex-1"
              />
            </div>
            <p className="text-[10px] text-gray-500">Separa le email con una virgola.</p>
          </div>

          <DialogFooter className="mt-6">
            <Button type="submit" disabled={loading} className="w-full bg-violet-600 hover:bg-violet-500">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Attiva Incubatore"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
