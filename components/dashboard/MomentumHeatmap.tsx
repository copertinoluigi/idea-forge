import { Info } from 'lucide-react'

export function MomentumHeatmap({ data, dict }: { data: Record<string, number>, dict: any }) {
  const s = dict.strategic;
  const days = Array.from({ length: 84 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (83 - i));
    return d.toISOString().split('T')[0];
  });

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="space-y-1">
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            {s.momentum_title}
          </h3>
          <p className="text-xs text-slate-500 max-w-md leading-relaxed">
            {s.momentum_desc}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100 h-fit">
            <span className="text-[10px] font-bold text-slate-400 uppercase">{s.intensity}</span>
            <div className="flex gap-1 items-center">
                {[0, 1, 2, 3].map(v => (
                    <div key={v} className={`h-3 w-3 rounded-sm ${v === 0 ? 'bg-slate-100' : v === 1 ? 'bg-indigo-200' : v === 2 ? 'bg-indigo-400' : 'bg-indigo-600'}`} />
                ))}
            </div>
        </div>
      </div>

      <div className="grid grid-flow-col grid-rows-7 gap-1.5 w-full overflow-x-auto pb-4 custom-scrollbar">
        {days.map(date => {
          const count = data[date] || 0;
          let color = 'bg-slate-100';
          if (count === 1) color = 'bg-indigo-100';
          if (count === 2) color = 'bg-indigo-300';
          if (count >= 3) color = 'bg-indigo-500';
          if (count >= 5) color = 'bg-indigo-700';
          
          return (
            <div 
              key={date} 
              className={`h-3 w-3 sm:h-4 sm:w-4 rounded-sm transition-all hover:scale-125 hover:z-10 cursor-help ${color}`}
              title={`${new Date(date).toLocaleDateString()}: ${count} activity`}
            />
          )
        })}
      </div>
      
      <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-2 text-[10px] font-bold text-indigo-500 uppercase tracking-widest">
         <Info className="h-3 w-3" />
         {s.momentum_tip}
      </div>
    </div>
  )
}
