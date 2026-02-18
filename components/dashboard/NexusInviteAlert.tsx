"use client"

import React, { useState } from "react"
import { Loader2, Sparkles, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { acceptNexusInviteAction } from "@/app/actions-nexus"
import { toast } from "sonner"

interface PendingInvite {
    id: string
    projects: {
        title: string
    }
}

export function NexusInviteAlert({ pendingInvites }: { pendingInvites: PendingInvite[] }) {
    const [loadingId, setLoadingId] = useState<string | null>(null)

    if (!pendingInvites || pendingInvites.length === 0) return null

    const handleAccept = async (id: string) => {
        setLoadingId(id)
        try {
            const res = await acceptNexusInviteAction(id)
            if (res.success) {
                toast.success("NEXUS_ACCESS_GRANTED")
            } else {
                if (res.error === "PRO_LICENSE_REQUIRED") {
                    toast.error("PRO or BETA account required to join a Nexus.")
                } else {
                    toast.error(res.error)
                }
            }
        } catch (err) {
            toast.error("Connection failed")
        } finally {
            setLoadingId(null)
        }
    }

    return (
        <div className="space-y-4 mb-10">
            {pendingInvites.map((invite) => (
                <Card key={invite.id} className="p-6 border-2 border-indigo-600 bg-indigo-50/30 shadow-xl rounded-[2.5rem] animate-in slide-in-from-top-4 duration-500">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="h-14 w-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                                <Sparkles size={28} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-900 leading-none mb-1">
                                    Nexus Summon Received
                                </h3>
                                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-[0.2em] italic opacity-80">
                                    Invitation to collaborate on: {invite.projects?.title}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <Button 
                                onClick={() => handleAccept(invite.id)}
                                disabled={loadingId === invite.id}
                                className="flex-1 md:flex-none h-12 px-10 bg-slate-950 hover:bg-indigo-600 text-white rounded-xl font-black uppercase italic tracking-tighter shadow-lg transition-all active:scale-95"
                            >
                                {loadingId === invite.id ? (
                                    <Loader2 className="animate-spin" />
                                ) : (
                                    <><ShieldCheck className="mr-2 h-4 w-4" /> Accept Mission</>
                                )}
                            </Button>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    )
}
