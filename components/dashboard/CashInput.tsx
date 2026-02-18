'use client'

import { useState } from 'react'
import { Save, Loader2, Check } from 'lucide-react'
import { updateCashAction } from '@/app/actions'
import { toast } from 'sonner'

interface CashInputProps {
  initialCash: number
  dict: any
  isPersonal?: boolean
  currency?: string // Aggiunto per fixare il Type Error del deploy
}

export default function CashInput({ 
  initialCash, 
  dict, 
  isPersonal = false,
  currency = 'EUR' // Default per sicurezza
}: CashInputProps) {
  const [cash, setCash] = useState(initialCash.toString())
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Mapping simboli per la visualizzazione
  const currencySymbols: Record<string, string> = {
    'EUR': '€',
    'USD': '$',
    'GBP': '£'
  }

  const handleUpdateCash = async () => {
    setSaving(true)
    const amount = parseFloat(cash) || 0
    
    // Chiamiamo l'azione passando il flag
    const result = await updateCashAction(amount, isPersonal)

    if (result.success) {
      setSaved(true)
      toast.success(isPersonal ? "Personal pocket updated" : "Business vault updated")
      setTimeout(() => setSaved(false), 2000)
    } else {
      toast.error("Failed to update cash")
    }
    setSaving(false)
  }

  return (
    <div className="flex items-center gap-2 group">
      <div className="relative flex-1 flex items-baseline gap-1">
        <input
          type="number"
          value={cash}
          onChange={(e) => setCash(e.target.value)}
          className="w-full bg-transparent border-b border-slate-200 py-1 text-2xl font-bold text-slate-900 outline-none focus:border-indigo-500 transition-colors"
          placeholder="0.00"
        />
        {/* Mostriamo il simbolo della valuta scelto dall'utente */}
        <span className="text-sm font-bold text-slate-400">
          {currencySymbols[currency] || currency}
        </span>
      </div>
      <button
        onClick={handleUpdateCash}
        disabled={saving || Number(cash) === initialCash}
        className={`p-2 rounded-xl transition-all ${
          saved 
            ? 'bg-emerald-50 text-emerald-600' 
            : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100 disabled:opacity-0'
        }`}
      >
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : saved ? (
          <Check className="h-4 w-4" />
        ) : (
          <Save className="h-4 w-4" />
        )}
      </button>
    </div>
  )
}
