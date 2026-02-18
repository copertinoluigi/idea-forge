'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function ScrollToTop() {
  const pathname = usePathname()

  useEffect(() => {
    // Cerchiamo il contenitore principale della dashboard
    const container = document.getElementById('dashboard-main-content')
    if (container) {
      container.scrollTo(0, 0)
    }
  }, [pathname])

  return null // Non renderizza nulla
}
