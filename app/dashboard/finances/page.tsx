import Link from 'next/link'
import { cn } from '@/lib/utils'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Plus, Coins, AlertTriangle, Calendar, Globe, 
  Briefcase, User, Heart, TrendingUp, Pencil, Target, CheckCircle2, ShieldCheck, Info, Wallet
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { 
  deleteSubscription, 
  confirmIncomeReceiptAction, 
  confirmExpensePaymentAction, 
  getVaultLogsAction,
  getSidebarCountsAction,
  getDashboardStrategicData,
  getFinancesAuditDataAction // <--- NUOVA ACTION
} from '@/app/actions' 
import DeleteButton from '@/components/ui/delete-button'
import { getDictionary } from '@/lib/translations'
import CashInput from '@/components/dashboard/CashInput' 
import VaultHistory from '@/components/dashboard/VaultHistory'
import AllocationAudit from '@/components/dashboard/AllocationAudit' // <--- NUOVO COMPONENTE

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function FinancesPage(props: { 
  searchParams: Promise<{ filter?: string, view?: string }> 
}) {
  const supabase = await createClient()
  
  // 1. Identità Utente
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const searchParams = await props.searchParams
  const filter = searchParams.filter || 'all'
  const view = searchParams.view || 'burn'
  
  const lang = (await cookies()).get('mindhub_locale')?.value || 'en'
  const fullDict = getDictionary(lang)
  const dict = fullDict.finances
  const incDict = fullDict.incomes

  // 2. Recupero Dati Parallelo (Inclusi i nuovi dati di Audit)
  const [subsReq, incomesReq, profileReq, logs, strategicData, auditData] = await Promise.all([
    supabase.from('subscriptions')
        .select('*, projects(title)')
        .eq('user_id', user.id)
        .eq('active', true)
        .order('renewal_date', { ascending: true }),
    supabase.from('incomes')
        .select('*, projects(title)')
        .eq('user_id', user.id)
        .order('due_date', { ascending: true }),
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    getVaultLogsAction(),
    getDashboardStrategicData(),
    getFinancesAuditDataAction()
  ])
  
  const profile = profileReq.data
  const baseCurrency = profile?.base_currency || 'EUR'
  const allSubs = subsReq.data || []
  const allIncomes = incomesReq.data || []
  
  const businessCash = profile?.cash_on_hand || 0
  const personalCash = profile?.personal_cash_on_hand || 0
  const taxReserve = profile?.tax_reserve || 0

  // Integrazione dati di allocazione dal profilo (gestiti dalle actions precedenti)
  const allocation = strategicData?.allocation || { utilizationRate: 0, totalAllocated: 0, freeCash: businessCash, isOverAllocated: false };

  const businessBurn = allSubs.filter(s => s.category !== 'life').reduce((acc, s) => acc + Number(s.cost), 0)
  const personalBurn = allSubs.filter(s => s.category === 'life').reduce((acc, s) => acc + Number(s.cost), 0)

  const businessRunway = businessBurn > 0 ? (businessCash / businessBurn).toFixed(1) : '∞'
  const personalRunway = personalBurn > 0 ? (personalCash / personalBurn).toFixed(1) : '∞'

  const getRunwayColor = (value: string | number) => {
    const months = Number(value);
    if (isNaN(months)) return 'text-slate-900';
    if (months < 3) return 'text-rose-600 animate-pulse';
    if (months < 6) return 'text-amber-500';
    return 'text-emerald-600';
  };

  let items = view === 'burn' ? [...allSubs] : [...allIncomes]
  if (filter === 'personal') items = items.filter(i => (i.category === 'life' || i.category === 'personal'))
  else if (filter === 'global') items = items.filter(i => (i.category !== 'life' && i.category !== 'personal' && !i.project_id))
  else if (filter === 'projects') items = items.filter(i => !!i.project_id)

  const selectionTotal = items.reduce((acc, i) => acc + Number(i.cost || i.amount_gross || 0), 0)
  const today = new Date()
  today.setHours(0,0,0,0)

  // Prepariamo i dati per il componente Audit
  const projectsForAudit = auditData?.projectBreakdown.map(p => ({
      ...p,
      totalTaxIsolated: auditData.totalTaxIsolated // Passiamo il dato aggregato
  })) || [];

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-24 px-4 max-w-7xl mx-auto font-sans text-slate-900">
      
      {/* 1. PROTOCOL HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8">
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
                    <Coins className="h-7 w-7 text-white" />
                </div>
                <h1 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">
                    {view === 'burn' ? 'Burn Rate' : 'Revenue'}
                </h1>
            </div>
            <p className="text-sm text-slate-500 font-medium italic opacity-70 uppercase tracking-widest ml-16">
              {view === 'burn' ? dict.subtitle : incDict.subtitle}
            </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200 shadow-inner w-full sm:w-auto">
                <Link href={`/dashboard/finances?view=burn&filter=${filter}`} className="flex-1">
                    <Button variant={view === 'burn' ? 'default' : 'ghost'} size="sm" className={`w-full rounded-xl text-[10px] font-bold px-6 h-9 transition-all ${view === 'burn' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-indigo-600'}`}>BURN</Button>
                </Link>
                <Link href={`/dashboard/finances?view=revenue&filter=${filter}`} className="flex-1">
                    <Button variant={view === 'revenue' ? 'default' : 'ghost'} size="sm" className={`w-full rounded-xl text-[10px] font-bold px-6 h-9 transition-all ${view === 'revenue' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:text-emerald-600'}`}>REVENUE</Button>
                </Link>
            </div>
            
            <Link href={view === 'burn' ? "/dashboard/finances/new" : "/dashboard/finances/incomes/new"} className="w-full sm:w-auto">
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl h-11 px-6 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95">
                    <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
            </Link>
        </div>
      </div>
      
      {/* 2. KPI GRID */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { title: 'Biz Vault', val: <CashInput initialCash={businessCash} dict={dict} currency={baseCurrency} />, sub: 'Liquidity', icon: Briefcase, border: 'border-l-blue-500' },
          { title: 'Personal', val: <CashInput initialCash={personalCash} dict={dict} isPersonal={true} currency={baseCurrency} />, sub: 'Savings', icon: Heart, border: 'border-l-pink-500' },
          { title: 'Tax Reserve', val: formatCurrency(taxReserve, baseCurrency), sub: 'Untouchable', icon: ShieldCheck, border: 'border-l-amber-500' },
          { title: 'Biz Runway', val: <span className={getRunwayColor(businessRunway)}>{businessRunway} <small className="text-[10px] uppercase">Mo</small></span>, sub: 'Stability', icon: Wallet, border: 'border-l-emerald-500' },
          { title: 'Life Runway', val: <span className={getRunwayColor(personalRunway)}>{personalRunway} <small className="text-[10px] uppercase">Mo</small></span>, sub: 'Independence', icon: User, border: 'border-l-indigo-500' }
        ].map((kpi, idx) => (
          <Card key={idx} className={`bg-white border border-slate-100 shadow-sm rounded-2xl p-6 ${kpi.border} border-l-4 flex flex-col justify-between`}>
            <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{kpi.title}</p>
                <div className="h-8 w-8 rounded-xl flex items-center justify-center border shadow-sm bg-slate-50 text-slate-600">
                    <kpi.icon size={14} />
                </div>
            </div>
            <div className="text-xl font-bold text-slate-900">{kpi.val}</div>
            <p className="text-[9px] font-bold text-slate-400 uppercase mt-2 tracking-tighter">{kpi.sub}</p>
          </Card>
        ))}
      </div>

      {/* 3. NEW: ALLOCATION & TAX AUDIT (Punto 5) */}
      <AllocationAudit 
          totalCash={businessCash}
          freeCash={allocation.freeCash}
          allocated={allocation.totalAllocated}
          projects={projectsForAudit}
          currency={baseCurrency}
      />

      {/* 4. FILTERS */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-2 border-b border-slate-100">
         {['all', 'global', 'projects', 'personal'].map((f) => (
             <Link key={f} href={`/dashboard/finances?view=${view}&filter=${f}`}>
                <Button variant={filter === f ? 'default' : 'outline'} size="sm" className={`rounded-full text-[10px] font-bold px-6 h-8 uppercase whitespace-nowrap transition-all ${filter === f ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'border-slate-200 text-slate-500 bg-white hover:bg-slate-50'}`}>
                    {f}
                </Button>
             </Link>
         ))}
      </div>

      {/* 5. UNIFIED LIST */}
      <Card className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
        <div className="px-8 py-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">
                {view === 'burn' ? 'Operational Burn' : 'Revenue Stream'}
            </span>
            <div className="text-right">
                 <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-widest mb-1 opacity-60">Selection Total</span>
                 <span className={`text-xl font-bold ${view === 'burn' ? 'text-slate-900' : 'text-emerald-600'}`}>{formatCurrency(selectionTotal, baseCurrency)}</span>
            </div>
        </div>
        
        <div className="divide-y divide-slate-50 font-sans">
            {items.map((item) => {
                const taxAmount = view === 'revenue' ? (Number(item.amount_gross) * Number(item.tax_percentage || 0)) / 100 : 0;
                const netAmount = view === 'revenue' ? Number(item.amount_gross) - taxAmount : 0;
                const itemDate = new Date(item.renewal_date || item.due_date);
                itemDate.setHours(0,0,0,0);
                const timeDiff = itemDate.getTime() - today.getTime();
                const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
                const isOverdue = view === 'burn' && daysDiff <= 7;

                return (
                    <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 hover:bg-slate-50/30 transition-all gap-6">
                        <div className="flex items-center gap-5 min-w-0 flex-1">
                            <div className={`h-12 w-12 shrink-0 rounded-2xl flex items-center justify-center border shadow-sm ${item.category === 'life' || item.category === 'personal' ? 'bg-pink-50 text-pink-500 border-pink-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                {item.category === 'life' || item.category === 'personal' ? <Heart size={20} /> : (item.project_id ? <Briefcase size={20} /> : <Globe size={20} />)}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                    <p className="font-medium text-slate-700 text-base truncate">{item.title}</p>
                                    {item.projects?.title && <span className="text-[9px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full uppercase border border-indigo-100">{item.projects.title}</span>}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    <span>{item.category}</span>
                                    {(item.due_date || item.renewal_date) && <span>• {new Date(item.due_date || item.renewal_date).toLocaleDateString()}</span>}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-8 shrink-0">
                            <div className="text-left sm:text-right">
                                {view === 'burn' ? (
                                    <>
                                        <p className={`text-lg font-bold ${isOverdue ? 'text-rose-600' : 'text-slate-900'}`}>{formatCurrency(item.cost, baseCurrency)}</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Impact / mo</p>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-lg font-bold text-emerald-600 leading-none">{formatCurrency(netAmount, baseCurrency)}</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Net (+{formatCurrency(taxAmount, baseCurrency)} tax)</p>
                                    </>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <Link href={view === 'burn' ? `/dashboard/finances/edit/expense/${item.id}` : `/dashboard/finances/edit/income/${item.id}`}>
                                    <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><Pencil className="h-4 w-4" /></Button>
                                </Link>
                                
                                {view === 'burn' ? (
                                    <>
                                        {isOverdue && (
                                            <form action={async () => { "use server"; await confirmExpensePaymentAction(item.id); }}>
                                                <Button type="submit" size="sm" className="h-9 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-bold px-4 uppercase tracking-widest shadow-lg transition-all active:scale-95">Confirm</Button>
                                            </form>
                                        )}
                                        <DeleteButton id={item.id} onDelete={deleteSubscription} />
                                    </>
                                ) : (
                                    item.status === 'expected' ? (
                                        <form action={async () => { "use server"; await confirmIncomeReceiptAction(item.id); }}>
                                            <Button type="submit" size="sm" className="h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-4 uppercase tracking-widest shadow-lg transition-all active:scale-95">Confirm</Button>
                                        </form>
                                    ) : (
                                        <div className="h-10 w-10 flex items-center justify-center text-emerald-500 bg-emerald-50 rounded-full border border-emerald-100 animate-in zoom-in">
                                            <CheckCircle2 className="h-6 w-6" />
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                )
            })}
            {items.length === 0 && <div className="py-32 text-center text-slate-400 text-sm italic font-medium">No system records found in this selection.</div>}
        </div>
      </Card>

      {/* 6. VAULT LOGS */}
      <div className="pt-8 border-t border-slate-100">
        <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-slate-900 rounded-xl text-white shadow-sm">
                <Info size={18} />
            </div>
            <h3 className="text-xl font-bold uppercase italic tracking-tighter text-slate-900">Vault History</h3>
        </div>
        <VaultHistory logs={logs} />
      </div>
    </div>
  )
}
