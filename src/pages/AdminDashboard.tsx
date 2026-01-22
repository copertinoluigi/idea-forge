import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, MessageSquare, Database, Shield, 
  ArrowLeft, Loader2, HardDrive, Activity, 
  Plus, Copy, Check, Trash2, Mail
} from 'lucide-react';

interface Stats {
  totalUsers: number;
  totalRooms: number;
  totalMessages: number;
  dbSizeMB: number;
  storageSizeMB: number;
}

interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
}

interface Invite {
  id: string;
  code: string;
  is_used: boolean;
  created_at: string;
}

export function AdminDashboard({ onBack }: { onBack: () => void }) {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0, totalRooms: 0, totalMessages: 0, dbSizeMB: 0, storageSizeMB: 0
  });
  const [userList, setUserList] = useState<UserProfile[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [users, rooms, messages, profiles, inviteList] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('rooms').select('id', { count: 'exact' }),
        supabase.from('messages').select('id', { count: 'exact' }),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('invites').select('*').order('created_at', { ascending: false })
      ]);

      const estimatedDbSize = ((messages.count || 0) * 2 + (rooms.count || 0) * 1) / 1024;
      
      setStats({
        totalUsers: users.count || 0,
        totalRooms: rooms.count || 0,
        totalMessages: messages.count || 0,
        dbSizeMB: Number(estimatedDbSize.toFixed(2)),
        storageSizeMB: 0.5 // Stima forfettaria
      });

      if (profiles.data) setUserList(profiles.data);
      if (inviteList.data) setInvites(inviteList.data);

    } catch (error: any) {
      toast({ title: "Errore caricamento", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const generateInvite = async () => {
    setCreatingInvite(true);
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    try {
      const { error } = await supabase.from('invites').insert({ code, is_used: false });
      if (error) throw error;
      toast({ title: "Invito generato: " + code });
      loadAllData();
    } catch (error: any) {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    } finally {
      setCreatingInvite(false);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const deleteInvite = async (id: string) => {
    try {
      await supabase.from('invites').delete().eq('id', id);
      setInvites(invites.filter(i => i.id !== id));
    } catch (error: any) {
      toast({ title: "Errore eliminazione", variant: "destructive" });
    }
  };

  const dbLimit = 500;
  const dbFillPercent = Math.min((stats.dbSizeMB / dbLimit) * 100, 100);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-gray-950 overflow-y-auto custom-scrollbar">
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-20">
        
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack} className="text-gray-400 hover:text-white">
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-2xl font-black uppercase italic tracking-widest text-white">System Admin</h1>
          </div>
          <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2">
            <Activity className="h-3 w-3 text-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-emerald-500 uppercase">Live Status</span>
          </div>
        </div>

        {/* TOP STATS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[10px] font-bold text-gray-500 uppercase">Total Users</CardTitle>
              <Users className="h-4 w-4 text-violet-400" />
            </CardHeader>
            <CardContent><div className="text-2xl font-black text-white">{stats.totalUsers}</div></CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[10px] font-bold text-gray-500 uppercase">Rooms</CardTitle>
              <Shield className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent><div className="text-2xl font-black text-white">{stats.totalRooms}</div></CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[10px] font-bold text-gray-500 uppercase">Database Usage</CardTitle>
              <Database className="h-4 w-4 text-rose-400" />
            </CardHeader>
            <CardContent><div className="text-2xl font-black text-white">{dbFillPercent.toFixed(1)}%</div></CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[10px] font-bold text-gray-500 uppercase">Total Messages</CardTitle>
              <MessageSquare className="h-4 w-4 text-amber-400" />
            </CardHeader>
            <CardContent><div className="text-2xl font-black text-white">{stats.totalMessages}</div></CardContent>
          </Card>
        </div>

        {/* MAIN PANELS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* USER DIRECTORY */}
          <Card className="bg-gray-900 border-gray-800 flex flex-col h-[500px]">
            <CardHeader className="border-b border-gray-800">
              <CardTitle className="text-sm font-black uppercase text-gray-300 flex items-center gap-2">
                <Mail className="h-4 w-4 text-violet-500" /> User Directory
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0 custom-scrollbar">
              <div className="divide-y divide-gray-800">
                {userList.map(u => (
                  <div key={u.id} className="p-4 hover:bg-gray-800/30 transition-colors flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">{u.display_name}</p>
                      <p className="text-[10px] text-gray-500 font-mono">{u.email}</p>
                    </div>
                    <span className="text-[9px] text-gray-600 font-mono whitespace-nowrap ml-4">
                      {new Date(u.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* INVITATION FACTORY */}
          <Card className="bg-gray-900 border-gray-800 flex flex-col h-[500px]">
            <CardHeader className="border-b border-gray-800 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-black uppercase text-gray-300 flex items-center gap-2">
                <Plus className="h-4 w-4 text-emerald-500" /> Invitation Factory
              </CardTitle>
              <Button 
                onClick={generateInvite} 
                disabled={creatingInvite}
                size="sm" 
                className="bg-emerald-600 hover:bg-emerald-500 text-[10px] font-black uppercase h-8"
              >
                {creatingInvite ? <Loader2 className="h-3 w-3 animate-spin" /> : "Nuovo Codice"}
              </Button>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0 custom-scrollbar">
              <div className="divide-y divide-gray-800">
                {invites.length === 0 && (
                  <div className="p-10 text-center text-gray-600 text-xs uppercase font-bold tracking-widest">Nessun invito attivo</div>
                )}
                {invites.map(i => (
                  <div key={i.id} className="p-4 flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${i.is_used ? 'bg-gray-700' : 'bg-emerald-500 animate-pulse'}`} />
                      <span className={`font-mono text-sm font-bold ${i.is_used ? 'text-gray-600 line-through' : 'text-white'}`}>
                        {i.code}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {!i.is_used && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-gray-500 hover:text-white"
                          onClick={() => copyToClipboard(i.code)}
                        >
                          {copiedCode === i.code ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => deleteInvite(i.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
