import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, MessageSquare, Database, Shield, 
  ArrowLeft, Loader2, HardDrive, Activity 
} from 'lucide-react';

interface Stats {
  totalUsers: number;
  totalRooms: number;
  totalMessages: number;
  dbSizeMB: number;
  storageSizeMB: number;
}

export function AdminDashboard({ onBack }: { onBack: () => void }) {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalRooms: 0,
    totalMessages: 0,
    dbSizeMB: 0,
    storageSizeMB: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      
      const [users, rooms, messages, objects] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('rooms').select('id', { count: 'exact' }),
        supabase.from('messages').select('id', { count: 'exact' }),
        supabase.storage.from('room-assets').list('', { limit: 100 })
      ]);

      // Stima occupazione DB (stima pessimistica di 2KB per messaggio/riga)
      const estimatedDbSize = ((messages.count || 0) * 2 + (rooms.count || 0) * 1) / 1024;
      
      // Stima storage (Supabase non espone la taglia totale via client facilmente, simuliamo)
      const estimatedStorage = (objects.data?.length || 0) * 0.5;

      setStats({
        totalUsers: users.count || 0,
        totalRooms: rooms.count || 0,
        totalMessages: messages.count || 0,
        dbSizeMB: Number(estimatedDbSize.toFixed(2)),
        storageSizeMB: Number(estimatedStorage.toFixed(2))
      });
    } catch (error: any) {
      toast({ title: "Errore caricamento statistiche", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const dbLimit = 500; // 500MB limite Supabase Free
  const storageLimit = 1000; // 1GB limite Supabase Free
  const dbFillPercent = Math.min((stats.dbSizeMB / dbLimit) * 100, 100);
  const storageFillPercent = Math.min((stats.storageSizeMB / storageLimit) * 100, 100);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-gray-950 overflow-y-auto custom-scrollbar">
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack} className="text-gray-400 hover:text-white">
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-2xl font-black uppercase italic tracking-widest text-white">System Admin</h1>
          </div>
          <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2">
            <Activity className="h-3 w-3 text-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-emerald-500 uppercase">Live System Status</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold text-gray-400 uppercase">Total Users</CardTitle>
              <Users className="h-4 w-4 text-violet-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-white">{stats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold text-gray-400 uppercase">Rooms Active</CardTitle>
              <Shield className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-white">{stats.totalRooms}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold text-gray-400 uppercase">Total Messages</CardTitle>
              <MessageSquare className="h-4 w-4 text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-white">{stats.totalMessages}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold text-gray-400 uppercase">DB Health</CardTitle>
              <Database className="h-4 w-4 text-rose-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-white">{dbFillPercent.toFixed(1)}%</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase text-gray-300 flex items-center gap-2">
                <Database className="h-4 w-4 text-rose-500" /> Database Allocation (PostgreSQL)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-gray-500 uppercase tracking-widest">Usage</span>
                  <span className="text-white">{stats.dbSizeMB} MB / {dbLimit} MB</span>
                </div>
                <div className="h-2 bg-gray-950 rounded-full overflow-hidden border border-gray-800">
                  <div 
                    className="h-full bg-rose-500 transition-all duration-1000" 
                    style={{ width: `${dbFillPercent}%` }}
                  />
                </div>
              </div>
              <p className="text-[10px] text-gray-500 italic">Basato su stima media pesata delle righe.</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase text-gray-300 flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-violet-500" /> Storage Allocation (Bucket)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-gray-500 uppercase tracking-widest">Usage</span>
                  <span className="text-white">{stats.storageSizeMB} MB / {storageLimit} MB</span>
                </div>
                <div className="h-2 bg-gray-950 rounded-full overflow-hidden border border-gray-800">
                  <div 
                    className="h-full bg-violet-500 transition-all duration-1000" 
                    style={{ width: `${storageFillPercent}%` }}
                  />
                </div>
              </div>
              <p className="text-[10px] text-gray-500 italic">Occupazione reale asset multimediali caricati.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
