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
    const activeUsers = profiles?.filter(p => p.preferences?.email_friday_wrap === true) || [];
    const todayStr = new Date().toISOString().split('T')[0];

    for (const profile of activeUsers) {
        // 1. Task completati questa settimana
        const { data: completedTasks } = await supabaseAdmin
            .from('tasks')
            .select('id')
            .eq('user_id', profile.id)
            .eq('is_completed', true);

        // 2. Debito Operativo: Task Overdue
        const { data: overdueTasks } = await supabaseAdmin
            .from('tasks')
            .select('title')
            .eq('user_id', profile.id)
            .eq('is_completed', false)
            .lt('due_date', todayStr);

        // 3. Debito Finanziario: Spese dimenticate (Overdue Subscriptions)
        const { data: overdueExpenses } = await supabaseAdmin
            .from('subscriptions')
            .select('title, cost')
            .eq('user_id', profile.id)
            .lt('renewal_date', todayStr);

        await resend.emails.send({
            from: 'MindHub Protocol <system@mindhub.website>',
            to: profile.email,
            subject: '🏁 [Shutdown] System Report & Sovereignty Check',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 20px; padding: 40px; color: #1e293b;">
                    <h2 style="color: #4f46e5; font-weight: 900; letter-spacing: -1px; margin-bottom: 20px;">MINDHUB OS</h2>
                    <p style="font-weight: bold; font-size: 18px;">Friday Shutdown Memo</p>
                    <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 30px 0;" />
                    
                    <div style="background: #f0fdf4; padding: 20px; border-radius: 15px; margin-bottom: 30px; text-align: center;">
                        <p style="font-size: 24px; font-weight: 900; color: #166534; margin: 0;">${completedTasks?.length || 0}</p>
                        <p style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #166534; margin: 0;">Tasks Completed This Week</p>
                    </div>

                    <p style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #f43f5e; margin-bottom: 15px;">Pending Operational Debt</p>
                    
                    <div style="space-y: 10px;">
                        ${overdueTasks && overdueTasks.length > 0 ? overdueTasks.map(t => `
                            <div style="font-size: 13px; color: #475569; margin-bottom: 5px;">• [Task] ${t.title}</div>
                        `).join('') : ''}

                        ${overdueExpenses && overdueExpenses.length > 0 ? overdueExpenses.map(e => `
                            <div style="font-size: 13px; color: #f43f5e; font-weight: bold; margin-bottom: 5px;">• [Expense Unconfirmed] ${e.title} (${formatCurrency(e.cost)})</div>
                        `).join('') : ''}

                        ${(!overdueTasks?.length && !overdueExpenses?.length) ? '<p style="color: #10b981; font-weight: bold; font-size: 13px;">System clean. No pending debt.</p>' : ''}
                    </div>

                    <div style="margin-top: 40px; text-align: center; border-top: 1px solid #f1f5f9; pt-20">
                        <p style="font-weight: bold; font-size: 14px; color: #64748b;">Enjoy your sovereignty. Node offline.</p>
                    </div>
                </div>
            `
        });
    }
    return NextResponse.json({ success: true, processed: activeUsers.length });
}
