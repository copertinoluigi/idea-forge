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
import { Loader2, Users, Server, Sparkles } from 'lucide-react';

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
  const [emails, setEmails] = useState('');
  
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

      // 2. Prepara i membri (Creatore + Invitati)
      const membersToInsert = [
        { room_id: room.id, user_email: user.email, role: 'owner', user_id: user.id }
      ];

      if (emails.trim()) {
        const otherEmails = emails.split(',')
          .map(e => e.trim().toLowerCase())
          .filter(e => e !== user.email && e.length > 0);
        
        otherEmails.forEach(email => {
          membersToInsert.push({ room_id: room.id, user_email: email, role: 'member', user_id: null });
        });
      }

      // 3. Inserimento membri
      const { error: memberError } = await supabase.from('room_members').insert(membersToInsert);
      if (memberError) throw memberError;

      toast({ title: "Incubatore Attivato", description: "La stanza è pronta per il brainstorming." });
      
      // Reset
      setName(''); setApiKey(''); setEmails(''); setMcpEndpoint('');
      onSuccess();
    } catch (err: any) {
      toast({ title: "Errore Creazione", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-5 w-5 text-violet-400" />
            <DialogTitle className="text-xl font-bold italic tracking-tighter uppercase">Nuovo Progetto</DialogTitle>
          </div>
          <DialogDescription className="text-gray-400 text-xs">
            Configura i motori e invita il team.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreate} className="space-y-5 py-4">
          <div className="space-y-2">
            <Label className="text-[10px] uppercase text-gray-500 font-black tracking-widest">Nome Idea</Label>
            <Input 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="es. Progetto Mars" 
              className="bg-gray-800/50 border-gray-700 h-11"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase text-gray-500 font-black tracking-widest">AI Brain</Label>
              <Select value={aiProvider} onValueChange={(v: AIProvider) => setAiProvider(v)}>
                <SelectTrigger className="bg-gray-800/50 border-gray-700 h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  {AI_PROVIDERS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase text-gray-500 font-black tracking-widest">API Key</Label>
              <Input 
                type="password" 
                value={apiKey} 
                onChange={(e) => setApiKey(e.target.value)} 
                placeholder="sk-..." 
                className="bg-gray-800/50 border-gray-700 h-11"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] uppercase text-gray-500 font-black tracking-widest">Endpoint MCP (VPS)</Label>
            <div className="relative">
              <Server className="absolute left-3 top-3.5 h-4 w-4 text-emerald-500" />
              <Input 
                value={mcpEndpoint} 
                onChange={(e) => setMcpEndpoint(e.target.value)} 
                placeholder="https://vps-mcp.com/api" 
                className="bg-gray-800/50 border-gray-700 pl-10 h-11"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] uppercase text-gray-500 font-black tracking-widest">Team (Emails)</Label>
            <div className="relative">
              <Users className="absolute left-3 top-3.5 h-4 w-4 text-violet-500" />
              <Input 
                value={emails} 
                onChange={(e) => setEmails(e.target.value)} 
                placeholder="socio@email.com, dev@email.com" 
                className="bg-gray-800/50 border-gray-700 pl-10 h-11"
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="submit" disabled={loading} className="w-full bg-violet-600 hover:bg-violet-500 h-12 font-bold text-white uppercase tracking-tighter">
              {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : "Attiva Incubatore"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
