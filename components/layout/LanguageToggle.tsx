'use client'
import { Button } from "@/components/ui/button"
import { setLanguage } from "@/app/actions"

export default function LanguageToggle({ currentLang }: { currentLang: string }) {

  const handleLanguageChange = async (lang: string) => {
    await setLanguage(lang)
    // Forza ricaricamento completo per aggiornare lo stato della Sidebar
    window.location.reload() 
  }

  return (
    <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/10">
        <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => handleLanguageChange('en')} 
            className={`h-7 px-2 text-xs font-bold ${currentLang === 'en' ? "bg-primary text-white shadow-sm" : "text-gray-400 hover:text-white hover:bg-white/10"}`}
        >
            EN
        </Button>
        <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => handleLanguageChange('it')} 
            className={`h-7 px-2 text-xs font-bold ${currentLang === 'it' ? "bg-primary text-white shadow-sm" : "text-gray-400 hover:text-white hover:bg-white/10"}`}
        >
            IT
        </Button>
        <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => handleLanguageChange('es')} 
            className={`h-7 px-2 text-xs font-bold ${currentLang === 'es' ? "bg-primary text-white shadow-sm" : "text-gray-400 hover:text-white hover:bg-white/10"}`}
        >
            ES
        </Button>
    </div>
  )
}
