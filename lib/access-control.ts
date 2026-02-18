export type UserStatus = 'free' | 'pro' | 'beta' | 'expired';

export function canCreateMore(
    status: UserStatus, 
    currentCount: number, 
    type: 'projects' | 'expenses' | 'incomes'
): { allowed: boolean; message?: string } {
    
    // Gli utenti PRO e i tuoi tester BETA hanno accesso ILLIMITATO
    if (status === 'pro' || status === 'beta') {
        return { allowed: true };
    }

    // Gli utenti scaduti non possono creare NULLA (Sola Lettura)
    if (status === 'expired') {
        return { 
            allowed: false, 
            message: "Your subscription has expired. Please renew to continue using MindHub OS." 
        };
    }

    // Limiti per gli utenti FREE (nuovi iscritti senza abbonamento)
    if (status === 'free') {
        if (type === 'projects' && currentCount >= 1) {
            return { allowed: false, message: "Free plan limit reached: 1 project. Upgrade to PRO for unlimited access." };
        }
        if (type === 'expenses' && currentCount >= 3) {
            return { allowed: false, message: "Free plan limit reached: 3 expenses. Upgrade to PRO for unlimited access." };
        }
        if (type === 'incomes' && currentCount >= 1) {
            return { allowed: false, message: "Free plan limit reached: 1 income. Upgrade to PRO for unlimited access." };
        }
    }

    return { allowed: true };
}
