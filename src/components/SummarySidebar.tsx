import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Loader2, AlertCircle, TrendingUp, Map } from 'lucide-react';

interface SummarySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: () => Promise<string>;
}

export function SummarySidebar({ isOpen, onClose, onGenerate }: SummarySidebarProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await onGenerate();
      setSummary(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossibile generare il riassunto');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[480px] bg-gray-900 border-l border-gray-800 z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
            <TrendingUp className="h-5 w-5 text-violet-400" />
          </div>
          <h2 className="text-lg font-semibold text-white">Analisi AI</h2>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={onClose}
          className="text-gray-400 hover:text-white hover:bg-gray-800"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        {!summary && !loading && !error && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="p-4 rounded-full bg-violet-500/10 border border-violet-500/20 inline-block">
                <TrendingUp className="h-8 w-8 text-violet-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-white">Genera Analisi AI</h3>
                <p className="text-sm text-gray-400 max-w-sm">
                  Ottieni insights critici, ricerca di mercato e roadmap 0-to-launch basata sulla tua conversazione
                </p>
              </div>
              <Button
                onClick={handleGenerate}
                className="bg-violet-600 hover:bg-violet-500 text-white"
              >
                Genera Analisi
              </Button>
            </div>
          </div>
        )}

        {loading && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="relative">
                <div className="absolute inset-0 blur-xl bg-violet-500/30 animate-pulse"></div>
                <Loader2 className="h-12 w-12 text-violet-400 animate-spin mx-auto relative" />
              </div>
              <div className="space-y-2">
                <p className="text-base font-medium text-white">Gemini sta analizzando...</p>
                <p className="text-sm text-gray-400">Elaborazione della conversazione in corso</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-red-300">Errore</p>
                <p className="text-sm text-red-400">{error}</p>
              </div>
            </div>
            <Button
              onClick={handleGenerate}
              variant="outline"
              className="mt-3 w-full border-red-500/20 text-red-300 hover:bg-red-500/10"
            >
              Riprova
            </Button>
          </div>
        )}

        {summary && (
          <div className="space-y-4">
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="h-5 w-5 text-violet-400" />
                <h3 className="text-lg font-semibold text-white m-0">Analisi Critica</h3>
              </div>
              <div className="text-gray-300 text-sm whitespace-pre-wrap">
                {summary.split('## Market Research')[0].split('## Ricerca di Mercato')[0]}
              </div>
            </div>

            {(summary.includes('## Market Research') || summary.includes('## Ricerca di Mercato')) && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-5 w-5 text-green-400" />
                  <h3 className="text-lg font-semibold text-white m-0">Ricerca di Mercato</h3>
                </div>
                <div className="text-gray-300 text-sm whitespace-pre-wrap">
                  {(summary.split('## Market Research')[1] || summary.split('## Ricerca di Mercato')[1])
                    ?.split('## Roadmap')[0]}
                </div>
              </div>
            )}

            {summary.includes('## Roadmap') && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Map className="h-5 w-5 text-violet-400" />
                  <h3 className="text-lg font-semibold text-white m-0">Roadmap 0-to-Launch</h3>
                </div>
                <div className="text-gray-300 text-sm whitespace-pre-wrap">
                  {summary.split('## Roadmap')[1]}
                </div>
              </div>
            )}

            <Button
              onClick={handleGenerate}
              variant="outline"
              className="w-full border-gray-700 bg-gray-800/50 text-white hover:bg-gray-800"
            >
              Rigenera Analisi
            </Button>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
