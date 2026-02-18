'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getProjectMessages(projectId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('project_messages')
        .select('*, profiles:user_id(first_name, last_name)')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true })

    if (error) throw error
    return data
}

export async function sendProjectMessage(
    projectId: string, 
    content: string, 
    type: 'human' | 'ai_summary' = 'human',
    imageUrl?: string // <--- Aggiunto
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const { error } = await supabase.from('project_messages').insert({
        project_id: projectId,
        user_id: user.id,
        content: content,
        message_type: type,
        image_url: imageUrl // <--- Aggiunto
    })

    if (error) throw error
    revalidatePath(`/dashboard/projects/${projectId}`)
    return { success: true }
}
