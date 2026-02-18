'use client'
import { formatCurrency } from '@/lib/utils'
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  Coins, 
  ShieldCheck, 
  User,
  Clock,
  Trash2
} from 'lucide-react'
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button'
import { deleteVaultLogAction, purgeVaultLogsAction } from '@/app/actions'
import { toast } from 'sonner'

interface VaultLog {
    id: string;
    amount: number;
    vault_type: 'business' | 'personal' | 'tax';
    movement_type: 'in' | 'out';
    description: string;
    created_at: string;
}

export default function VaultHistory({ logs }: { logs: VaultLog[] }) {
    
    const getVaultIcon = (type: string) => {
        switch (type) {
            case 'tax': return <ShieldCheck size={14} className="text-blue-500" />;
            case 'personal': return <User size={14} className="text-emerald-500" />;
            default: return <Coins size={14} className="text-indigo-500" />;
        }
    };

const router = useRouter();

const handleDelete = async (id: string) => {
    if (confirm("Purge this transaction?")) {
        const result = await deleteVaultLogAction(id);
        if (result.success) {
            toast.success("Entry purged");
            router.refresh(); // <--- FORZA IL RE-RENDER
        } else {
            toast.error("Database denied deletion. Check RLS.");
        }
    }
};

const handlePurgeAll = async () => {
    if (confirm("Wipe entire history? This cannot be undone.")) {
        const result = await purgeVaultLogsAction();
        if (result.success) {
            toast.success("Audit trail cleared");
            router.refresh(); // <--- FORZA IL RE-RENDER
        } else {
            toast.error("Database denied purge. Check RLS.");
        }
    }
};
    if (logs.length === 0) {
        return (
            <div className="p-10 text-center bg-slate-50 rounded-[2rem] border border-dashed border-slate-200 mt-6">
                <History className="mx-auto h-10 w-10 text-slate-300 mb-3" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No vault movements logged yet</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 mt-8">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                    <History size={16} className="text-slate-400" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Vault Audit Trail</h3>
                </div>
                
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handlePurgeAll}
                    className="h-8 rounded-xl text-[9px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-all"
                >
                    <Trash2 size={12} className="mr-1.5" /> Purge History
                </Button>
            </div>

            <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-50 bg-slate-50/50">
                                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Description</th>
                                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Vault</th>
                                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Amount</th>
                                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Date</th>
                                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {logs.map((log) => (
                                <tr key={log.id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${log.movement_type === 'in' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                            {log.movement_type === 'in' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-xs font-bold text-slate-700">{log.description}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-slate-100 rounded-lg group-hover:bg-white transition-colors">
                                                {getVaultIcon(log.vault_type)}
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-tight text-slate-400">{log.vault_type}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-sm font-black font-mono ${log.movement_type === 'in' ? 'text-emerald-600' : 'text-slate-900'}`}>
                                            {log.movement_type === 'in' ? '+' : '-'}{formatCurrency(log.amount)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Clock size={12} />
                                            <span className="text-[10px] font-bold uppercase">
                                                {new Date(log.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button 
                                            onClick={() => handleDelete(log.id)}
                                            className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-rose-500 hover:bg-white rounded-lg transition-all"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
