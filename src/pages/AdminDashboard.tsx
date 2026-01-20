import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Ticket, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  Activity,
  Mail,
  Calendar
} from 'lucide-react';

interface AdminDashboardProps {
  onBack: () => void;
}

export function AdminDashboard({ onBack }: AdminDashboardProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [newInviteCode, setNewInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ totalUsers: 0, totalRooms: 0, totalMessages: 0 });
  
  const { toast } = useToast();

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      // Carica Utenti
      const { data: profiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      setUsers(profiles || []);

      // Carica Inviti
      const { data: inviteList } = await supabase.from('invites').select('*').order('created_at', { ascending: false });
      setInvites(inviteList || []);

      // Carica Statistiche (Conteggi rapidi)
      const { count: uCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: rCount } = await supabase.from('rooms').select('*', { count: 'exact', head: true });
      const { count: mCount } = await supabase.from('messages').select('*', { count: 'exact', head: true });

      setStats({
        totalUsers: uCount || 0,
        totalRooms: rCount || 0,
        totalMessages: mCount || 0
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createInvite = async () => {
    if (!newInviteCode) return;
    try {
      const { error } = await supabase.from('invites').insert({
        code: newInviteCode.toUpperCase().trim(),
        is_used: false
      });
      if (error) throw error;
      setNewInviteCode('');
      loadAdminData();
      toast({ title: "Codice creato", description: "L'invito è ora attivo." });
    } catch (err: any) {
      toast({ title: "Errore", description: err.message, variant: "destructive" });
    }
  };

  const deleteInvite = async (id: string) => {
    try {
      await supabase.from('invites').delete().eq('id', id);
      loadAdminData();
    } catch (err) {
      toast({ title: "Errore durante l'eliminazione", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 p-6 md:p-12 text-white font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onBack} className="text-gray-400 hover:text-white">
              <ArrowLeft className="h-5 w-5 mr-2" /> Back
            </Button>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-emerald-400" />
              <h1 className="text-2xl font-black tracking-tighter uppercase italic">Master Admin</h1>
            </div>
          </div>
          <Button onClick={loadAdminData} disabled={loading} variant="outline" className="border-gray-800">
            {loading ? "Updating..." : "Refresh Data"}
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Users</CardTitle>
              <Users className="h-4 w-4 text-violet-400" />
            </CardHeader>
            <CardContent><div className="text-3xl font-black">{stats.totalUsers}</div></CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Rooms</CardTitle>
              <Activity className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent><div className="text-3xl font-black">{stats.totalRooms}</div></CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-widest">Messages Processed</CardTitle>
              <Ticket className="h-4 w-4 text-amber-400" />
            </CardHeader>
            <CardContent><div className="text-3xl font-black">{stats.totalMessages}</div></CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* User Management */}
          <Card className="bg-gray-900 border-gray-800 overflow-hidden">
            <CardHeader><CardTitle className="text-sm uppercase tracking-widest text-violet-400">User List</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-800/50 text-gray-500 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-gray-800/30 transition-colors">
                        <td className="px-4 py-3 flex items-center gap-3">
                          <div className="bg-violet-500/10 p-2 rounded-lg"><Mail className="h-3 w-3 text-violet-400" /></div>
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-200">{u.display_name}</span>
                            <span className="text-[10px] text-gray-500">{u.email}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          <div className="flex items-center gap-2"><Calendar className="h-3 w-3" /> {new Date(u.created_at).toLocaleDateString()}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Invitation Factory */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader><CardTitle className="text-sm uppercase tracking-widest text-emerald-400">Invitation Factory</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-2">
                <Input 
                  value={newInviteCode} 
                  onChange={(e) => setNewInviteCode(e.target.value)}
                  placeholder="NEW_CODE_2026" 
                  className="bg-gray-800 border-gray-700"
                />
                <Button onClick={createInvite} className="bg-emerald-600 hover:bg-emerald-500">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                {invites.map(inv => (
                  <div key={inv.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl border border-gray-700">
                    <div className="flex items-center gap-3">
                      <Ticket className={`h-4 w-4 ${inv.is_used ? 'text-gray-600' : 'text-emerald-400'}`} />
                      <span className={`font-mono text-sm ${inv.is_used ? 'line-through text-gray-600' : 'text-gray-200'}`}>
                        {inv.code}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] uppercase font-bold ${inv.is_used ? 'text-gray-600' : 'text-emerald-500'}`}>
                        {inv.is_used ? "Used" : "Active"}
                      </span>
                      <button onClick={() => deleteInvite(inv.id)} className="text-gray-600 hover:text-red-400 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
