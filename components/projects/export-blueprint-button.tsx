"use client"

import React, { useState } from "react"
import { Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { exportProjectBlueprint } from "@/app/actions-blueprint"

interface ExportBlueprintButtonProps {
    projectId: string
    projectTitle: string
}

export function ExportBlueprintButton({ projectId, projectTitle }: ExportBlueprintButtonProps) {
    const [isExporting, setIsExporting] = useState(false)

    const handleExport = async () => {
        setIsExporting(true)
        try {
            const blueprint = await exportProjectBlueprint(projectId, [])
            const blob = new Blob([JSON.stringify(blueprint, null, 2)], { type: "application/json" })
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            const fileName = `MH-Blueprint-${projectTitle.replace(/\s+/g, '-').toLowerCase()}.json`
            a.href = url
            a.download = fileName
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
            toast.success("Blueprint generato con successo")
        } catch (error) {
            console.error(error)
            toast.error("Errore durante l'export")
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <Button 
            variant="outline" 
            onClick={handleExport} 
            disabled={isExporting}
            className="w-full h-12 rounded-xl border-slate-200 font-bold text-xs uppercase tracking-widest gap-2 hover:bg-slate-50 text-slate-600"
        >
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Export Blueprint
        </Button>
    )
}
