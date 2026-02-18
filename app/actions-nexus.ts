'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = 'MindHub Nexus <system@mindhub.website>'

/**
 * INVITO: L'Architect invita un collaboratore via email
 */
export async function inviteMemberAction(projectId: string, email: string, role: 'operator' | 'guest') {
    const supabase = await createClient()
    const { data: { user: owner } } = await supabase.auth.getUser()
    if (!owner) return { success: false, error: "Unauthorized" }

    // 1. Verifica che chi invita sia l'Architect (Owner) del progetto
    const { data: nexusRole } = await supabase.rpc('get_nexus_role', { 
        proj_id: projectId, 
        req_user_id: owner.id 
    })
    
    if (nexusRole !== 'architect') {
        return { success: false, error: "Only the Architect can manage the Nexus" }
    }

    // 2. Registra l'invito includendo l'owner_id per evitare ricorsioni SQL
    const { error } = await supabase.from('project_members').insert({
        project_id: projectId,
        invited_email: email.toLowerCase().trim(),
        role,
        status: 'pending',
        owner_id: owner.id
    })

    if (error) return { success: false, error: "Invite already exists or user already in team" }

    // 3. Invio Email Formale via Resend
    try {
        await resend.emails.send({
            from: FROM_EMAIL,
            to: email,
            subject: `🚀 NEXUS INVITATION: Collaboration Request`,
            html: `
                <div style="font-family:sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
                    <h1 style="text-transform:uppercase; font-style:italic; color: #4f46e5;">Nexus Protocol Activated</h1>
                    <p>You have been invited to collaborate as an <strong>${role.toUpperCase()}</strong> on a strategic node.</p>
                    <p>Log in to your MindHub account to accept the mission and sync with the Architect.</p>
                    <br/>
                    <a href="https://mindhub.website/dashboard/projects" style="background:#000; color:#fff; padding:12px 24px; text-decoration:none; font-weight:bold; border-radius:8px; display: inline-block;">ENTER DASHBOARD</a>
                    <p style="font-size: 10px; color: #999; margin-top: 30px;">This invitation requires a PRO or BETA account status.</p>
                </div>
            `
        })
    } catch (e) {
        console.error("Resend delivery failed:", e)
    }

    revalidatePath(`/dashboard/projects/${projectId}`)
    return { success: true }
}

/**
 * ACCETTAZIONE: Il collaboratore accetta l'invito dalla sua dashboard
 */
export async function acceptNexusInviteAction(membershipId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Authentication required" }

    // 1. Validazione Account: Deve essere PRO o BETA
    const { data: profile } = await supabase
        .from('profiles')
        .select('plan_status')
        .eq('id', user.id)
        .single()
    
    if (profile?.plan_status !== 'pro' && profile?.plan_status !== 'beta') {
        return { success: false, error: "PRO_LICENSE_REQUIRED" }
    }

    // 2. Aggiornamento Membership: Collega l'ID profilo e imposta lo stato su accepted
    const { error } = await supabase
        .from('project_members')
        .update({ 
            profile_id: user.id, 
            status: 'accepted' 
        })
        .eq('id', membershipId)
        .eq('invited_email', user.email?.toLowerCase()) // Sicurezza: accetta solo se l'email coincide

    if (error) return { success: false, error: error.message }

    revalidatePath('/dashboard/projects')
    revalidatePath('/dashboard')
    return { success: true }
}

/**
 * RIMOZIONE: L'Architect rimuove un membro dal Nexus
 */
export async function removeMemberAction(projectId: string, memberId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Unauthorized" }
    
    // Verifica permessi Architect
    const { data: nexusRole } = await supabase.rpc('get_nexus_role', { 
        proj_id: projectId, 
        req_user_id: user.id 
    })
    
    if (nexusRole !== 'architect') return { success: false, error: "Unauthorized" }

    const { error } = await supabase.from('project_members').delete().eq('id', memberId)
    
    if (error) return { success: false, error: error.message }

    revalidatePath(`/dashboard/projects/${projectId}`)
    return { success: true }
}

/**
 * APPROVAZIONE: L'Architect convalida le ore e scala il budget
 */
export async function approveTimeLogAction(projectId: string, logId: string) {
    const { createClient } = await import('@/lib/supabase/server');
    const { supabaseAdmin } = await import('@/lib/supabase/admin');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    // 1. Verifica ruolo Architect
    const { data: role } = await supabase.rpc('get_nexus_role', { proj_id: projectId, req_user_id: user?.id });
    if (role !== 'architect') throw new Error("Unauthorized");

    // 2. Recupera il log e la tariffa concordata per quel membro
    const { data: log } = await supabase.from('time_logs').select('*').eq('id', logId).single();
    if (!log) throw new Error("Log not found");

    const { data: member } = await supabase.from('project_members')
        .select('member_hourly_rate')
        .eq('project_id', projectId)
        .eq('profile_id', log.user_id)
        .single();

    // 3. Calcolo impatto economico
    const hourlyRate = member?.member_hourly_rate ?? 0; // Se è null o undefined, usa 0
    const cost = (log.minutes / 60) * hourlyRate;

   // L'impatto sul budget sarà 0, ma lo stato passerà ad 'approved'

    // 4. Update Log (Usiamo admin per bypassare restrizioni di proprietà)
    const { error } = await supabaseAdmin
        .from('time_logs')
        .update({ 
            status: 'approved', 
            cost_impact: cost 
        })
        .eq('id', logId);

    if (error) throw error;

    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true };
}

/**
 * IMPOSTA TARIFFA: Solo Architect
 */
export async function updateMemberRateAction(projectId: string, memberId: string, rate: number) {
    const supabase = await createClient()
    await supabase.from('project_members').update({ member_hourly_rate: rate }).eq('id', memberId)
    revalidatePath(`/dashboard/projects/${projectId}`)
}
