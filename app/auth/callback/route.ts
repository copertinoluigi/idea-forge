import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // 'next' determina dove andare dopo il callback
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options, maxAge: -1 })
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data?.user) {
      // --- NOTIFICA ADMIN (RESEND) ---
      // Notifica solo se è una nuova registrazione (o mantieni per ogni conferma se preferisci)
      try {
        await resend.emails.send({
          from: 'MindHub System <system@mindhub.website>',
          to: 'copertino.luigi@gmail.com',
          subject: `🚀 Accesso Sistema: ${data.user.email}`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 20px; max-width: 500px;">
              <h2 style="color: #4f46e5; font-weight: 900;">MINDHUB AUTH</h2>
              <p>Un utente ha validato la sessione con successo.</p>
              <p style="background: #f3f4f6; padding: 10px; border-radius: 10px;"><strong>Email:</strong> ${data.user.email}</p>
              <p style="font-size: 12px; color: #666;">Data: ${new Date().toLocaleString('it-IT')}</p>
            </div>
          `
        })
      } catch (e) {
        console.error("Errore notifica Resend:", e)
      }

      // Redirect sicuro alla pagina 'next' (es. /auth/update-password)
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Ritorno alla login con errore se il codice è invalido/scaduto
  return NextResponse.redirect(`${origin}/auth/login?error=auth-code-error`)
}
