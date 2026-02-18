import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'EUR') {
  // Se la valuta arriva come null o undefined, forziamo EUR
  const safeCurrency = currency && currency !== 'null' ? currency : 'EUR';
  
  try {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: safeCurrency,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch (e) {
    // Fallback estremo in caso di codice valuta non riconosciuto
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  }
}
