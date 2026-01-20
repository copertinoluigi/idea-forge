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
  Calendar,
  RefreshCw
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
      const { data: profiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      setUsers(profiles || []);

      const { data: inviteList } = await supabase.from('invites').select('*').order('created_at', { ascending: false });
      setInvites(inviteList || []);

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

  return (
    <div className="min-h-screen bg-gray-950 p-6 md:p-12 text-white font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between bg-gray-900/50 p-6 rounded-2xl border border-gray-800 shadow-2xl">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onBack} className="text-gray-400 hover:text-white hover:bg-gray-800">
              <ArrowLeft className="h-5 w-5 mr-2" /> Back
            </Button>
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500/20 p-2 rounded-lg">
                <ShieldCheck className="h-6 w-6 text-emerald-400" />
              </div>
              <h1 className="text-2xl font-black tracking-tighter uppercase italic text-white">Master Admin</h1>
            </div>
          </div>
          <Button onClick={loadAdminData} disabled={loading} variant="secondary" className="bg-gray-800 text-white hover:bg-gray-700 border-gray-700">
            {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Refresh Stats
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gray-900 border-gray-800 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold text-gray-500 uppercase tracking-widest">Total Users</CardTitle>
              <Users className="h-4 w-4 text-violet-400" />
            </CardHeader>
            <CardContent><div className="text-4xl font-black text-white">{stats.totalUsers}</div></CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-800 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold text-gray-500 uppercase tracking-widest">Active Rooms</CardTitle>
              <Activity className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent><div className="text-4xl font-black text-white">{stats.totalRooms}</div></CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-800 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold text-gray-500 uppercase tracking-widest">Messages</CardTitle>
              <Ticket className="h-4 w-4 text-amber-400" />
            </CardHeader>
            <CardContent><div className="text-4xl font-black text-white">{stats.totalMessages}</div></CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User List */}
          <Card className="bg-gray-900 border-gray-800 shadow-xl overflow-hidden">
            <CardHeader className="border-b border-gray-800 bg-gray-800/20">
              <CardTitle className="text-sm uppercase tracking-widest text-violet-400 font-bold">User Directory</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-950 text-gray-500 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="px-6 py-4">User Details</th>
                    <th className="px-6 py-4">Joined At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-gray-800/40 transition-colors">
                      <td className="px-6 py-4 flex items-center gap-3">
                        <div className="bg-violet-500/10 p-2 rounded-lg text-violet-400 font-bold uppercase text-xs">
                          {u.display_name?.substring(0,2)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-100">{u.display_name}</span>
                          <span className="text-[11px] text-gray-500 font-mono">{u.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-400 font-medium">
                        {new Date(u.created_at).toLocaleDateString('it-IT')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Invitation Factory */}
          <Card className="bg-gray-900 border-gray-800 shadow-xl">
            <CardHeader className="border-b border-gray-800 bg-gray-800/20">
              <CardTitle className="text-sm uppercase tracking-widest text-emerald-400 font-bold">Invitation Factory</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex gap-3">
                <Input 
                  value={newInviteCode} 
                  onChange={(e) => setNewInviteCode(e.target.value)}
                  placeholder="NEW_CODE_2026" 
                  className="bg-gray-950 border-gray-800 text-white font-mono uppercase tracking-widest focus:border-emerald-500"
                />
                <Button onClick={createInvite} className="bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-900/20 px-6">
                  <Plus className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-3">
                {invites.map(inv => (
                  <div key={inv.id} className="flex items-center justify-between p-4 bg-gray-950 border border-gray-800 rounded-xl">
                    <div className="flex items-center gap-4">
                      <Ticket className={`h-5 w-5 ${inv.is_used ? 'text-gray-700' : 'text-emerald-500 animate-pulse'}`} />
                      <span className={`font-mono text-sm tracking-widest ${inv.is_used ? 'line-through text-gray-600' : 'text-white font-bold'}`}>
                        {inv.code}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-[10px] px-2 py-1 rounded font-black uppercase ${inv.is_used ? 'bg-gray-800 text-gray-500' : 'bg-emerald-500/10 text-emerald-400'}`}>
                        {inv.is_used ? "Used" : "Active"}
                      </span>
                      <button 
                        onClick={async () => { await supabase.from('invites').delete().eq('id', inv.id); loadAdminData(); }}
                        className="text-gray-600 hover:text-red-500 p-1 transition-colors"
                      >
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
