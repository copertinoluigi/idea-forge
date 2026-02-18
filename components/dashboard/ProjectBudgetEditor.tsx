'use client'

import { useState } from 'react'
import { Coins, Pencil, Check, X, Loader2 } from 'lucide-react'
import { updateProjectBudgetAction } from '@/app/actions'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'

interface Props {
    projectId: string
    initialBudget: number
}

export default function ProjectBudgetEditor({ projectId, initialBudget }: Props) {
    const [isEditing, setIsEditing] = useState(false)
    const [value, setValue] = useState(initialBudget.toString())
    const [loading, setLoading] = useState(false)

    const handleSave = async () => {
        setLoading(true)
        const amount = parseFloat(value) || 0
        const result = await updateProjectBudgetAction(projectId, amount)
        
        if (result.success) {
            toast.success("Project budget updated")
            setIsEditing(false)
        } else {
            toast.error("Failed to update budget")
        }
        setLoading(false)
    }

    if (isEditing) {
        return (
            <div className="flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center">
                    <p className="text-indigo-400 text-[10px] font-bold uppercase tracking-[0.2em]">Set New Budget</p>
                    <button onClick={() => setIsEditing(false)} className="text-slate-500 hover:text-white transition-colors">
                        <X size={14} />
                    </button>
                </div>
                <div className="relative">
                    <input 
                        type="number" 
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-xl font-bold text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        autoFocus
                    />
                    <button 
                        onClick={handleSave}
                        disabled={loading}
                        className="absolute right-2 top-2 p-1.5 bg-indigo-600 rounded-lg text-white hover:bg-indigo-500 disabled:opacity-50"
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="group space-y-4">
            <div className="flex justify-between items-center">
                <p className="text-indigo-400 text-[10px] font-bold uppercase tracking-[0.2em]">Project Budget</p>
                <button 
                    onClick={() => setIsEditing(true)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 bg-white/5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                >
                    <Pencil size={12} />
                </button>
            </div>
            
            <div className="cursor-pointer" onClick={() => setIsEditing(true)}>
                <h4 className="text-3xl font-bold tracking-tight text-white">{formatCurrency(initialBudget)}</h4>
                <p className="text-slate-400 text-[10px] font-medium mt-1 uppercase tracking-widest">Allocated Funds</p>
            </div>
        </div>
    )
}
