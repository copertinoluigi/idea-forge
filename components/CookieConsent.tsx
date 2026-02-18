'use client'
import { useState, useEffect } from 'react'
import Script from 'next/script'
import { Button } from '@/components/ui/button'
import { X, Cookie } from 'lucide-react'
import { toast } from 'sonner'

export default function CookieConsent({ settings }: { settings: any }) {
  const [showBanner, setShowBanner] = useState(false)
  const [consentGranted, setConsentGranted] = useState(false)

  useEffect(() => {
    // Controlla se l'utente ha già scelto
    const storedConsent = localStorage.getItem('mindhub_cookie_consent')
    
    if (storedConsent === 'granted') {
      setConsentGranted(true)
    } else if (storedConsent === null) {
      // Se non c'è scelta, mostra il banner
      // Piccolo timeout per animazione
      setTimeout(() => setShowBanner(true), 1000)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('mindhub_cookie_consent', 'granted')
    setConsentGranted(true)
    setShowBanner(false)
    toast.success("Preferences saved. Tracking enabled.")
  }

  const handleDecline = () => {
    localStorage.setItem('mindhub_cookie_consent', 'denied')
    setConsentGranted(false)
    setShowBanner(false)
    toast.info("Preferences saved. Tracking disabled.")
  }

  return (
    <>
      {/* INIEZIONE SCRIPT (Solo se consentito) */}
      {consentGranted && settings?.ga_id && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${settings.ga_id}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${settings.ga_id}');
            `}
          </Script>
        </>
      )}

      {consentGranted && settings?.clarity_id && (
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${settings.clarity_id}");
          `}
        </Script>
      )}

      {/* BANNER UI */}
      {showBanner && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 bg-white border border-gray-200 shadow-2xl p-6 rounded-xl animate-in slide-in-from-bottom-10 fade-in duration-500">
          <div className="flex items-start justify-between mb-2">
             <div className="flex items-center gap-2 text-primary font-bold">
                <Cookie className="h-5 w-5" /> Cookie Policy
             </div>
             <button onClick={() => setShowBanner(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
             </button>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            We use cookies to improve your experience and analyze traffic. 
            We respect your privacy and data ownership.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleDecline} className="flex-1">
                Decline
            </Button>
            <Button size="sm" onClick={handleAccept} className="flex-1">
                Accept
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
