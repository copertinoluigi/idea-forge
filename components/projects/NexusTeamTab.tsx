"use client"

import React, { useState } from "react"
import { Users2, Mail, ShieldCheck, Trash2, Loader2, UserPlus, CheckCircle2, Clock, Crown, DollarSign, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { inviteMemberAction, removeMemberAction, updateMemberRateAction, approveTimeLogAction } from "@/app/actions-nexus"
import { cn } from "@/lib/utils"

export function NexusTeamTab({ projectId, members, isArchitect, ownerProfile, pendingLogs }: any) {
    const [email, setEmail] = useState("")
    const [role, setRole] = useState<'operator' | 'guest'>('operator')
    const [isLoading, setIsLoading] = useState(false)
    const [updatingRateId, setUpdatingRateId] = useState<string | null>(null)

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        const res = await inviteMemberAction(projectId, email, role)
        if (res.success) { toast.success("INVITE_DISPATCHED"); setEmail(""); }
        else { toast.error(res.error); }
        setIsLoading(false)
    }

    const handleRateChange = async (memberId: string, rate: string) => {
        setUpdatingRateId(memberId)
        await updateMemberRateAction(projectId, memberId, parseFloat(rate))
        setUpdatingRateId(null)
        toast.success("Rate synchronized")
    }

    const handleApprove = async (logId: string) => {
        const res = await approveTimeLogAction(projectId, logId)
        if (res.success) toast.success("Log approved & budget updated")
    }

    const formatName = (profile: any) => {
        const p = Array.isArray(profile) ? profile[0] : profile;
        if (!p || !p.first_name) return null;
        return `${p.first_name} ${p.last_name?.charAt(0)}.`;
    }

    return (
        <div className="space-y-12 animate-in fade-in duration-500">
            {/* 1. INVITE SECTION (Architect Only) */}
            {isArchitect && (
                <Card className="p-8 border-2 border-slate-100 rounded-[2.5rem] bg-white shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <UserPlus className="text-indigo-600" size={20} />
                        <h3 className="text-xl font-black italic uppercase tracking-tighter">Nexus Recruitment</h3>
                    </div>
                    <form onSubmit={handleInvite} className="flex flex-col md:flex-row gap-4">
                        <input 
                            type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                            placeholder="collaborator@email.com"
                            className="flex-1 h-14 px-6 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl text-sm font-bold outline-none text-slate-900"
                            required
                        />
                        <select 
                            value={role} onChange={(e: any) => setRole(e.target.value)}
                            className="h-14 px-6 bg-slate-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl text-xs font-black uppercase outline-none cursor-pointer"
                        >
                            <option value="operator">OPERATOR</option>
                            <option value="guest">GUEST</option>
                        </select>
                        <Button disabled={isLoading} className="h-14 px-8 bg-slate-950 text-white rounded-2xl font-black uppercase italic tracking-tighter shadow-lg hover:bg-indigo-600 transition-all">
                            {isLoading ? <Loader2 className="animate-spin" /> : "Dispatch Mission"}
                        </Button>
                    </form>
                </Card>
            )}

            {/* 2. PENDING APPROVALS (Architect Only) */}
            {isArchitect && pendingLogs && pendingLogs.length > 0 && (
                <div className="space-y-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-500 px-4 flex items-center gap-2">
                        <Clock size={12} /> Awaiting Budget Approval
                    </span>
                    {pendingLogs.map((log: any) => (
                        <Card key={log.id} className="p-6 border-2 border-dashed border-rose-100 rounded-[2rem] bg-rose-50/30 flex flex-col md:flex-row items-center justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-black uppercase text-slate-900">{formatName(log.profiles)}</span>
                                    <span className="text-[10px] font-bold text-rose-500 bg-rose-100 px-2 py-0.5 rounded-full">{log.minutes} Min</span>
                                </div>
                                <p className="text-xs text-slate-500 font-medium italic">"{log.description}"</p>
                            </div>
                            <Button onClick={() => handleApprove(log.id)} className="h-10 px-6 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-md">
                                Approve & Pay
                            </Button>
                        </Card>
                    ))}
                </div>
            )}

            {/* 3. TEAM LIST */}
            <div className="grid gap-4">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 px-4">Project Stakeholders</span>
                
                {/* OWNER CARD */}
                <Card className="p-6 border-2 border-indigo-100 rounded-[2rem] bg-indigo-50/20">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg"><Crown size={24} /></div>
                            <div>
                                <h4 className="font-black uppercase tracking-tight text-slate-900 leading-none mb-1">{formatName(ownerProfile) || "The Architect"}</h4>
                                <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600">Architect (Owner)</span>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* MEMBERS CARDS */}
                {members.map((m: any) => (
                    <Card key={m.id} className="p-6 border border-slate-100 rounded-[2rem] bg-white group hover:border-indigo-100 transition-all">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center font-black text-xl italic text-slate-400">
                                    {m.invited_email.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h4 className="font-black uppercase tracking-tight text-slate-900 leading-none mb-1">{formatName(m.profiles) || m.invited_email}</h4>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-indigo-500">{m.role}</span>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                                            {m.status === 'accepted' ? 'Active' : 'Pending'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* RATE MANAGEMENT (Architect Only & Hidden from others) */}
                            {isArchitect && m.status === 'accepted' && (
                                <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                                    <div className="pl-2 flex items-center gap-2">
                                        <Wallet size={14} className="text-slate-400" />
                                        <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Internal Rate</span>
                                    </div>
                                    <input 
                                        type="number" 
                                        defaultValue={m.member_hourly_rate || 0}
                                        onBlur={(e) => handleRateChange(m.id, e.target.value)}
                                        className="w-20 h-10 bg-white border border-slate-200 rounded-xl px-3 text-sm font-black text-indigo-600 outline-none focus:border-indigo-500"
                                    />
                                    {updatingRateId === m.id && <Loader2 size={14} className="animate-spin text-indigo-600 mr-2" />}
                                </div>
                            )}
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    )
}
