'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, Pencil, X, Loader2, FileText } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { updateTemplate } from '@/app/actions'
import { toast } from 'sonner'

export default function TemplateDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [template, setTemplate] = useState<any>(null)

  // Caricamento dati
  useEffect(() => {
    const fetchTemplate = async () => {
      const { data } = await supabase.from('templates').select('*').eq('id', id).single()
      if (!data) router.push('/dashboard/templates')
      else setTemplate(data)
      setLoading(false)
    }
    fetchTemplate()
  }, [id, supabase, router])

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    const formData = new FormData(e.currentTarget)
    
    const res = await updateTemplate(id as string, formData)
    
    if (res.success) {
      toast.success("Changes saved!")
      setTemplate({ ...template, title: formData.get('title'), content: formData.get('content') })
      setIsEditing(false)
    } else {
      toast.error("Error saving changes")
    }
    setSaving(false)
  }

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto h-8 w-8 text-indigo-600" /></div>

  return (
    <div className="max-w-4xl mx-auto pb-20 space-y-8 animate-in fade-in">
      <div className="flex items-center justify-between">
        <Link href="/dashboard/templates" className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-medium">
          <ArrowLeft className="h-4 w-4" /> Back to Playbooks
        </Link>
        
        {!isEditing && (
            <Button onClick={() => setIsEditing(true)} variant="outline" size="sm" className="rounded-xl border-slate-200">
                <Pencil className="h-4 w-4 mr-2" /> Edit Playbook
            </Button>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
            <FileText className="h-40 w-40" />
        </div>

        <div className="p-10">
          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Title</label>
                <input 
                    name="title" 
                    defaultValue={template.title} 
                    required
                    className="w-full text-3xl font-black text-slate-900 border-b border-slate-200 outline-none focus:border-indigo-500 pb-2 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Content</label>
                <textarea 
                    name="content" 
                    defaultValue={template.content || template.description} 
                    rows={15}
                    className="w-full bg-slate-50 rounded-2xl p-6 text-lg text-slate-600 outline-none border border-slate-100 focus:border-indigo-200 transition-all"
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 rounded-xl px-8 h-12 font-bold">
                    {saving ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Changes
                </Button>
                <Button type="button" variant="ghost" onClick={() => setIsEditing(false)} className="rounded-xl h-12 text-slate-500">
                    <X className="h-4 w-4 mr-2" /> Cancel
                </Button>
              </div>
            </form>
          ) : (
            <>
              <h1 className="text-4xl font-black text-slate-900 mb-6">{template.title}</h1>
              <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-wrap text-lg">
                {template.content || template.description}
              </div>
            </>
          )}
        </div>
      </div>

      {!isEditing && (
        <p className="text-center text-[10px] text-slate-400 uppercase tracking-[0.2em]">
            Last Updated: {new Date(template.updated_at || template.created_at).toLocaleDateString()}
        </p>
      )}
    </div>
  )
}
