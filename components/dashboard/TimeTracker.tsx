'use client'
import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, Plus, Trash2 } from 'lucide-react'
import { addTimeLog, deleteTimeLog } from '@/app/actions'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'

export default function TimeTracker({ projectId, userId, logs, hourlyRate, currency, dict }: { projectId: string, userId: string, logs: any[], hourlyRate: number, currency: string, dict: any }) {
    const formRef = useRef<HTMLFormElement>(null)
    const [isAdding, setIsAdding] = useState(false)

    // Calcoli
    const totalMinutes = logs.reduce((acc, log) => acc + log.minutes, 0)
    const totalHours = Math.floor(totalMinutes / 60)
    const remainingMinutes = totalMinutes % 60
    const totalValue = (totalMinutes / 60) * (hourlyRate || 0)

    // Modifica: h-fit invece di h-full per adattare l'altezza
    return (
        <Card className="h-fit border-l-4 border-l-emerald-500 shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-emerald-500" /> {dict.title}
                </CardTitle>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setIsAdding(!isAdding)}>
                    <Plus className={`h-4 w-4 transition-transform ${isAdding ? 'rotate-45' : ''}`} />
                </Button>
            </CardHeader>
            <CardContent>
                
                <div className="flex items-center justify-between bg-emerald-50 p-3 rounded-lg border border-emerald-100 mb-4">
                    <div>
                        <p className="text-[10px] uppercase text-emerald-600 font-bold tracking-wider">{dict.total_time}</p>
                        <p className="text-lg font-mono font-bold text-emerald-900">{totalHours}h {remainingMinutes}m</p>
                    </div>
                    {hourlyRate > 0 && (
                        <div className="text-right">
                            <p className="text-[10px] uppercase text-emerald-600 font-bold tracking-wider">{dict.value}</p>
                            <p className="text-lg font-mono font-bold text-emerald-900">{formatCurrency(totalValue, currency)}</p>
                        </div>
                    )}
                </div>

                {isAdding && (
                    <form 
                        action={async (formData) => {
                            await addTimeLog(formData)
                            formRef.current?.reset()
                            setIsAdding(false)
                            toast.success("Time logged!")
                        }}
                        ref={formRef}
                        className="mb-4 bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-2 animate-in slide-in-from-top-2"
                    >
                        <input type="hidden" name="projectId" value={projectId} />
                        <input type="hidden" name="userId" value={userId} />
                        
                        <div className="flex gap-2">
                            <input name="hours" type="number" min="0" placeholder={dict.hrs} className="w-1/2 text-sm p-2 rounded border outline-none" required />
                            <input name="minutes" type="number" min="0" max="59" placeholder={dict.mins} className="w-1/2 text-sm p-2 rounded border outline-none" />
                        </div>
                        <input name="description" placeholder={dict.desc_placeholder} className="w-full text-sm p-2 rounded border outline-none" required />
                        
                        <Button type="submit" size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700">{dict.save}</Button>
                    </form>
                )}

                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                    {logs.length === 0 && !isAdding && (
                        <p className="text-xs text-muted-foreground italic text-center py-2">{dict.no_logs}</p>
                    )}
                    
                    {logs.map((log) => (
                        <div key={log.id} className="group flex items-center justify-between p-2 rounded-md hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all text-xs">
                            <div className="flex-1">
                                <p className="font-medium text-gray-800">{log.description}</p>
                                <p className="text-[10px] text-gray-400">{new Date(log.created_at).toLocaleDateString()} • {Math.floor(log.minutes / 60)}h {log.minutes % 60}m</p>
                            </div>
                            
                            <form action={async () => await deleteTimeLog(log.id, projectId)}>
                                <button className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 transition-opacity">
                                    <Trash2 className="h-3 w-3" />
                                </button>
                            </form>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
