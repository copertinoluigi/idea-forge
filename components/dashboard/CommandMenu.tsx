'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { globalSearch } from '@/app/actions'
import { 
    Search, FolderKanban, FileText, Wallet, ArrowRight, Loader2, X 
} from 'lucide-react'

export default function CommandMenu() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.length > 1) {
        setLoading(true)
        const data = await globalSearch(query)
        setResults(data)
        setLoading(false)
      } else {
        setResults(null)
      }
    }, 300)
    return () => clearTimeout(delayDebounceFn)
  }, [query])

  const handleSelect = (path: string) => {
    router.push(path)
    setOpen(false)
    setQuery('')
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center border-b px-4 py-3">
            <Search className="mr-2 h-5 w-5 text-gray-400" />
            <input 
                className="flex-1 bg-transparent text-lg outline-none text-gray-900" 
                placeholder="Search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
            />
            <button onClick={() => setOpen(false)}><X className="h-5 w-5 text-gray-400" /></button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2">
            {loading && <div className="py-6 text-center text-sm text-gray-500">Searching...</div>}
            {!loading && results && (
                <div className="space-y-2">
                    {results.projects.map((item: any) => (
                        <button key={item.id} onClick={() => handleSelect(`/dashboard/projects/${item.id}`)} className="flex w-full items-center rounded-md px-2 py-2 text-sm hover:bg-gray-100">
                            <FolderKanban className="mr-2 h-4 w-4 opacity-50" /> {item.title}
                        </button>
                    ))}
                    {results.resources.map((item: any) => (
                        <button key={item.id} onClick={() => handleSelect(`/dashboard/resources`)} className="flex w-full items-center rounded-md px-2 py-2 text-sm hover:bg-gray-100">
                            <FileText className="mr-2 h-4 w-4 opacity-50" /> {item.title}
                        </button>
                    ))}
                     {results.subscriptions.map((item: any) => (
                        <button key={item.id} onClick={() => handleSelect(`/dashboard/finances`)} className="flex w-full items-center rounded-md px-2 py-2 text-sm hover:bg-gray-100">
                            <Wallet className="mr-2 h-4 w-4 opacity-50" /> {item.title}
                        </button>
                    ))}
                </div>
            )}
            {!loading && !results && <div className="py-8 text-center text-sm text-gray-400">Type to search.</div>}
        </div>
      </div>
    </div>
  )
}
