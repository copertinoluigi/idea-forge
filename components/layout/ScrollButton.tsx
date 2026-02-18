'use client'
import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ScrollButton() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Troviamo il contenitore che effettivamente scrolla nel dashboard
    const container = document.getElementById('dashboard-main-content')
    if (!container) return

    const handleScroll = () => {
      if (container.scrollTop > 400) {
        setShow(true)
      } else {
        setShow(false)
      }
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    const container = document.getElementById('dashboard-main-content')
    if (container) {
      container.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  if (!show) return null

  return (
    <Button 
      onClick={scrollToTop}
      className="fixed bottom-24 right-6 h-12 w-12 rounded-2xl bg-white border border-slate-200 text-slate-900 shadow-2xl hover:bg-indigo-600 hover:text-white transition-all z-[100] animate-in fade-in slide-in-from-bottom-4"
    >
      <ArrowUp size={20} />
    </Button>
  )
}
