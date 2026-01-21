import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles } from 'lucide-react';

export function Login({ onToggleMode }: { onToggleMode: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (error: any) {
      toast({ title: 'Errore Login', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <Card className="w-full max-w-md bg-gray-900 border-gray-800 text-white shadow-2xl">
        <CardHeader className="text-center">
          <div className="bg-violet-500/10 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 border border-violet-500/20">
            <Sparkles className="text-violet-400 h-6 w-6" />
          </div>
          <CardTitle className="text-3xl font-black uppercase italic tracking-tighter">BYOI</CardTitle>
          <CardDescription className="text-gray-500">Build Your Own Intelligence</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="bg-gray-950 border-gray-800 h-12" />
            <Input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="bg-gray-950 border-gray-800 h-12" />
            <Button type="submit" disabled={loading} className="w-full bg-violet-600 h-12 font-bold uppercase">{loading ? <Loader2 className="animate-spin" /> : 'Sign In'}</Button>
            <Button variant="link" onClick={onToggleMode} className="w-full text-gray-500 text-xs">Don't have an account? Sign up</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
