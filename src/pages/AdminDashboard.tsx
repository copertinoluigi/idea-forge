import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Users, Ticket, ArrowLeft, Plus, Trash2, ShieldCheck, Activity, RefreshCw } from 'lucide-react';

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
      const { data: p } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      setUsers(p || []);
      const { data: i } = await supabase.from('invites').select('*').order('created_at', { ascending: false });
      setInvites(i || []);
      const { count: u } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: r } = await supabase.from('rooms').select('*', { count: 'exact', head: true });
      const { count: m } = await supabase.from('messages').select('*', { count: 'exact', head: true });
      setStats({ totalUsers: u || 0, totalRooms: r || 0, totalMessages: m || 0 });
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
      await loadAdminData();
      toast({ title: "Codice Creato", description: "Invito aggiunto con successo." });
    } catch (err: any) {
      toast({ title: "Errore", description: err.message, variant: "destructive" });
    }
  };

  const deleteInvite = async (id: string) => {
    try {
      await supabase.from('invites').delete().eq('id', id);
      await loadAdminData();
    } catch (err: any) {
      toast({ title: "Errore", description: "Impossibile eliminare l'invito", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 p-4 md:p-8 text-white font-sans overflow-x-hidden">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Responsive */}
        <div className="flex flex-wrap items-center justify-between bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-2xl gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onBack} className="text-gray-400 hover:text-white p-2">
              <ArrowLeft className="h-5 w-5 md:mr-2" />
              <span className="hidden md:inline">Back to Chat</span>
            </Button>
            <div className="flex items-center gap-2 border-l border-gray-800 pl-4">
              <ShieldCheck className="h-6 w-6 text-emerald-400" />
              <h1 className="text-lg md:text-2xl font-black uppercase italic tracking-tighter text-white">BYOI Admin</h1>
            </div>
          </div>
          <Button onClick={loadAdminData} disabled={loading} variant="secondary" className="bg-emerald-600 hover:bg-emerald-500 text-white border-none font-bold px-6 h-10">
            {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Refresh
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gray-900 border-gray-800 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-gray-800/50 mb-4">
              <CardTitle className="text-[10px] text-gray-500 uppercase font-black tracking-widest text-white">Total Users</CardTitle>
              <Users className="h-4 w-4 text-violet-400" />
            </CardHeader>
            <CardContent><div className="text-5xl font-black text-white">{stats.totalUsers}</div></CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-800 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-gray-800/50 mb-4">
              <CardTitle className="text-[10px] text-gray-500 uppercase font-black tracking-widest text-white">Active Rooms</CardTitle>
              <Activity className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent><div className="text-5xl font-black text-white">{stats.totalRooms}</div></CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-800 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-gray-800/50 mb-4">
              <CardTitle className="text-[10px] text-gray-500 uppercase font-black tracking-widest text-white">Messages</CardTitle>
              <Ticket className="h-4 w-4 text-amber-400" />
            </CardHeader>
            <CardContent><div className="text-5xl font-black text-white">{stats.totalMessages}</div></CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12">
          {/* User List */}
          <Card className="bg-gray-900 border-gray-800 overflow-hidden">
            <CardHeader className="bg-gray-800/20 border-b border-gray-800"><CardTitle className="text-xs text-violet-400 font-black uppercase tracking-widest">User Directory</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-950 text-gray-600 uppercase text-[10px] font-black">
                    <tr>
                      <th className="px-6 py-4">Account Email</th>
                      <th className="px-6 py-4 text-right">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-gray-800/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-200">{u.email}</td>
                        <td className="px-6 py-4 text-right text-gray-500 font-mono text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Invitation Lab */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="bg-gray-800/20 border-b border-gray-800"><CardTitle className="text-xs text-emerald-400 font-black uppercase tracking-widest">Invitation Factory</CardTitle></CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex gap-2">
                <Input 
                  value={newInviteCode} 
                  onChange={(e) => setNewInviteCode(e.target.value)} 
                  placeholder="NEW_CODE_2026" 
                  className="bg-gray-950 border-gray-800 text-white font-mono uppercase tracking-widest h-12" 
                />
                <Button onClick={createInvite} className="bg-violet-600 hover:bg-violet-500 h-12 px-6">
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {invites.map(i => (
                  <div key={i.id} className="flex justify-between items-center p-4 bg-gray-950 rounded-xl border border-gray-800 group transition-all">
                    <span className={`font-mono font-bold tracking-widest ${i.is_used ? 'text-gray-700 line-through' : 'text-emerald-500'}`}>{i.code}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] uppercase font-black text-gray-600">{i.is_used ? 'Used' : 'Active'}</span>
                      <button onClick={() => deleteInvite(i.id)} className="text-gray-700 hover:text-red-500 transition-colors"><Trash2 className="h-4 w-4" /></button>
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
