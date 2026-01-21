import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Loader2, TrendingUp, History, FileText, CheckSquare, Square } from 'lucide-react';

interface Summary {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

interface SummarySidebarProps {
  isOpen: boolean;
  roomId: string | null;
  onClose: () => void;
  onGenerate: (selectedSummaryIds: string[]) => Promise<void>;
  loading?: boolean;
}

export function SummarySidebar({ isOpen, roomId, onClose, onGenerate, loading }: SummarySidebarProps) {
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [selectedSummaries, setSelectedSummaries] = useState<string[]>([]);
  const [viewingSummary, setViewingSummary] = useState<Summary | null>(null);

  useEffect(() => {
    if (isOpen && roomId) loadSummaries();
  }, [isOpen, roomId]);

  const loadSummaries = async () => {
    const { data } = await supabase
      .from('summaries')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false });
    setSummaries(data || []);
  };

  if (!isOpen) return null;

  return (
    // Aggiunto pt e pb per gestire Notch e Home Bar su iOS
    <div className="fixed inset-y-0 right-0 w-full md:w-[400px] bg-gray-950 border-l border-gray-800 z-[60] flex flex-col shadow-2xl pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/50">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-violet-400" />
          <h2 className="font-bold text-white uppercase text-xs tracking-widest">Snapshot Archive</h2>
        </div>
        <Button size="icon" variant="ghost" onClick={onClose}><X className="h-4 w-4" /></Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        {viewingSummary ? (
          <div className="space-y-4 animate-in fade-in duration-300">
            <Button variant="ghost" size="sm" onClick={() => setViewingSummary(null)} className="text-violet-400 p-0 hover:bg-transparent">
              ← Torna all'elenco
            </Button>
            <h3 className="text-lg font-bold text-white">{viewingSummary.title}</h3>
            <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed bg-gray-900/80 p-4 rounded-xl border border-gray-800">
              {viewingSummary.content}
            </div>
          </div>
        ) : (
          <div className="space-y-3 pb-10">
            <p className="text-[10px] text-gray-500 uppercase font-bold mb-4">Seleziona riassunti da includere nel prossimo context:</p>
            {summaries.map(s => (
              <div key={s.id} className="group relative bg-gray-900/50 border border-gray-800 rounded-xl p-3 hover:border-violet-500/50 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => setViewingSummary(s)}>
                    <FileText className="h-4 w-4 text-gray-500" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-200 truncate">{s.title}</p>
                      <p className="text-[10px] text-gray-600">{new Date(s.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedSummaries(prev => prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id])}
                    className="text-violet-500"
                  >
                    {selectedSummaries.includes(s.id) ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5 text-gray-700" />}
                  </button>
                </div>
              </div>
            ))}
            
            <Button 
              className="w-full bg-violet-600 hover:bg-violet-500 mt-6 h-12 font-bold" 
              disabled={loading}
              onClick={() => onGenerate(selectedSummaries)}
            >
              {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <TrendingUp className="h-4 w-4 mr-2" />}
              Genera Nuovo Layer
            </Button>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
