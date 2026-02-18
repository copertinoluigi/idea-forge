'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ChevronRight, Coins, Loader2 } from 'lucide-react'

export default function AuthAction() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function getIdentity() {
      // 1. Trappola recupero password
      const hash = window.location.hash
      if (hash && (hash.includes('type=recovery') || hash.includes('access_token='))) {
        window.location.href = `/auth/update-password${hash}`
        return
      }

      // 2. Controllo sessione
      const { data: { user: activeUser } } = await supabase.auth.getUser()
      if (activeUser) {
        setUser(activeUser)
        const { data: profileData } = await supabase
          .from('profiles')
          .select('avatar_url, first_name, credits')
          .eq('id', activeUser.id)
          .single()
        if (profileData) setProfile(profileData)
      }
      setLoading(false)
    }
    getIdentity()
  }, [])

  if (loading) return <div className="w-10 h-10" /> // Placeholder invisibile durante il caricamento

  if (user) {
    return (
      <Link href="/dashboard" className="flex items-center gap-2 sm:gap-3 bg-white border border-slate-200 p-1 sm:p-1.5 sm:pr-4 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group animate-in fade-in duration-500">
        <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl overflow-hidden border border-slate-100 shrink-0 bg-indigo-50 flex items-center justify-center">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} className="h-full w-full object-cover" alt="Founder" />
          ) : (
            <span className="text-indigo-600 text-xs font-black">{user.email?.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div className="flex flex-col pr-1 text-left">
          <span className="hidden sm:block text-[10px] font-black uppercase tracking-tight text-slate-900 leading-none mb-1">
            {profile?.first_name || 'Founder'}
          </span>
          <div className="flex items-center gap-1 text-amber-600">
            <Coins size={12} className="fill-amber-500/20 shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-tighter leading-none">
                {profile?.credits || 0}
            </span>
          </div>
        </div>
        <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all shrink-0" />
      </Link>
    )
  }

  return (
    <div className="flex items-center gap-4 animate-in fade-in duration-500">
      <Link href="/auth/login" className="hidden sm:block text-slate-900 font-bold uppercase tracking-widest text-[10px] hover:text-indigo-600 transition-colors">
        Login
      </Link>
      <Link href="/auth/signup">
        <Button className="rounded-full px-5 sm:px-6 bg-slate-900 text-white hover:bg-indigo-600 border-0 font-bold text-[10px] uppercase tracking-widest h-10 sm:h-11 transition-all shadow-lg shadow-slate-200">
          Initialize Node
        </Button>
      </Link>
    </div>
  )
}
