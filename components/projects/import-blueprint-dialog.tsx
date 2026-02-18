"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Upload, FileJson, CheckCircle, AlertTriangle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { importProjectBlueprint } from "@/app/actions-blueprint"

export function ImportBlueprintDialog() {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [blueprintData, setBlueprintData] = useState<any>(null)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string)
                if (json.origin !== "MindHub") {
                    toast.error("Invalid file. Must be a MindHub blueprint.")
                    return
                }
                setBlueprintData(json)
            } catch (err) {
                toast.error("Error reading JSON file.")
            }
        }
        reader.readAsText(file)
    }

    const handleConfirmImport = async () => {
        if (!blueprintData) return
        setIsUploading(true)
        
        const result = await importProjectBlueprint(blueprintData)
        
        if (result.success) {
            toast.success("Project imported successfully!")
            setOpen(false)
            router.push(`/dashboard/projects/${result.projectId}`)
        } else {
            toast.error(`Error: ${result.error}`)
        }
        setIsUploading(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button 
                    variant="outline" 
                    className="w-full sm:w-auto border-slate-200 h-12 px-6 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all hover:bg-slate-50 text-slate-600 gap-2"
                >
                    <Upload className="h-4 w-4 text-indigo-500" /> Import Blueprint
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] border-2 border-slate-100 shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter text-slate-900">
                        Blueprint Import
                    </DialogTitle>
                    <DialogDescription className="font-medium text-slate-500 text-xs uppercase tracking-widest">
                        Upload a .json file to replicate a project structure.
                    </DialogDescription>
                </DialogHeader>

                {!blueprintData ? (
                    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-100 rounded-[2rem] bg-slate-50/50 group hover:border-indigo-200 transition-colors">
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleFileChange}
                            className="hidden"
                            id="blueprint-upload"
                        />
                        <label htmlFor="blueprint-upload" className="cursor-pointer flex flex-col items-center">
                            <FileJson size={48} className="text-slate-300 mb-4 group-hover:text-indigo-400 transition-colors" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">Select JSON File</span>
                        </label>
                    </div>
                ) : (
                    <div className="space-y-6 py-4">
                        <div className="bg-indigo-50/50 p-6 rounded-[2rem] border border-indigo-100">
                            <h3 className="text-xl font-black italic uppercase text-indigo-600 mb-4 tracking-tighter">
                                {blueprintData.data.project.title}
                            </h3>
                            <div className="grid grid-cols-2 gap-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                <div className="flex items-center gap-2">
                                    <CheckCircle size={14} className="text-emerald-500" />
                                    {blueprintData.data.tasks.length} Tasks
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle size={14} className="text-emerald-500" />
                                    {blueprintData.data.notes.length} Notes
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle size={14} className="text-emerald-500" />
                                    {blueprintData.data.links.length} Links
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle size={14} className="text-emerald-500" />
                                    {blueprintData.data.playbooks.length} Playbooks
                                </div>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                            <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={16} />
                            <p className="text-[9px] leading-relaxed font-bold uppercase text-amber-700 tracking-tight">
                                IMPORTING WILL CREATE NEW RECORDS. VAULT BALANCES AND HISTORICAL LOGS ARE NOT IMPORTED TO MAINTAIN FISCAL INTEGRITY.
                            </p>
                        </div>
                    </div>
                )}

                <DialogFooter className="flex gap-2 sm:justify-between items-center">
                    <Button 
                        variant="ghost" 
                        onClick={() => setBlueprintData(null)} 
                        disabled={isUploading}
                        className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600"
                    >
                        Reset
                    </Button>
                    <Button 
                        onClick={handleConfirmImport} 
                        disabled={!blueprintData || isUploading}
                        className="rounded-xl h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase italic tracking-tighter shadow-lg shadow-indigo-200"
                    >
                        {isUploading ? <Loader2 className="animate-spin" /> : "Confirm Import"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
