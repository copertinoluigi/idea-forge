'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { canCreateMore } from '@/lib/access-control'

export async function exportProjectBlueprint(projectId: string, selectedTemplateIds: string[] = []) {
    const supabase = await createClient()
    
    const { data: project, error: pError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()

    if (pError || !project) throw new Error("Project not found")

    const { data: tasks } = await supabase
        .from('tasks')
        .select('title, priority, is_completed, due_date')
        .eq('project_id', projectId)

    const { data: notes } = await supabase
        .from('project_notes')
        .select('content, is_public')
        .eq('project_id', projectId)

    const { data: links } = await supabase
        .from('project_links')
        .select('title, url')
        .eq('project_id', projectId)

    let playbooks: any[] = []
    if (selectedTemplateIds.length > 0) {
        const { data: tpls } = await supabase
            .from('templates')
            .select('title, content, category')
            .in('id', selectedTemplateIds)
        playbooks = tpls || []
    }

    const blueprint = {
        version: "1.0",
        origin: "MindHub",
        exported_at: new Date().toISOString(),
        data: {
            project: {
                title: project.title,
                description: project.description,
                status: 'planning', 
                type: project.type,
                budget: project.budget,
                hourly_rate: project.hourly_rate,
                currency: project.currency,
                analytics_url: project.analytics_url,
                show_analytics_public: project.show_analytics_public
            },
            tasks: tasks || [],
            notes: notes || [],
            links: links || [],
            playbooks: playbooks
        }
    }

    return blueprint
}

export async function importProjectBlueprint(blueprint: any) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Unauthorized" }

    const { data: profile } = await supabase.from('profiles').select('plan_status').eq('id', user.id).single()
    const { count } = await supabase.from('projects').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
    
    const access = canCreateMore(profile?.plan_status || 'free', count || 0, 'projects')
    if (!access.allowed) return { success: false, error: access.message }

    try {
        const { project, tasks, notes, links, playbooks } = blueprint.data

        const { data: newProject, error: pError } = await supabase
            .from('projects')
            .insert({
                ...project,
                user_id: user.id,
                created_at: new Date().toISOString()
            })
            .select()
            .single()

        if (pError) throw pError

        if (tasks && tasks.length > 0) {
            const tasksToInsert = tasks.map((t: any) => ({
                ...t,
                project_id: newProject.id,
                user_id: user.id
            }))
            await supabase.from('tasks').insert(tasksToInsert)
        }

        if (notes && notes.length > 0) {
            const notesToInsert = notes.map((n: any) => ({
                ...n,
                project_id: newProject.id,
                user_id: user.id
            }))
            await supabase.from('project_notes').insert(notesToInsert)
        }

        if (links && links.length > 0) {
            const linksToInsert = links.map((l: any) => ({
                ...l,
                project_id: newProject.id
            }))
            await supabase.from('project_links').insert(linksToInsert)
        }

        if (playbooks && playbooks.length > 0) {
            const tplsToInsert = playbooks.map((tpl: any) => ({
                ...tpl,
                user_id: user.id
            }))
            await supabase.from('templates').insert(tplsToInsert)
        }

        revalidatePath('/dashboard/projects')
        return { success: true, projectId: newProject.id }

    } catch (error: any) {
        console.error("Import Error:", error)
        return { success: false, error: error.message }
    }
}
