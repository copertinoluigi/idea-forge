'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation' // <--- IMPORTA useParams
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function EditTemplatePage() {
  const router = useRouter()
  // FIX: Uso useParams per leggere l'ID in modo sicuro su Next.js 15
  const params = useParams()
  const templateId = params?.id as string

  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [template, setTemplate] = useState<any>(null)

  useEffect(() => {
    const getData = async () => {
        if (!templateId) return
        const { data } = await supabase.from('templates').select('*').eq('id', templateId).single()
        if (data) setTemplate(data)
        setLoading(false)
    }
    getData()
  }, [templateId, supabase])

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    const formData = new FormData(e.currentTarget)
    
    const { error } = await supabase.from('templates').update({
        title: formData.get('title'),
        category: formData.get('category'),
        content: formData.get('content')
    }).eq('id', templateId)

    if (error) {
        toast.error("Error updating template")
    } else {
        toast.success("Template updated")
        router.push('/dashboard/templates')
        router.refresh()
    }
    setSaving(false)
  }

  if (loading) return <div className="p-10 text-center">Loading...</div>

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in">
       <Link href="/dashboard/templates" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Templates
      </Link>
      <Card>
        <CardHeader><CardTitle>Edit Template</CardTitle></CardHeader>
        <CardContent>
            <form onSubmit={handleUpdate} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Title</label>
                    <input name="title" defaultValue={template.title} required className="w-full rounded-md border p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <select name="category" defaultValue={template.category} className="w-full rounded-md border p-3 text-sm bg-white outline-none">
                        <option value="email">Email</option>
                        <option value="script">Script</option>
                        <option value="letter">Formal Letter</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Content</label>
                    <textarea name="content" defaultValue={template.content} required rows={10} className="w-full rounded-md border p-3 text-sm font-mono outline-none resize-y whitespace-pre-wrap" />
                </div>
                <Button type="submit" disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Update Template
                </Button>
            </form>
        </CardContent>
      </Card>
    </div>
  )
}
