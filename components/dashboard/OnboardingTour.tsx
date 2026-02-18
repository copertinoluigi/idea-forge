'use client'
import { useEffect } from 'react'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'

export default function OnboardingTour({ dict }: { dict: any }) { // Puoi passare dizionario se vuoi tradurre i testi del tour
  
  useEffect(() => {
    // 1. Controlla se c'è il flag "FORCE" (dal bottone settings)
    const forceTour = localStorage.getItem('mindhub_tour_force')
    
    // 2. Controlla se l'utente ha già visto il tour
    const tourSeen = localStorage.getItem('mindhub_tour_seen')

    if (forceTour === 'true' || !tourSeen) {
        
        // Configura il Driver
        const tourDriver = driver({
            showProgress: true,
            animate: true,
            doneBtnText: "Done",
            nextBtnText: "Next",
            prevBtnText: "Prev",
            steps: [
                { 
                    element: '#tour-sidebar', 
                    popover: { 
                        title: 'Navigation Center', 
                        description: 'Access all your modules here: Projects, Finances, Social and more.' 
                    } 
                },
                { 
                    element: '#tour-actions', 
                    popover: { 
                        title: 'Quick Actions', 
                        description: 'Create new items instantly without navigating away.' 
                    } 
                },
                { 
                    element: '#tour-ai', 
                    popover: { 
                        title: 'AI Consultant', 
                        description: 'Your virtual CFO/COO. Click here to analyze your workspace and get strategic advice.' 
                    } 
                }
            ],
            onDestroyStarted: () => {
                // Quando finisce o chiude, segna come visto e rimuovi il force
                localStorage.setItem('mindhub_tour_seen', 'true')
                localStorage.removeItem('mindhub_tour_force')
                tourDriver.destroy()
            }
        })

        // Avvia il tour (piccolo delay per assicurare il rendering)
        setTimeout(() => {
            tourDriver.drive()
        }, 1000)
    }
  }, [])

  return null // Componente senza UI, solo logica
}
