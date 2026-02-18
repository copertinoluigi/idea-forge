import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const hmac = crypto.createHmac('sha256', process.env.LEMON_SQUEEZY_WEBHOOK_SECRET || '');
    const digest = Buffer.from(hmac.update(rawBody).digest('hex'), 'utf8');
    const signature = Buffer.from(req.headers.get('x-signature') || '', 'utf8');

    if (!crypto.timingSafeEqual(digest, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const eventName = payload.meta.event_name;
    const customData = payload.meta.custom_data; 
    const attributes = payload.data.attributes;

    const userId = customData?.user_id;
    if (!userId) return NextResponse.json({ message: 'No userId' });

    // Recupero profilo per non toccare i crediti se non serve
    const { data: profile } = await supabaseAdmin.from('profiles').select('credits, plan_status').eq('id', userId).single();

    switch (eventName) {
      case 'subscription_created':
      case 'subscription_resumed':
        await supabaseAdmin.from('profiles').update({
          plan_status: 'pro', // Diventa PRO
          lemon_customer_id: String(attributes.customer_id),
          lemon_subscription_id: String(payload.data.id),
          next_billing_at: attributes.renews_at,
          credits: (profile?.credits || 0) + 10 // +10 crediti subito
        }).eq('id', userId);
        break;

      case 'subscription_updated':
        if (attributes.status === 'active') {
            await supabaseAdmin.from('profiles').update({
              plan_status: 'pro',
              next_billing_at: attributes.renews_at,
              credits: (profile?.credits || 0) + 10 // Rinnovo mensile: +10 crediti
            }).eq('id', userId);
        }
        break;

      case 'subscription_expired':
      case 'subscription_payment_failed':
        // ATTENZIONE: Se l'utente è un 'beta', non lo mettiamo mai in expired!
        if (profile?.plan_status !== 'beta') {
            await supabaseAdmin.from('profiles').update({ plan_status: 'expired' }).eq('id', userId);
        }
        break;

      case 'order_created':
        // Ricariche Crediti (Top-up)
        if (attributes.status === 'paid') {
          const variantId = String(attributes.first_order_item.variant_id);
          let toAdd = 0;
          if (variantId === process.env.LEMON_VARIANT_ID_50) toAdd = 50;
          if (variantId === process.env.LEMON_VARIANT_ID_250) toAdd = 250;
          if (variantId === process.env.LEMON_VARIANT_ID_500) toAdd = 500;

          if (toAdd > 0) {
            await supabaseAdmin.from('profiles').update({ credits: (profile?.credits || 0) + toAdd }).eq('id', userId);
          }
        }
        break;
    }
    return NextResponse.json({ received: true });
  } catch (err) {
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}
