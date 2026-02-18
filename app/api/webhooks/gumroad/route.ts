import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const FROM_EMAIL = 'MindHub System <system@mindhub.website>'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const data = Object.fromEntries(formData.entries())

    // --- DICHIARAZIONE VARIABILI ESTRAZIONE ---
    const userId = data.user_id as string
    const userEmail = data.email as string
    const permalink = data.permalink as string
    
    // Gumroad invia questi come stringhe "true"/"false"
    const isCancelled = data.cancelled === 'true'
    const isRefunded = data.refunded === 'true' // <--- FISSA IL BUG DEL DEPLOY
    const isDisputed = data.disputed === 'true'

    if (!userId) return NextResponse.json({ error: "No user_id" }, { status: 400 })

    // 1. GESTIONE DOWNGRADE (Cancellazione, Rimborso o Disputa)
    if (isCancelled || isRefunded || isDisputed) {
      await supabaseAdmin.from('profiles').update({ plan_status: 'free' }).eq('id', userId)

      // Notifica l'utente solo se è una cancellazione o rimborso
      try {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: userEmail,
          subject: `⚠️ Identity Update: ${userEmail}`,
          html: `
            <div style="font-family: sans-serif; color: #0f172a;">
              <h1 style="text-transform: uppercase; font-style: italic;">Access Protocol Updated</h1>
              <p>Your <strong>Founder Pro</strong> status has been revoked due to cancellation or refund.</p>
              <p>Your account has returned to <strong>Seed Identity (Free)</strong>.</p>
              <a href="https://mindhub.website/dashboard/settings" style="background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin-top: 20px;">Re-establish Pro Node</a>
            </div>
          `
        })
      } catch (e) { console.error("Email notify error:", e) }

      return NextResponse.json({ processed: 'downgrade' })
    }

    // 2. RECUPERO CREDITI ATTUALI PER AGGIUNTA (TOP-UP)
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single()

    const currentCredits = profile?.credits || 0
    let updatePayload: any = {}

    // 3. LOGICA PRODOTTI (Basata sui permalink corretti)
    if (permalink === 'fxozs') {
      // --- ABBONAMENTO PRO ---
      updatePayload = { 
        plan_status: 'pro', 
        credits: currentCredits + 10 // <--- CORRETTO: 10 crediti al mese
      }
    } 
    else if (permalink === '50-AI-TopUp') {
      updatePayload = { credits: currentCredits + 50 }
    } 
    else if (permalink === 'rtpvxi') {
      updatePayload = { credits: currentCredits + 250 }
    } 
    else if (permalink === 'ipmxxk') {
      updatePayload = { credits: currentCredits + 500 }
    }

    // 4. ESECUZIONE AGGIORNAMENTO
    if (Object.keys(updatePayload).length > 0) {
      const { error } = await supabaseAdmin
        .from('profiles')
        .update(updatePayload)
        .eq('id', userId)
      
      if (error) throw error
      console.log(`✅ Success: ${permalink} processed for user ${userId}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error("🔥 Webhook Error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
