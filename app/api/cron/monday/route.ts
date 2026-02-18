import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { Resend } from 'resend';
import { formatCurrency } from '@/lib/utils';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 });
    }

    const { data: profiles } = await supabaseAdmin.from('profiles').select('*');
    const activeUsers = profiles?.filter(p => p.preferences?.email_monday_brief === true) || [];

    const today = new Date();
    const fiveDaysFromNow = new Date();
    fiveDaysFromNow.setDate(today.getDate() + 5);

    for (const profile of activeUsers) {
        // 1. Top 3 Tasks
        const { data: tasks } = await supabaseAdmin
            .from('tasks')
            .select('title, priority')
            .eq('user_id', profile.id)
            .eq('is_completed', false)
            .order('priority', { ascending: false })
            .limit(3);

        // 2. Prossime Spese (Next 5 days)
        const { data: upcomingExpenses } = await supabaseAdmin
            .from('subscriptions')
            .select('title, cost')
            .eq('user_id', profile.id)
            .gte('renewal_date', today.toISOString().split('T')[0])
            .lte('renewal_date', fiveDaysFromNow.toISOString().split('T')[0]);

        await resend.emails.send({
            from: 'MindHub Protocol <system@mindhub.website>',
            to: profile.email,
            subject: '🚀 [Briefing] Weekly Trajectory Initialized',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 20px; padding: 40px; color: #1e293b;">
                    <h2 style="color: #4f46e5; font-weight: 900; letter-spacing: -1px; margin-bottom: 20px;">MINDHUB OS</h2>
                    <p style="font-weight: bold; font-size: 18px;">Founder Briefing: Monday Launch</p>
                    <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 30px 0;" />
                    
                    <p style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #94a3b8; margin-bottom: 15px;">Critical Nodes for this week</p>
                    ${tasks && tasks.length > 0 ? tasks.map(t => `<div style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; font-size: 14px;">• ${t.title} <span style="font-size: 10px; color: #4f46e5;">[${t.priority}]</span></div>`).join('') : '<p style="font-size: 13px; color: #64748b;">No high-priority tasks in backlog.</p>'}

                    <div style="margin-top: 30px; background: #f8fafc; padding: 20px; border-radius: 15px;">
                        <p style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #64748b; margin: 0 0 10px 0;">Runway Impact (Next 5 Days)</p>
                        ${upcomingExpenses && upcomingExpenses.length > 0 ? upcomingExpenses.map(e => `
                            <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 5px;">
                                <span style="font-weight: bold;">${e.title}</span>
                                <span style="color: #ef4444;">-${formatCurrency(e.cost)}</span>
                            </div>
                        `).join('') : '<p style="font-size: 12px; color: #94a3b8; margin: 0;">No upcoming expenses detected.</p>'}
                    </div>

                    <div style="margin-top: 40px;">
                        <a href="https://www.mindhub.website/dashboard" style="background: #4f46e5; color: white; padding: 15px 25px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">Access Headquarters</a>
                    </div>
                </div>
            `
        });
    }
    return NextResponse.json({ success: true, processed: activeUsers.length });
}
