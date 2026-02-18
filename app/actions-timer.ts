'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * START: Avvia la sessione di lavoro
 */
export async function startPulseSession(projectId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const { error } = await supabase.from('active_sessions').insert({
        user_id: user.id,
        project_id: projectId
    })

    if (error) throw new Error("A session is already active elsewhere.")
    
    revalidatePath(`/dashboard/projects/${projectId}`)
    return { success: true }
}

/**
 * STOP: Ferma la sessione e crea il log in attesa di approvazione
 */
export async function stopPulseSession(projectId: string, description: string, completedTaskIds: string[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    // 1. Recupera la sessione
    const { data: session } = await supabase
        .from('active_sessions')
        .select('*')
        .eq('user_id', user.id)
        .single()
    if (!session) throw new Error("No active session found")

    // 2. Calcola durata
    const start = new Date(session.start_time)
    const end = new Date()
    const minutes = Math.floor((end.getTime() - start.getTime()) / 60000)

    // 3. Determina lo stato (Architect = approved, Others = pending)
    const { data: role } = await supabase.rpc('get_nexus_role', { proj_id: projectId, req_user_id: user.id })
    const status = (role === 'architect') ? 'approved' : 'pending'

    // 4. Se approvato (Architect), calcola subito l'impatto sul budget
    let costImpact = 0
    if (status === 'approved') {
        const { data: project } = await supabase.from('projects').select('hourly_rate').eq('id', projectId).single()
        costImpact = (minutes / 60) * (project?.hourly_rate || 0)
    }

    // 5. Salva il Time Log
    const { error: logError } = await supabase.from('time_logs').insert({
        project_id: projectId,
        user_id: user.id,
        minutes,
        description,
        status,
        cost_impact: costImpact
    })

    if (logError) throw logError

    // 6. Smarca i task selezionati
    if (completedTaskIds.length > 0) {
        await supabase.from('tasks').update({ is_completed: true, updated_at: new Date().toISOString() }).in('id', completedTaskIds)
    }

    // 7. Chiudi sessione
    await supabase.from('active_sessions').delete().eq('id', session.id)

    revalidatePath(`/dashboard/projects/${projectId}`)
    return { success: true, minutes }
}
