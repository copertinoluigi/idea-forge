'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client' // <-- DEVE ESSERE CLIENT, NON SERVER
import { Megaphone, X } from 'lucide-react'

export default function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<any>(null)
  const [isVisible, setIsVisible] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchAnnouncement = async () => {
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      if (data) setAnnouncement(data)
    }
    fetchAnnouncement()
  }, [supabase])

  if (!announcement || !isVisible) return null

  return (
    <div className="bg-indigo-600 text-white px-4 py-2 flex items-center justify-between shadow-md relative z-[100]">
      <div className="flex-1 flex items-center justify-center gap-2">
        <Megaphone className="h-4 w-4 animate-bounce" />
        <p className="text-xs md:text-sm font-bold tracking-wide">
          {announcement.message}
        </p>
      </div>
      <button 
        onClick={() => setIsVisible(false)}
        className="p-1 hover:bg-white/20 rounded-full transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
