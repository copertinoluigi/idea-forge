import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button' // Import Button
import { Calendar, Clock } from 'lucide-react'
import Link from 'next/link'
import ical from 'node-ical'

export default async function NextEventWidget({ dict }: { dict: any }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [profile, tasks] = await Promise.all([
    supabase.from('profiles').select('calendars').eq('id', user?.id).single(),
    supabase.from('tasks').select('title, due_date').eq('user_id', user?.id).eq('is_completed', false).not('due_date', 'is', null)
  ])

  let events: any[] = []
  const today = new Date()
  
  if (tasks.data) {
    events = tasks.data.map(t => ({
        title: t.title,
        date: new Date(t.due_date),
        source: 'MindHub'
    }))
  }

  if (profile.data?.calendars) {
      const cals = profile.data.calendars
      const promises = cals.map(async (cal: any) => {
        try {
            const data = await ical.async.fromURL(cal.url)
            return Object.values(data).filter((ev: any) => ev.type === 'VEVENT' && new Date(ev.end) >= today).map((ev: any) => ({
                title: ev.summary,
                date: new Date(ev.start),
                source: cal.name
            }))
        } catch { return [] }
      })
      const ext = await Promise.all(promises)
      events = [...events, ...ext.flat()]
  }

  const nextEvent = events.sort((a, b) => a.date.getTime() - b.date.getTime())[0]

  // Se c'è un evento, rendiamo tutta la card un link all'Agenda.
  // Se non c'è, mostriamo il link ai settings.
  
  if (!nextEvent) {
      return (
        <Card className="border-l-4 border-l-indigo-500 shadow-sm hover:shadow-md transition-all h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{dict.kpi.next_event}</CardTitle>
                <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-indigo-600" />
                </div>
            </CardHeader>
            <CardContent className="text-center py-4">
                <p className="text-xs text-gray-500 mb-2">{dict.kpi.no_events}</p>
                <Link href="/dashboard/settings">
                    <Button variant="outline" size="sm" className="h-7 text-xs w-full">
                        {dict.kpi.connect_cal}
                    </Button>
                </Link>
            </CardContent>
        </Card>
      )
  }

  return (
    <Link href="/dashboard/agenda" className="block h-full group">
        <Card className="border-l-4 border-l-indigo-500 shadow-sm group-hover:shadow-md transition-all h-full cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-indigo-600 transition-colors">{dict.kpi.next_event}</CardTitle>
            <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-indigo-600" />
            </div>
        </CardHeader>
        <CardContent>
            <div>
                <div className="text-lg font-bold text-gray-900 truncate" title={nextEvent.title}>
                    {nextEvent.title}
                </div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> 
                    {nextEvent.date.toLocaleDateString()} • {nextEvent.date.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                </p>
                <p className="text-[10px] text-indigo-500 mt-1">{nextEvent.source}</p>
            </div>
        </CardContent>
        </Card>
    </Link>
  )
}
