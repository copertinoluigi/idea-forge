'use client'
import { useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Link2, Plus, Trash2, ExternalLink, Figma, Github, Trello, 
  HardDrive, Globe, FileText, BookOpen, Layers, Zap
} from 'lucide-react'
import { addProjectLink, deleteProjectLink } from '@/app/actions'
import { toast } from 'sonner'
import Link from 'next/link'

const getLinkIcon = (url: string, type?: string) => {
  if (type === 'note' || type === 'document') return <FileText className="h-4 w-4 text-slate-400" />
  
  const u = url.toLowerCase()
  if (u.includes('figma')) return <Figma className="h-4 w-4 text-purple-500" />
  if (u.includes('github')) return <Github className="h-4 w-4 text-slate-700" />
  if (u.includes('trello') || u.includes('notion')) return <Trello className="h-4 w-4 text-blue-500" />
  if (u.includes('drive') || u.includes('dropbox')) return <HardDrive className="h-4 w-4 text-emerald-600" />
  return <Globe className="h-4 w-4 text-slate-400" />
}

interface ProjectLinksProps {
    projectId: string;
    links: any[];      
    resources: any[];  
    dict: any;
}

export default function ProjectLinks({ projectId, links, resources, dict }: ProjectLinksProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [isAdding, setIsAdding] = useState(false)

  const hasAnyData = links.length > 0 || resources.length > 0

  return (
    <Card className="h-fit border-l-4 border-l-indigo-500 shadow-sm rounded-3xl overflow-hidden bg-white">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Layers className="h-3.5 w-3.5" /> Resource Hub
        </CardTitle>
        
        <div className="flex items-center gap-1">
            <Link href={`/dashboard/resources/new?project_id=${projectId}`}>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-indigo-600">
                    <BookOpen className="h-4 w-4" />
                </Button>
            </Link>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-indigo-600" onClick={() => setIsAdding(!isAdding)}>
                <Plus className={`h-4 w-4 transition-transform ${isAdding ? 'rotate-45' : ''}`} />
            </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        
        {/* FORM AGGIUNTA RAPIDA LINK */}
        {isAdding && (
            <form 
                action={async (formData) => {
                    await addProjectLink(formData)
                    formRef.current?.reset()
                    setIsAdding(false)
                    toast.success("Link added")
                }}
                ref={formRef}
                className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 animate-in fade-in"
            >
                <input name="projectId" type="hidden" value={projectId} />
                <input name="title" required placeholder="Title..." className="w-full text-xs p-2 rounded-xl border border-slate-200 focus:outline-none" />
                <input name="url" required placeholder="https://..." className="w-full text-xs p-2 rounded-xl border border-slate-200 font-mono focus:outline-none" />
                <Button type="submit" size="sm" className="w-full h-8 text-[10px] font-bold uppercase bg-indigo-600">Save Link</Button>
            </form>
        )}

        <div className="space-y-1">
            {!hasAnyData && !isAdding && (
                <div className="text-center py-6">
                    <p className="text-[10px] text-slate-400 font-bold uppercase italic">{dict.no_links || "No resources."}</p>
                </div>
            )}
            
            {/* 1. SOVEREIGN ASSETS (Resources strutturate) */}
            {resources.map((res) => (
                <div key={res.id} className="group flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-all">
                    <a href={res.url || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0 bg-white p-1.5 rounded-lg border border-slate-100 shadow-sm">
                            {getLinkIcon(res.url || '', res.type)}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate tracking-tight">{res.title}</p>
                            <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-tighter">Asset • {res.type}</p>
                        </div>
                    </a>
                    <ExternalLink size={12} className="text-slate-200 group-hover:text-indigo-400 mr-1" />
                </div>
            ))}

            {/* 2. QUICK LINKS (Link manuali) */}
            {links.map((link) => (
                <div key={link.id} className="group flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-all">
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0 bg-white p-1.5 rounded-lg border border-slate-100 shadow-sm">
                            {getLinkIcon(link.url)}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-700 truncate">{link.title}</p>
                            <p className="text-[9px] text-slate-400 font-mono truncate">{new URL(link.url).hostname}</p>
                        </div>
                    </a>
                    
                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <form action={async () => {
                            await deleteProjectLink(link.id, projectId);
                            toast.success("Removed");
                        }}>
                            <button className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors">
                                <Trash2 className="h-3.5 w-3.5" />
                            </button>
                        </form>
                    </div>
                </div>
            ))}
        </div>
      </CardContent>
    </Card>
  )
}
