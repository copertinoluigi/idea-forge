import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AI_PROVIDERS } from '@/lib/ai-service';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, LogIn, Sparkles, Users, Key } from 'lucide-react';

export function AddRoomModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) {
  const [mode, setMode] = useState<'choice' | 'create' | 'join'>('choice');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Form states
  const [name, setName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [aiProvider, setAiProvider] = useState('google-flash');
  const [apiKey, setApiKey] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const selected = AI_PROVIDERS.find(p => p.value === aiProvider);
      const { data: room, error: rErr } = await supabase.from('rooms').insert({
        name,
        ai_provider: selected?.provider || 'google',
        encrypted_api_key: apiKey,
        created_by: user.id
      }).select().single();
      if (rErr) throw rErr;

      await supabase.from('room_members').insert({
        room_id: room.id,
        user_email: user.email,
        user_id: user.id,
        role: 'owner'
      });

      toast({ title: "Stanza Creata" });
      onSuccess();
      onClose();
    } catch (err: any) {
      toast({ title: "Errore", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const { data: room, error: rErr } = await supabase.from('rooms').select('id').eq('join_code', joinCode.trim()).single();
      if (rErr) throw new Error("Codice non valido");

      await supabase.from('room_members').insert({
        room_id: room.id,
        user_email: user.email,
        user_id: user.id
      });

      toast({ title: "Ti sei unito alla stanza!" });
      onSuccess();
      onClose();
    } catch (err: any) {
      toast({ title: "Errore", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white shadow-2xl">
        <DialogHeader>
          <DialogTitle className="italic font-black uppercase tracking-tighter">Gestione Stanze</DialogTitle>
        </DialogHeader>

        {mode === 'choice' && (
          <div className="grid grid-cols-2 gap-4 py-8">
            <Button onClick={() => setMode('create')} className="h-32 flex flex-col gap-3 bg-violet-600/20 border-violet-600/40 border hover:bg-violet-600/40">
              <Plus className="h-8 w-8 text-violet-400" />
              <span>Crea Nuova</span>
            </Button>
            <Button onClick={() => setMode('join')} className="h-32 flex flex-col gap-3 bg-emerald-600/20 border-emerald-600/40 border hover:bg-emerald-600/40">
              <LogIn className="h-8 w-8 text-emerald-400" />
              <span>Unisciti</span>
            </Button>
          </div>
        )}

        {mode === 'create' && (
          <form onSubmit={handleCreate} className="space-y-4 animate-in fade-in zoom-in duration-200">
            <Input placeholder="Nome Stanza" value={name} onChange={e => setName(e.target.value)} required className="bg-gray-800 border-gray-700" />
            <Select value={aiProvider} onValueChange={setAiProvider}>
              <SelectTrigger className="bg-gray-800 border-gray-700"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 text-white">
                {AI_PROVIDERS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="password" placeholder="API Key" value={apiKey} onChange={e => setApiKey(e.target.value)} required className="bg-gray-800 border-gray-700" />
            <Button type="submit" disabled={loading} className="w-full bg-violet-600 uppercase font-bold">
              {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Attiva"}
            </Button>
            <Button variant="ghost" onClick={() => setMode('choice')} className="w-full text-xs text-gray-500">Indietro</Button>
          </form>
        )}

        {mode === 'join' && (
          <form onSubmit={handleJoin} className="space-y-4 animate-in fade-in zoom-in duration-200">
            <Input placeholder="Inserisci il codice della stanza" value={joinCode} onChange={e => setJoinCode(e.target.value)} required className="bg-gray-800 border-gray-700" />
            <Button type="submit" disabled={loading} className="w-full bg-emerald-600 uppercase font-bold">
              {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Unisciti"}
            </Button>
            <Button variant="ghost" onClick={() => setMode('choice')} className="w-full text-xs text-gray-500">Indietro</Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
