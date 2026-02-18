import Link from 'next/link'
import { LayoutDashboard, Sparkles, ShieldCheck, Zap, Users2, MessageSquare, Brain, Wallet, FolderKanban, CalendarDays, FileText, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans overflow-hidden relative">
      {/* Background */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-50 rounded-full blur-3xl -z-10 opacity-50" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-slate-100 rounded-full blur-3xl -z-10 opacity-50" />

      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-6 py-8 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 bg-slate-950 rounded-xl flex items-center justify-center">
            <Brain size={24} className="text-sky-400" />
          </div>
          <span className="text-2xl font-black uppercase italic tracking-tighter">BYOI</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/auth/login">
            <Button variant="ghost" className="font-bold uppercase tracking-widest text-xs">Login</Button>
          </Link>
          <Link href="/auth/signup">
            <Button className="font-bold uppercase tracking-widest text-xs h-10 rounded-xl">Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-5xl mx-auto px-6 pt-20 pb-32 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-sky-50 border border-sky-100 rounded-full mb-8">
          <Sparkles size={16} className="text-sky-600" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-600">Build Your Own Intelligence</span>
        </div>

        <h1 className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter leading-[0.9] mb-8">
          The AI-Powered <br />
          <span className="text-sky-500">Operating System</span> <br />
          for Founders
        </h1>

        <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-500 font-medium leading-relaxed mb-12">
          BYOI unifies AI chat rooms, project management, financial controls,
          and team collaboration into a single intelligence layer.
          Stop switching tools — start building.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
          <Link href="/dashboard">
            <Button className="h-14 px-10 rounded-2xl font-black uppercase italic tracking-tighter text-sm bg-sky-500 hover:bg-sky-600 shadow-lg shadow-sky-200">
              Enter Dashboard <ArrowRight size={18} className="ml-2" />
            </Button>
          </Link>
          <Link href="#features">
            <Button variant="outline" className="h-14 px-10 rounded-2xl font-black uppercase italic tracking-tighter text-sm">
              See Features
            </Button>
          </Link>
        </div>

        {/* Features Grid */}
        <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left mt-24">
          <div className="p-8 border-2 border-slate-100 rounded-[2.5rem] bg-white hover:border-sky-100 transition-all group">
            <div className="h-12 w-12 bg-sky-50 rounded-2xl flex items-center justify-center mb-6 text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition-colors">
              <MessageSquare size={24} />
            </div>
            <h3 className="text-xl font-black uppercase italic tracking-tighter mb-2">AI Chat Rooms</h3>
            <p className="text-sm text-slate-500 leading-relaxed font-medium">Private AI consoles and team chat rooms with real-time messaging, file sharing, and intelligent summarization.</p>
          </div>

          <div className="p-8 border-2 border-slate-100 rounded-[2.5rem] bg-white hover:border-sky-100 transition-all group shadow-2xl shadow-slate-100">
            <div className="h-12 w-12 bg-sky-50 rounded-2xl flex items-center justify-center mb-6 text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition-colors">
              <FolderKanban size={24} />
            </div>
            <h3 className="text-xl font-black uppercase italic tracking-tighter mb-2">Project Hub</h3>
            <p className="text-sm text-slate-500 leading-relaxed font-medium">Track projects with tasks, time logging, team roles, budgets, and public progress pages. Blueprint export/import included.</p>
          </div>

          <div className="p-8 border-2 border-slate-100 rounded-[2.5rem] bg-white hover:border-sky-100 transition-all group">
            <div className="h-12 w-12 bg-sky-50 rounded-2xl flex items-center justify-center mb-6 text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition-colors">
              <Wallet size={24} />
            </div>
            <h3 className="text-xl font-black uppercase italic tracking-tighter mb-2">Financial Vault</h3>
            <p className="text-sm text-slate-500 leading-relaxed font-medium">Three-vault system for business, personal, and tax reserves. Burn rate tracking, runway calculations, and expense automation.</p>
          </div>
        </div>

        {/* Second row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left mt-6">
          <div className="p-8 border-2 border-slate-100 rounded-[2.5rem] bg-white hover:border-sky-100 transition-all group">
            <div className="h-12 w-12 bg-sky-50 rounded-2xl flex items-center justify-center mb-6 text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition-colors">
              <Users2 size={24} />
            </div>
            <h3 className="text-xl font-black uppercase italic tracking-tighter mb-2">Nexus Teams</h3>
            <p className="text-sm text-slate-500 leading-relaxed font-medium">Invite collaborators with architect, operator, and guest roles. Per-member hourly rates and permission-based access.</p>
          </div>

          <div className="p-8 border-2 border-slate-100 rounded-[2.5rem] bg-white hover:border-sky-100 transition-all group">
            <div className="h-12 w-12 bg-sky-50 rounded-2xl flex items-center justify-center mb-6 text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition-colors">
              <Brain size={24} />
            </div>
            <h3 className="text-xl font-black uppercase italic tracking-tighter mb-2">AI Co-Founder</h3>
            <p className="text-sm text-slate-500 leading-relaxed font-medium">Multi-provider AI (Claude, GPT, Gemini) for strategic analysis, business plans, and conversation snapshots.</p>
          </div>

          <div className="p-8 border-2 border-slate-100 rounded-[2.5rem] bg-white hover:border-sky-100 transition-all group">
            <div className="h-12 w-12 bg-sky-50 rounded-2xl flex items-center justify-center mb-6 text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition-colors">
              <FileText size={24} />
            </div>
            <h3 className="text-xl font-black uppercase italic tracking-tighter mb-2">Playbooks</h3>
            <p className="text-sm text-slate-500 leading-relaxed font-medium">Standard operating procedures, sales scripts, and reusable templates. Build once, execute many times.</p>
          </div>
        </div>

        {/* More features list */}
        <div className="mt-16 text-center">
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Plus</h3>
          <div className="flex flex-wrap justify-center gap-3">
            {['Unified Agenda', 'iCal Integration', 'Focus Timer', 'Founder Streak', 'Asset Library', 'Bug Reports', 'Weekly Email Briefings', 'Export Data', 'Public Project Pages', 'Dark Sidebar'].map(f => (
              <span key={f} className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600">{f}</span>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-32 p-12 bg-slate-950 rounded-[3rem] text-white overflow-hidden relative">
          <div className="relative z-10">
            <h2 className="text-4xl font-black uppercase italic tracking-tighter mb-4">Start Building Your Intelligence</h2>
            <p className="text-slate-400 font-medium mb-8 max-w-xl mx-auto">Free tier available. Pro unlocks unlimited projects, AI credits, and advanced features.</p>
            <div className="flex justify-center gap-4">
              <Link href="/dashboard">
                <Button className="bg-sky-500 hover:bg-sky-400 text-white h-14 px-10 rounded-2xl font-black uppercase italic tracking-tighter">
                  Launch Dashboard
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline" className="border-white/20 text-white h-14 px-10 rounded-2xl font-black uppercase italic tracking-tighter hover:bg-white/10">
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-sky-600 rounded-full blur-[120px] opacity-20 -mr-32 -mt-32" />
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">&copy; 2026 BYOI — Build Your Own Intelligence</span>
        <div className="flex gap-8">
          <Link href="/privacy" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600">Privacy</Link>
          <Link href="/terms" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600">Terms</Link>
          <Link href="/contact" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600">Contact</Link>
        </div>
      </footer>
    </div>
  )
}
