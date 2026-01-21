import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Key } from 'lucide-react';

export function Register({ onToggleMode }: { onToggleMode: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signUp(email, password, displayName, inviteCode);
      toast({ title: 'Account creato!', description: 'Benvenuto in BYOI.' });
    } catch (error: any) {
      toast({ title: 'Errore Signup', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <Card className="w-full max-w-md bg-gray-900 border-gray-800 text-white shadow-2xl">
        <CardHeader className="text-center">
          <div className="bg-emerald-500/10 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
            <Sparkles className="text-emerald-400 h-6 w-6" />
          </div>
          <CardTitle className="text-3xl font-black uppercase italic tracking-tighter">BYOI</CardTitle>
          <CardDescription className="text-gray-500">Join the Intelligence Workspace</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input placeholder="Nome Visualizzato" value={displayName} onChange={e => setDisplayName(e.target.value)} required className="bg-gray-950 border-gray-800 h-12" />
            <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="bg-gray-950 border-gray-800 h-12" />
            <Input type="password" placeholder="Password (min. 6 caratteri)" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className="bg-gray-950 border-gray-800 h-12" />
            <div className="relative">
              <Key className="absolute left-3 top-3.5 h-5 w-5 text-gray-600" />
              <Input placeholder="Codice Invito" value={inviteCode} onChange={e => setInviteCode(e.target.value)} required className="bg-gray-950 border-gray-800 h-12 pl-10 uppercase font-mono tracking-widest" />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-emerald-600 h-12 font-bold uppercase">{loading ? <Loader2 className="animate-spin" /> : 'Create Account'}</Button>
            <Button variant="link" onClick={onToggleMode} className="w-full text-gray-500 text-xs">Already have an account? Sign in</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
