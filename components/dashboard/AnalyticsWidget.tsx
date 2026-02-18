'use client'
import { ExternalLink, BarChart3, Info, ShieldCheck, Lock, ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AnalyticsWidget({ url }: { url: string | null }) {
  if (!url) return null

  // Verifica se il link è effettivamente un link EMBED (l'unico che Google permette di vedere qui)
  const isEmbed = url.includes('/embed/')
  
  return (
    <div className="w-full space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-700 font-sans">
      
      {/* HEADER DEL WIDGET */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-50 rounded-lg border border-indigo-100">
            <BarChart3 size={14} className="text-indigo-600" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Project Intelligence Node
          </span>
        </div>
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[10px] font-bold text-indigo-600 hover:text-white hover:bg-indigo-600 transition-all flex items-center gap-1.5 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 shadow-sm"
        >
          Open Full Report <ExternalLink size={10} />
        </a>
      </div>

      {isEmbed ? (
        /* CASO A: IL LINK È CORRETTO - MOSTRA IFRAME */
        <div className="relative aspect-video w-full rounded-[2.5rem] border border-slate-200 bg-white overflow-hidden shadow-2xl group">
          <iframe
            src={url}
            className="w-full h-full border-0"
            allowFullScreen
            sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          />
          <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="p-2.5 bg-white/90 backdrop-blur-md shadow-2xl rounded-2xl border border-slate-100 flex items-center gap-2.5">
                  <div className="p-1.5 bg-emerald-100 rounded-xl text-emerald-600">
                      <ShieldCheck size={14} />
                  </div>
                  <span className="text-[10px] font-black uppercase text-slate-700 tracking-tighter">Live Connection Verified</span>
              </div>
          </div>
        </div>
      ) : (
        /* CASO B: IL LINK NON È EMBED - NASCONDI IFRAME E MOSTRA ISTRUZIONI */
        <div className="w-full p-8 md:p-12 rounded-[2.5rem] border-2 border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center text-center space-y-6">
            <div className="h-16 w-16 bg-white rounded-[1.5rem] shadow-xl flex items-center justify-center text-amber-500 border border-slate-100">
                <Lock size={28} />
            </div>
            
            <div className="space-y-2 max-w-sm">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Preview Protocol Locked</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    You've connected a standard sharing link. Google's security policy prevents live previews for this format.
                </p>
            </div>

            <div className="flex flex-col gap-3 w-full max-w-xs">
                <a href={url} target="_blank" className="w-full">
                    <Button variant="outline" className="w-full h-12 rounded-xl bg-white border-slate-200 font-bold text-xs uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all">
                        View Report Externally <ArrowUpRight className="ml-2 h-4 w-4" />
                    </Button>
                </a>
            </div>

            <div className="pt-6 border-t border-slate-200 w-full max-w-md">
                <div className="flex items-start gap-3 text-left bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <Info size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                    <div className="text-[10px] text-slate-600 font-medium leading-relaxed">
                        <p className="font-black uppercase text-indigo-600 mb-1">To enable live preview:</p>
                        Open Looker Studio &gt; <b>File</b> &gt; <b>Embed Report</b> &gt; Enable <b>"Embed URL"</b> and paste that specific link in the project settings.
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  )
}
