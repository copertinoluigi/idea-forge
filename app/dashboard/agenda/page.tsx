import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, CreditCard, CheckCircle2, Clock, TrendingUp, ArrowRight, Info } from 'lucide-react'
import Link from 'next/link'
import { getDictionary } from '@/lib/translations'
import { confirmIncomeReceiptAction } from '@/app/actions'
import { formatCurrency } from '@/lib/utils'
import ical from 'node-ical'

export default async function AgendaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const lang = (await (await cookies()).get('mindhub_locale')?.value) || 'en'
  const dict = getDictionary(lang).agenda

  const [tasks, subsRaw, incomesRaw, profile] = await Promise.all([
    supabase.from('tasks').select('*, projects(title)').not('due_date', 'is', null).eq('is_completed', false).eq('user_id', user?.id),
    supabase.from('subscriptions').select('*').not('renewal_date', 'is', null).eq('active', true).eq('user_id', user?.id),
    supabase.from('incomes').select('*, projects(title)').eq('user_id', user?.id).eq('status', 'expected'),
    supabase.from('profiles').select('calendars').eq('id', user?.id).single()
  ])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Logica auto-aggiornamento abbonamenti
  const subsUpdates = (subsRaw.data || []).map(async (sub) => {
    let renewalDate = new Date(sub.renewal_date)
    if (renewalDate < today) {
        while (renewalDate < today) { renewalDate.setMonth(renewalDate.getMonth() + 1) }
        const newDateStr = renewalDate.toISOString().split('T')[0]
        await supabase.from('subscriptions').update({ renewal_date: newDateStr }).eq('id', sub.id)
        return { ...sub, renewal_date: newDateStr }
    }
    return sub
  })
  const subs = await Promise.all(subsUpdates)

  // Parsing iCal
  let externalEvents: any[] = []
  const calendars = profile.data?.calendars || []
  if (calendars.length > 0) {
    const promises = calendars.map(async (cal: any) => {
        try {
            const data = await ical.async.fromURL(cal.url)
            return Object.values(data).filter((ev: any) => ev.type === 'VEVENT' && new Date(ev.end) >= today).map((ev: any) => ({
                id: ev.uid,
                title: ev.summary,
                date: new Date(ev.start),
                type: 'event',
                meta: cal.name,
                link: '#'
            }))
        } catch { return [] }
      })
    const results = await Promise.all(promises)
    externalEvents = results.flat()
  }

  const agendaItems = [
    ...(tasks.data || []).map(t => ({
        id: t.id, title: t.title, date: new Date(t.due_date), type: 'task', meta: t.projects?.title || 'General', link: `/dashboard/projects/${t.project_id}`
    })),
    ...subs.map(s => ({
        id: s.id, title: `${s.title}`, date: new Date(s.renewal_date), type: 'finance', meta: `${formatCurrency(s.cost)} /mo`, link: '/dashboard/finances'
    })),
    ...(incomesRaw.data || []).map(i => {
        const tax = (Number(i.amount_gross) * Number(i.tax_percentage || 0)) / 100;
        const net = Number(i.amount_gross) - tax;
        return {
            id: i.id, 
            title: `${i.title}`, 
            date: new Date(i.due_date), 
            type: 'income', 
            meta: `Net: ${formatCurrency(net)}`, 
            link: '/dashboard/finances?view=revenue'
        }
    }),
    ...externalEvents
  ].sort((a, b) => a.date.getTime() - b.date.getTime())

  const nextWeek = new Date(today)
  nextWeek.setDate(today.getDate() + 7)

  const getGroupKey = (itemDate: Date) => {
    const iDate = new Date(itemDate)
    iDate.setHours(0,0,0,0)
    if (iDate < today) return 'Overdue'
    if (iDate.toDateString() === today.toDateString()) return 'Today'
    if (iDate <= nextWeek) return 'This Week'
    return 'Upcoming'
  }

  const groupedItems = agendaItems.reduce((acc: any, item) => {
    const key = getGroupKey(item.date)
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  const translateHeader = (key: string) => {
      if (key === 'Overdue') return dict.overdue
      if (key === 'Today') return dict.today
      if (key === 'This Week') return dict.this_week
      return dict.upcoming
  }

  const groupsOrder = ['Overdue', 'Today', 'This Week', 'Upcoming']

  const getItemStyles = (type: string) => {
      switch(type) {
          case 'task': return { icon: <CheckCircle2 size={18}/>, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-l-blue-500', label: dict.task };
          case 'finance': return { icon: <CreditCard size={18}/>, color: 'text-pink-600', bg: 'bg-pink-50', border: 'border-l-pink-500', label: dict.payment };
          case 'income': return { icon: <TrendingUp size={18}/>, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-l-emerald-500', label: 'Revenue' };
          default: return { icon: <Clock size={18}/>, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-l-indigo-500', label: 'Event' };
      }
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700 max-w-5xl mx-auto pb-20 px-4 font-sans text-slate-900">
      
      {/* 1. HEADER UNIFICATO (DNA: FOUNDER MOMENTUM) */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
            <Calendar className="h-7 w-7 text-white fill-white" />
          </div>
          <h1 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">
            {dict.title}
          </h1>
        </div>
        <p className="text-sm text-slate-500 font-medium italic opacity-70 uppercase tracking-widest ml-16">
          {dict.subtitle}
        </p>
      </div>

      {/* 2. AGENDA CONTENT */}
      <div className="space-y-12">
        {groupsOrder.map((groupName) => (
            groupedItems[groupName] && (
                <div key={groupName} className="space-y-6">
                    {/* SECTION HEADER (DNA: MOMENTUM STYLE) */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <h3 className={`text-xl font-bold uppercase italic tracking-tighter 
                            ${groupName === 'Overdue' ? 'text-rose-500' : 
                              groupName === 'Today' ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {translateHeader(groupName)}
                        </h3>
                        <span className="text-[10px] font-black bg-slate-100 text-slate-400 px-3 py-1 rounded-full border border-slate-200">
                            {groupedItems[groupName].length} NODES
                        </span>
                    </div>
                    
                    <div className="space-y-3">
                        {groupedItems[groupName].map((item: any) => {
                            const style = getItemStyles(item.type);
                            return (
                                <div key={item.id} className="group">
                                    <Link href={item.link} className={item.link === '#' ? 'cursor-default' : ''}>
                                        <Card className={`border border-slate-100 rounded-2xl shadow-sm transition-all hover:shadow-md ${style.border} border-l-4 group-hover:border-indigo-200 bg-white`}>
                                            <CardContent className="p-5 flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                                    {/* ICON BOX UNIFICATO */}
                                                    <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 border border-slate-100 shadow-inner ${style.bg} ${style.color}`}>
                                                        {style.icon}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-medium text-slate-700 text-base truncate">
                                                            {item.title}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                                                                {item.meta}
                                                            </span>
                                                            <span className="text-[10px] font-black text-slate-200">•</span>
                                                            <span className={`text-[10px] font-black uppercase tracking-tighter ${style.color} opacity-80`}>
                                                                {style.label}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-6">
                                                    <div className="text-right hidden sm:block">
                                                        <p className={`text-sm font-bold ${groupName === 'Overdue' ? 'text-rose-500' : 'text-slate-900'}`}>
                                                            {item.date.toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-US', { month: 'short', day: 'numeric' })}
                                                        </p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                                            {item.date.toLocaleDateString(lang === 'it' ? 'it-IT' : 'en-US', { weekday: 'short' })}
                                                            {item.type === 'event' && <span className="text-indigo-400"> • {item.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>}
                                                        </p>
                                                    </div>
                                                    
                                                    {item.type === 'income' && (
                                                        <form action={async () => { 'use server'; await confirmIncomeReceiptAction(item.id) }}>
                                                            <Button size="sm" className="h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase tracking-widest px-4 shadow-lg active:scale-95 transition-all">
                                                                Confirm
                                                            </Button>
                                                        </form>
                                                    )}
                                                    
                                                    {item.link !== '#' && (
                                                        <ArrowRight className="h-4 w-4 text-slate-200 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )
        ))}
        
        {agendaItems.length === 0 && (
            <div className="text-center py-24 bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-100">
                <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <Calendar className="h-8 w-8 text-slate-200" />
                </div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">{dict.empty}</p>
            </div>
        )}
      </div>

      {/* FOOTER INFORMATIVO (DNA: MOMENTUM) */}
      <div className="mt-12 flex items-start gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-t border-slate-100 pt-6 opacity-60">
          <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-indigo-400" />
          <p className="leading-tight">
            Unified timeline aggregating tasks, financial renewals, and synchronized external calendars. 
            Color coding indicates the source vault and urgency.
          </p>
      </div>
    </div>
  )
}
