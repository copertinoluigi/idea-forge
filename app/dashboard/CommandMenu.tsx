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

  // Ascolta scorciatoia tastiera (CMD+K)
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

  // Esegui ricerca con debounce
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
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
        onClick={() => setOpen(false)}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Input Header */}
        <div className="flex items-center border-b px-4 py-3">
            <Search className="mr-2 h-5 w-5 text-gray-400" />
            <input 
                className="flex-1 bg-transparent text-lg outline-none placeholder:text-gray-400 text-gray-900" 
                placeholder="Search projects, resources..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
            />
            <button onClick={() => setOpen(false)} className="ml-2 text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
            </button>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
            
            {/* Loading State */}
            {loading && (
                <div className="py-6 text-center text-sm text-gray-500 flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Searching...
                </div>
            )}

            {/* Empty State */}
            {!loading && !results && query.length < 2 && (
                <div className="py-8 text-center text-sm text-gray-400">
                    Type at least 2 characters to search.
                </div>
            )}

            {!loading && results && (
                <div className="space-y-4">
                    
                    {/* Projects */}
                    {results.projects.length > 0 && (
                        <div>
                            <p className="px-2 py-1.5 text-xs font-semibold text-gray-400 uppercase">Projects</p>
                            {results.projects.map((item: any) => (
                                <button key={item.id} onClick={() => handleSelect(`/dashboard/projects/${item.id}`)} className="flex w-full items-center rounded-md px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-primary">
                                    <FolderKanban className="mr-2 h-4 w-4 opacity-50" />
                                    {item.title}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Resources */}
                    {results.resources.length > 0 && (
                        <div>
                            <p className="px-2 py-1.5 text-xs font-semibold text-gray-400 uppercase">Resources & Archive</p>
                            {results.resources.map((item: any) => (
                                <button key={item.id} onClick={() => handleSelect(`/dashboard/resources`)} className="flex w-full items-center rounded-md px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-primary">
                                    <FileText className="mr-2 h-4 w-4 opacity-50" />
                                    {item.title}
                                </button>
                            ))}
                        </div>
                    )}

                     {/* Subscriptions */}
                     {results.subscriptions.length > 0 && (
                        <div>
                            <p className="px-2 py-1.5 text-xs font-semibold text-gray-400 uppercase">Finances</p>
                            {results.subscriptions.map((item: any) => (
                                <button key={item.id} onClick={() => handleSelect(`/dashboard/finances`)} className="flex w-full items-center rounded-md px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-primary">
                                    <Wallet className="mr-2 h-4 w-4 opacity-50" />
                                    {item.title}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Navigation Suggestions */}
                    <div>
                         <p className="px-2 py-1.5 text-xs font-semibold text-gray-400 uppercase">Quick Nav</p>
                         <button onClick={() => handleSelect('/dashboard/projects/new')} className="flex w-full items-center rounded-md px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-primary">
                            <ArrowRight className="mr-2 h-4 w-4 opacity-50" /> Create New Project
                         </button>
                         <button onClick={() => handleSelect('/dashboard/settings')} className="flex w-full items-center rounded-md px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-primary">
                            <ArrowRight className="mr-2 h-4 w-4 opacity-50" /> Go to Settings
                         </button>
                    </div>

                </div>
            )}
            
            {!loading && results && Object.values(results).flat().length === 0 && (
                 <div className="py-6 text-center text-sm text-gray-500">
                    No results found for "{query}".
                </div>
            )}
        </div>
        
        {/* Footer */}
        <div className="border-t bg-gray-50 px-4 py-2 text-xs text-gray-400 flex justify-between">
            <span>Press <kbd className="font-sans font-bold text-gray-500">ESC</kbd> to close</span>
            <span>BYOI Search</span>
        </div>
      </div>
    </div>
  )
}
