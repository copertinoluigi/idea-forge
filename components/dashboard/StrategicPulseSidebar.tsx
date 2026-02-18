'use client'
import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, Target, MousePointer2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { PLAYBOOK_LIBRARY } from '@/lib/constants/playbooks'

interface SidebarProps {
  onInject?: (item: any, category: string) => void;
}

export default function StrategicPulseSidebar({ onInject }: SidebarProps) {
  const router = useRouter()

  const quickPicks = useMemo(() => {
    const allItems = PLAYBOOK_LIBRARY.flatMap(cat => 
        cat.items.map(item => ({ ...item, category: cat.category }))
    );
    return [...allItems].sort(() => 0.5 - Math.random()).slice(0, 5);
  }, []);

  const handleAction = (pick: any) => {
    if (onInject) {
      // Se siamo nella pagina di creazione, iniettiamo direttamente
      onInject(pick, pick.category)
    } else {
      // Se siamo nella lista, andiamo alla pagina new con il parametro
      router.push(`/dashboard/templates/new?inject=${encodeURIComponent(pick.title)}`)
    }
  }

  return (
    <div className="w-full lg:w-72 space-y-6 lg:sticky lg:top-10 shrink-0">
        <Card className="bg-slate-900 text-white rounded-[2.5rem] border-none shadow-2xl overflow-hidden p-6">
            <div className="flex items-center gap-2 mb-6">
                <Zap className="h-4 w-4 text-amber-400 fill-amber-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Strategic Pulse</span>
            </div>
            <p className="text-[11px] text-white/70 font-medium mb-6 leading-relaxed italic">
                Random modules to challenge your current roadmap:
            </p>
            <div className="space-y-3">
                {quickPicks.map((pick, i) => (
                    <div 
                        key={i} 
                        onClick={() => handleAction(pick)}
                        className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-indigo-600 transition-all cursor-pointer group"
                    >
                        <p className="text-[11px] font-black uppercase tracking-tight leading-tight">{pick.title}</p>
                        <div className="flex items-center gap-2 mt-2 opacity-40 text-[9px] font-bold">
                            <Target size={10} /> {pick.category}
                        </div>
                    </div>
                ))}
            </div>
        </Card>

        <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
            <div className="flex items-center gap-2 mb-3 text-indigo-600">
                <MousePointer2 size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">1-Click Inject</span>
            </div>
            <p className="text-[10px] text-indigo-500 font-medium leading-relaxed">
                Clicking any suggestion will open the editor with pre-structured logic ready to use.
            </p>
        </div>
    </div>
  )
}
