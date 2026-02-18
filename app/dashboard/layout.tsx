import Sidebar from '@/components/layout/Sidebar'
import BugReportFAB from '@/components/dashboard/BugReportFAB'
import AnnouncementBanner from '@/components/dashboard/AnnouncementBanner'
import CommandMenu from '@/components/dashboard/CommandMenu'
import ScrollToTop from '@/components/layout/ScrollToTop'
import ScrollButton from '@/components/layout/ScrollButton'
import { getSidebarCountsAction } from '@/app/actions' // Assicurati di aver aggiunto questa action

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Recupero conteggi real-time lato server
  const counts = await getSidebarCountsAction()

  return (
    <div className="flex h-screen bg-secondary overflow-hidden font-sans relative text-slate-900">
      <ScrollToTop />
      <CommandMenu /> 
      
      {/* Passiamo i dati alla sidebar */}
      <Sidebar initialCounts={counts} />
      
      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        <header className="flex flex-col flex-shrink-0 z-30">
          <AnnouncementBanner /> 
        </header>
        
        <div id="dashboard-main-content" className="flex-1 overflow-y-auto custom-scrollbar relative scroll-smooth">
            <div className="p-4 md:p-8 pt-24 md:pt-8 w-full"> 
                <div className="mx-auto max-w-7xl animate-in fade-in duration-700">
                    {children}
                </div>
            </div>
        </div>

        <ScrollButton />
        <BugReportFAB /> 
      </main>
    </div>
  )
}
