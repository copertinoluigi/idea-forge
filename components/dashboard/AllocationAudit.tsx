'use client'
import { useState } from 'react'
import { PieChart, List, ShieldCheck, Info, ChevronRight, Target } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'

interface AllocationAuditProps {
    totalCash: number;
    freeCash: number;
    allocated: number;
    projects: any[];
    currency: string;
}

export default function AllocationAudit({ totalCash, freeCash, allocated, projects, currency }: AllocationAuditProps) {
    const freePercentage = totalCash > 0 ? (freeCash / totalCash) * 100 : 0;
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
            
            {/* WIDGET 1: VAULT DISTRIBUTION (PIE CHART CSS) */}
            <div className="lg:col-span-2 bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm flex flex-col md:flex-row items-center gap-10">
                <div className="relative h-40 w-40 shrink-0">
                    {/* Grafico a torta in CSS puro (conic-gradient) */}
                    <div 
                        className="h-full w-full rounded-full shadow-inner" 
                        style={{
                            background: `conic-gradient(#4f46e5 ${100 - freePercentage}%, #f1f5f9 0)`
                        }}
                    />
                    <div className="absolute inset-4 bg-white rounded-full flex flex-col items-center justify-center shadow-sm">
                        <span className="text-[10px] font-black text-slate-400 uppercase">Free</span>
                        <span className="text-sm font-black text-slate-900">{Math.max(0, Math.round(freePercentage))}%</span>
                    </div>
                </div>

                <div className="flex-1 space-y-6 w-full">
                    <div>
                        <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-900">Capital Deployment</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Biz Vault Segmentation</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Committed Funds</p>
                            <p className="text-lg font-bold text-indigo-600">{formatCurrency(allocated, currency)}</p>
                        </div>
                        <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                            <p className="text-[9px] font-black text-emerald-700 uppercase mb-1">Available Cash</p>
                            <p className="text-lg font-bold text-emerald-600">{formatCurrency(freeCash, currency)}</p>
                        </div>
                    </div>

                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="w-full h-12 rounded-xl border-slate-200 font-bold text-[10px] uppercase tracking-widest gap-2 hover:bg-slate-50">
                                <List size={14} /> View Allocation Ledger
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px] rounded-[2.5rem]">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">Allocation Ledger</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                {projects.map((p, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[10px] font-black text-indigo-600 shadow-sm">
                                                {p.title.substring(0,2).toUpperCase()}
                                            </div>
                                            <p className="text-sm font-bold text-slate-700">{p.title}</p>
                                        </div>
                                        <p className="text-sm font-black text-slate-900">{formatCurrency(p.budget, currency)}</p>
                                    </div>
                                ))}
                                {projects.length === 0 && <p className="text-center text-slate-400 italic text-sm">No active allocations.</p>}
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* WIDGET 2: TAX SECURITY LEDGER */}
            <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden flex flex-col justify-between">
                <ShieldCheck className="absolute -right-4 -top-4 h-24 w-24 text-indigo-500/10 -rotate-12" />
                <div className="relative z-10 space-y-2">
                    <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Tax Integrity Node</h3>
                    <p className="text-xl font-black italic uppercase tracking-tighter">Total Isolated</p>
                </div>
                
                <div className="relative z-10 py-6">
                    <p className="text-4xl font-black tracking-tighter text-white">
                        {/* Questa è la somma storica calcolata nel server */}
                        {formatCurrency(projects.reduce((acc, p) => acc + (p.totalTaxIsolated || 0), 0), currency)}
                    </p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">Historical Reserve Growth</p>
                </div>

                <div className="relative z-10 p-3 bg-white/5 rounded-xl border border-white/10 flex items-center gap-2">
                    <Info size={12} className="text-indigo-400" />
                    <p className="text-[9px] font-medium leading-tight text-slate-400 uppercase tracking-tight">
                        Capital automatically protected from operational burn.
                    </p>
                </div>
            </div>
        </div>
    );
}
