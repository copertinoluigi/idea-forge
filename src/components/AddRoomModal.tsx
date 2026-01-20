import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AI_PROVIDERS, type AIProvider } from '@/lib/ai-service';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, LogIn, Sparkles, Users, Server, ArrowLeft } from 'lucide-react';

interface AddRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddRoomModal({ isOpen, onClose, onSuccess }: AddRoomModalProps) {
  const [mode, setMode] = useState<'choice' | 'create' | 'join'>('choice');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Form states
  const [name, setName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [aiProvider, setAiProvider] = useState<AIProvider>('google-flash');
  const [apiKey, setApiKey] = useState('');
  const [mcpEndpoint, setMcpEndpoint] = useState('');
  const [emails, setEmails] = useState('');

  const resetAndClose = () => {
    setMode('choice');
    setName('');
    setJoinCode('');
    setApiKey('');
    setEmails('');
    setMcpEndpoint('');
    onClose();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;
    setLoading(true);
    try {
      // 1. Crea la stanza
      const { data: room, error: rErr } = await supabase.from('rooms').insert({
        name: name.trim(),
        ai_provider: aiProvider,
        encrypted_api_key: apiKey,
        mcp_endpoint: mcpEndpoint,
        created_by: user.id,
        is_private: false
      }).select().single();

      if (rErr) throw rErr;

      // 2. Prepara i membri
      const membersToInsert: any[] = [
        { room_id: room.id, user_email: user.email, role: 'owner', user_id: user.id }
      ];

      if (emails.trim()) {
        emails.split(',').map(e => e.trim().toLowerCase()).filter(e => e !== user.email && e.length > 0).forEach(email => {
          membersToInsert.push({ room_id: room.id, user_email: email, role: 'member' });
        });
      }

      const { error: mErr } = await supabase.from('room_members').insert(membersToInsert);
      if (mErr) throw mErr;

      toast({ title: "Incubatore Attivato", description: `Codice per invitare altri: ${room.join_code}` });
      onSuccess();
      resetAndClose();
    } catch (err: any) {
      toast({ title: "Errore Creazione", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !joinCode.trim()) return;
    setLoading(true);
    try {
      const { data: room, error: rErr } = await supabase.from('rooms').select('id').eq('join_code', joinCode.trim()).maybeSingle();
      if (!room) throw new Error("Codice stanza non trovato o non valido.");

      const { error: mErr } = await supabase.from('room_members').insert({
        room_id: room.id,
        user_email: user.email,
        user_id: user.id,
        role: 'member'
      });

      if (mErr) {
        if (mErr.code === '23505') throw new Error("Sei già membro di questa stanza.");
        throw mErr;
      }

      toast({ title: "Accesso Eseguito", description: "Ti sei unito alla stanza di brainstorming." });
      onSuccess();
      resetAndClose();
    } catch (err: any) {
      toast({ title: "Errore", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="bg-gray-950 border-gray-800 text-white max-w-md shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-5 w-5 text-violet-400" />
            <DialogTitle className="text-xl font-bold italic tracking-tighter uppercase">Gestione Stanze</DialogTitle>
          </div>
          <DialogDescription className="text-gray-400 text-xs text-left">
            Crea un nuovo spazio creativo o unisciti a un progetto esistente per collaborare con il tuo team.
          </DialogDescription>
        </DialogHeader>

        {mode === 'choice' && (
          <div className="grid grid-cols-2 gap-4 py-8">
            <Button onClick={() => setMode('create')} className="h-40 flex flex-col gap-3 bg-violet-600/10 border-violet-600/30 border hover:bg-violet-600/20 transition-all group">
              <Plus className="h-10 w-10 text-violet-400 group-hover:scale-110 transition-transform" />
              <div className="text-center">
                <span className="block font-bold">Crea Nuova</span>
                <span className="text-[10px] text-gray-500">Inizia un nuovo brainstorming</span>
              </div>
            </Button>
            <Button onClick={() => setMode('join')} className="h-40 flex flex-col gap-3 bg-emerald-600/10 border-emerald-600/30 border hover:bg-emerald-600/20 transition-all group">
              <LogIn className="h-10 w-10 text-emerald-400 group-hover:scale-110 transition-transform" />
              <div className="text-center">
                <span className="block font-bold">Unisciti</span>
                <span className="text-[10px] text-gray-500">Usa un codice d'accesso</span>
              </div>
            </Button>
          </div>
        )}

        {mode === 'create' && (
          <form onSubmit={handleCreate} className="space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Nome Stanza</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="es. Startup Alpha" className="bg-gray-900 border-gray-800 focus:ring-violet-500" required />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black text-gray-500 tracking-widest">AI Brain</Label>
                <Select value={aiProvider} onValueChange={(v: AIProvider) => setAiProvider(v)}>
                  <SelectTrigger className="bg-gray-900 border-gray-800"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-800 text-white">
                    {AI_PROVIDERS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black text-gray-500 tracking-widest">API Key</Label>
                <Input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="sk-..." className="bg-gray-900 border-gray-800 focus:ring-violet-500" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black text-gray-500 tracking-widest flex items-center gap-2">
                <Server className="h-3 w-3 text-emerald-500"/> Endpoint MCP (VPS)
              </Label>
              <Input value={mcpEndpoint} onChange={e => setMcpEndpoint(e.target.value)} placeholder="https://vps-mcp.com/api" className="bg-gray-900 border-gray-800 focus:ring-violet-500" required />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-black text-gray-500 tracking-widest flex items-center gap-2">
                <Users className="h-3 w-3 text-violet-500"/> Team (Emails)
              </Label>
              <Input value={emails} onChange={e => setEmails(e.target.value)} placeholder="socio@email.com, dev@email.com" className="bg-gray-900 border-gray-800 focus:ring-violet-500" />
              <p className="text-[9px] text-gray-600">Separa gli indirizzi email con una virgola.</p>
            </div>

            <DialogFooter className="flex-col gap-2 sm:flex-col">
              <Button type="submit" disabled={loading} className="w-full bg-violet-600 hover:bg-violet-500 font-bold uppercase py-6">
                {loading ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : "Attiva Incubatore"}
              </Button>
              <Button variant="ghost" type="button" onClick={() => setMode('choice')} className="w-full text-xs text-gray-500 hover:text-white">
                <ArrowLeft className="h-3 w-3 mr-2"/> Torna alla scelta iniziale
              </Button>
            </DialogFooter>
          </form>
        )}

        {mode === 'join' && (
          <form onSubmit={handleJoin} className="space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="space-y-4 py-4">
              <Label className="text-[10px] uppercase font-black text-gray-500 tracking-widest text-center block">Codice d'accesso univoco</Label>
              <Input 
                value={joinCode} 
                onChange={e => setJoinCode(e.target.value)} 
                placeholder="ABC123XY" 
                className="bg-gray-900 border-gray-800 text-center text-2xl font-black tracking-[0.5em] h-16 uppercase focus:ring-emerald-500" 
                required 
              />
              <p className="text-[10px] text-gray-500 text-center italic">Inserisci il codice ricevuto dal creatore della stanza.</p>
            </div>
            
            <DialogFooter className="flex-col gap-2 sm:flex-col">
              <Button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 font-bold uppercase py-6">
                {loading ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : "Unisciti al Brainstorming"}
              </Button>
              <Button variant="ghost" type="button" onClick={() => setMode('choice')} className="w-full text-xs text-gray-500 hover:text-white">
                <ArrowLeft className="h-3 w-3 mr-2"/> Torna alla scelta iniziale
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
