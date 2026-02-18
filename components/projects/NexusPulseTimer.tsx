"use client"

import React, { useState, useEffect } from "react"
import { Play, Square, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { startPulseSession, stopPulseSession } from "@/app/actions-timer"
import { toast } from "sonner"
import { cn } from "@/lib/utils" // <--- IMPORT AGGIUNTO

interface NexusPulseTimerProps {
    projectId: string
    activeSession: any
    openTasks: any[]
}

export function NexusPulseTimer({ projectId, activeSession }: NexusPulseTimerProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [seconds, setSeconds] = useState(0)

    // Timer locale per mostrare i secondi che passano
    useEffect(() => {
        let interval: any;
        if (activeSession) {
            const start = new Date(activeSession.start_time).getTime()
            interval = setInterval(() => {
                setSeconds(Math.floor((Date.now() - start) / 1000))
            }, 1000)
        } else {
            setSeconds(0)
        }
        return () => clearInterval(interval)
    }, [activeSession])

    const formatTime = (s: number) => {
        const h = Math.floor(s / 3600)
        const m = Math.floor((s % 3600) / 60)
        const sec = s % 60
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
    }

    const handleStart = async () => {
        setIsLoading(true)
        try {
            await startPulseSession(projectId)
            toast.success("Pulse session started")
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleStop = async () => {
        const desc = window.prompt("What did you achieve in this session?")
        if (desc === null) return;
        
        setIsLoading(true)
        try {
            await stopPulseSession(projectId, desc, [])
            toast.success("Session committed to ledger")
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className={cn(
            "p-6 rounded-[2rem] border-2 transition-all duration-500 mb-8 shadow-sm",
            activeSession ? "bg-rose-50 border-rose-200 shadow-rose-100" : "bg-white border-slate-100"
        )}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "h-12 w-12 rounded-xl flex items-center justify-center transition-colors",
                        activeSession ? "bg-rose-600 text-white animate-pulse" : "bg-slate-100 text-slate-400"
                    )}>
                        {activeSession ? <Square size={20} /> : <Play size={20} />}
                    </div>
                    <div>
                        <h4 className="text-sm font-black uppercase tracking-widest text-slate-900">
                            {activeSession ? "Active Pulse Session" : "Ready for Execution"}
                        </h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">
                            {activeSession ? `Elapsed Time: ${formatTime(seconds)}` : "Start the timer to log your contribution"}
                        </p>
                    </div>
                </div>

                <Button 
                    onClick={activeSession ? handleStop : handleStart}
                    disabled={isLoading}
                    className={cn(
                        "h-12 px-8 rounded-xl font-black uppercase italic tracking-tighter transition-all shadow-md",
                        activeSession 
                            ? "bg-rose-600 hover:bg-rose-700 text-white" 
                            : "bg-indigo-600 hover:bg-indigo-700 text-white"
                    )}
                >
                    {isLoading ? <Loader2 className="animate-spin" /> : activeSession ? "Stop & Commit" : "Start Pulse"}
                </Button>
            </div>
        </Card>
    )
}
