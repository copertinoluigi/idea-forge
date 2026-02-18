'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Resend } from 'resend'
import { supabaseAdmin } from '@/lib/supabase/admin'; 
import { canCreateMore } from '@/lib/access-control'

const resend = new Resend(process.env.RESEND_API_KEY)
const ADMIN_EMAIL = 'copertino.luigi@gmail.com'
const FROM_EMAIL = 'MindHub System <system@mindhub.website>'

// --- HELPERS ---
async function updateProjectProgress(supabase: any, projectId: string) {
    const { data: tasks } = await supabase.from('tasks').select('is_completed').eq('project_id', projectId)
    if (!tasks || tasks.length === 0) return 
    const completed = tasks.filter((t: any) => t.is_completed).length
    const total = tasks.length
    const progress = Math.round((completed / total) * 100)
    await supabase.from('projects').update({ progress }).eq('id', projectId)
}

// --- VAULT LOGGING HELPER ---
async function logVaultMovement(
    supabase: any, 
    userId: string, 
    amount: number, 
    vaultType: string, 
    movementType: 'in' | 'out', 
    description: string,
    currency: string = 'EUR' // <--- AGGIUNTO
) {
    await supabase.from('vault_logs').insert({
        user_id: userId,
        amount,
        vault_type: vaultType,
        movement_type: movementType,
        description,
        currency // <--- SALVIAMO LA VALUTA REALE DEL MOVIMENTO
    });
}

// --- BUG REPORTING ---
export async function reportBug(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const description = formData.get('description') as string;
  const file = formData.get('screenshot') as File;
  let imageUrl = null;

  if (file && file.size > 0) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
    const { data } = await supabase.storage.from('bug-attachments').upload(fileName, file);
    if (data) imageUrl = supabase.storage.from('bug-attachments').getPublicUrl(fileName).data.publicUrl;
  }

  await supabase.from('bug_reports').insert({ user_id: user?.id, description, image_url: imageUrl });
  await resend.emails.send({
    from: FROM_EMAIL, to: ADMIN_EMAIL, subject: `🚨 Bug Report - ${user?.email}`,
    html: `<p><strong>Bug:</strong> ${description}</p>${imageUrl ? `<p><a href="${imageUrl}">Vedi Screenshot</a></p>` : ''}`
  });
  return { success: true };
}

// --- GLOBAL SEARCH ---
export async function globalSearch(query: string) {
  const supabase = await createClient();
  if (!query || query.length < 2) return { projects: [], resources: [], subscriptions: [] };
  const searchQuery = `%${query}%`;
  const [projects, resources, subscriptions] = await Promise.all([
    supabase.from('projects').select('id, title, status').ilike('title', searchQuery).limit(3),
    supabase.from('resources').select('id, title, type').ilike('title', searchQuery).limit(3),
    supabase.from('subscriptions').select('id, title').ilike('title', searchQuery).limit(2)
  ]);
  return { projects: projects.data || [], resources: resources.data || [], subscriptions: subscriptions.data || [] };
}

// --- PROJECT & TASK ACTIONS ---

export async function createProject(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const [profileReq, countReq] = await Promise.all([
      supabase.from('profiles').select('plan_status').eq('id', user.id).single(),
      supabase.from('projects').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
  ]);
  const access = canCreateMore(profileReq.data?.plan_status || 'free', countReq.count || 0, 'projects');
  if (!access.allowed) return { success: false, error: access.message };

  const { data: project, error } = await supabase.from('projects').insert({
    title: formData.get('title'),
    description: formData.get('description'),
    status: formData.get('status'),
    type: formData.get('type') || 'personal',
    analytics_url: formData.get('analytics_url'),
    show_analytics_public: formData.get('show_analytics_public') === 'on',
    hourly_rate: Number(formData.get('hourly_rate') || 0),
    currency: formData.get('currency') || 'EUR',
    budget: Number(formData.get('budget') || 0),
    progress: 0,
    user_id: user.id
  }).select().single()

  if (error) return { success: false, error: error.message }

  const selectedPhases = formData.getAll('selectedPhases') as string[]
  if (selectedPhases.length > 0) {
      const tasksToInsert = selectedPhases.map(phase => ({
          project_id: project.id,
          user_id: user.id,
          title: phase,
          is_completed: false,
          priority: 'medium'
      }))
      await supabase.from('tasks').insert(tasksToInsert)
  }

  await trackActivity()
  revalidatePath('/dashboard/projects')
  return { success: true, data: project }
}

export async function addTask(formData: FormData) {
  const { createClient } = await import('@/lib/supabase/server');
  const { revalidatePath } = await import('next/cache');
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const title = formData.get('title') as string;
  const rawProjectId = formData.get('projectId');
  const priority = (formData.get('priority') as string) || 'medium';
  const dueDateRaw = formData.get('dueDate');

  if (!title || title.trim() === "") return { success: false, error: "Title is required" };

  // --- LOGICA UUID SAFE (Non rompe il manuale) ---
  // Se è un UUID valido lo usiamo, altrimenti il task è "Global" (null)
  const isUuid = (val: any) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);
  const projectId = isUuid(rawProjectId) ? (rawProjectId as string) : null;
 // --- NEXUS PERMISSION CHECK ---
  if (projectId) {
      const { data: role } = await supabase.rpc('get_nexus_role', { 
          proj_id: projectId, 
          req_user_id: user.id 
      });

      if (role === 'none' || role === 'guest') {
          return { success: false, error: "Unauthorized: You don't have Operator permissions on this Nexus" };
      }
  }
  // --- LOGICA DATA SAFE (Previene il crash) ---
  let isoDate = null;
  if (dueDateRaw && dueDateRaw !== "" && dueDateRaw !== "null" && dueDateRaw !== "undefined") {
      const d = new Date(dueDateRaw as string);
      if (!isNaN(d.getTime())) { // Verifica se la data è valida
          isoDate = d.toISOString();
      }
  }

  const { error } = await supabase.from('tasks').insert({
    title,
    project_id: projectId,
    user_id: user.id,
    due_date: isoDate,
    priority,
    is_completed: false
  });

  if (error) {
    console.error("Database Insert Error:", error.message);
    return { success: false, error: error.message };
  }

  await trackActivity();
  // Se il task è legato a un progetto, aggiorniamo il suo progresso (%)
  if (projectId) {
      const { data: tasks } = await supabase.from('tasks').select('is_completed').eq('project_id', projectId);
      if (tasks && tasks.length > 0) {
          const completed = tasks.filter((t: any) => t.is_completed).length;
          const progress = Math.round((completed / tasks.length) * 100);
          await supabase.from('projects').update({ progress }).eq('id', projectId);
      }
      revalidatePath(`/dashboard/projects/${projectId}`);
  }
  
  revalidatePath('/dashboard');
  return { success: true };
}

// --- FIX REDIRECT PLAYBOOKS (Evita il 404) ---
export async function createTemplateAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false };

    const { error } = await supabase.from('templates').insert({
        title: formData.get('title'),
        category: formData.get('category'),
        content: formData.get('content'),
        user_id: user.id
    });

    if (error) return { success: false, error: error.message };

    await trackActivity();
    revalidatePath('/dashboard/templates');
    // Il redirect deve puntare alla rotta esatta definita nella sidebar
    redirect('/dashboard/templates'); 
}

// --- ARCHIVE PROJECT ACTION (With Asset Cleanup Logic) ---
export async function archiveProjectAction(projectId: string, handleAssets: 'keep' | 'delete' = 'keep') {
    const supabase = await createClient();
    
    try {
        // Esegui l'archiviazione
        const { error: projectError } = await supabase
          .from('projects')
          .update({ status: 'archived' })
          .eq('id', projectId);
      
        if (projectError) return { success: false, error: projectError.message };

        // Gestione Subscriptions
        if (handleAssets === 'delete') {
            await supabase.from('subscriptions').delete().eq('project_id', projectId);
        } else {
            await supabase.from('subscriptions').update({ project_id: null }).eq('project_id', projectId);
        }

        revalidatePath('/dashboard/projects');
        revalidatePath(`/dashboard/projects/${projectId}`);
        revalidatePath('/dashboard/finances');
    } catch (err: any) {
        return { success: false, error: "Critical failure during archival" };
    }

    // Il redirect va fuori dal try/catch o alla fine per evitare il falso errore NEXT_REDIRECT
    redirect('/dashboard/projects');
}

export async function toggleTaskAction(taskId: string, projectId: string, currentStatus: boolean) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // 1. DETERMINAZIONE RUOLO
    const { data: role } = await supabase.rpc('get_nexus_role', { 
        proj_id: projectId, 
        req_user_id: user.id 
    });

    // Solo Architect o Operator possono smarcare i task
    if (role !== 'architect' && role !== 'operator') {
        throw new Error("Unauthorized: Only Architects and Operators can toggle tasks");
    }

    // 2. ESECUZIONE (Se è Architect, la policy SQL sopra gli permette di farlo anche se il task non è suo)
    const { error } = await supabase.from('tasks').update({ 
        is_completed: !currentStatus, 
        updated_at: new Date().toISOString() 
    }).eq('id', taskId);

    if (error) throw error;
    if (!currentStatus) await trackActivity();
    await updateProjectProgress(supabase, projectId);
    revalidatePath(`/dashboard/projects/${projectId}`);
}

export async function deleteTaskAction(taskId: string, projectId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");
    
    // 1. DETERMINAZIONE RUOLO
    const { data: role } = await supabase.rpc('get_nexus_role', { 
        proj_id: projectId, 
        req_user_id: user.id 
    });

    // SOLO l'Architect ha il potere di distruzione
    if (role !== 'architect') {
        throw new Error("Sovereign Protection: Only the Architect can delete project records");
    }

    // 2. ESECUZIONE
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    
    if (error) throw error;
    await updateProjectProgress(supabase, projectId);
    revalidatePath(`/dashboard/projects/${projectId}`);
}

export async function addProjectLink(formData: FormData) {
  const supabase = await createClient();
  const title = formData.get('title') as string;
  const url = formData.get('url') as string;
  const projectId = formData.get('projectId') as string;
  if (title && url && projectId) {
    const safeUrl = url.startsWith('http') ? url : `https://${url}`;
    await supabase.from('project_links').insert({ title, url: safeUrl, project_id: projectId });
    await trackActivity();
    revalidatePath(`/dashboard/projects/${projectId}`);
  }
}

export async function deleteProjectLink(id: string, projectId: string) {
  const supabase = await createClient();
  await supabase.from('project_links').delete().eq('id', id);
  revalidatePath(`/dashboard/projects/${projectId}`);
}

export async function addTimeLog(formData: FormData) {
    const supabase = await createClient();
    const projectId = formData.get('projectId') as string;
    const userId = formData.get('userId') as string;
    const hours = Number(formData.get('hours') || 0);
    const minutes = Number(formData.get('minutes') || 0);
    const description = formData.get('description') as string;
    const totalMinutes = (hours * 60) + minutes;
    if (totalMinutes > 0) {
        await supabase.from('time_logs').insert({ project_id: projectId, user_id: userId, minutes: totalMinutes, description });
        await trackActivity();
        revalidatePath(`/dashboard/projects/${projectId}`);
    }
}

export async function deleteTimeLog(logId: string, projectId: string) {
    const supabase = await createClient();
    await supabase.from('time_logs').delete().eq('id', logId);
    revalidatePath(`/dashboard/projects/${projectId}`);
}

export async function deleteProjectAction(projectId: string) {
  const supabase = await createClient();
  await supabase.from('projects').delete().eq('id', projectId);
  revalidatePath('/dashboard/projects');
}

export async function updateProjectBudget(projectId: string, budget: number) {
    const supabase = await createClient();
    const { error } = await supabase.from('projects').update({ budget: budget }).eq('id', projectId);
    if (error) throw error;
    revalidatePath(`/dashboard/projects/${projectId}`);
    revalidatePath('/dashboard/finances');
}

export async function updateProjectBudgetAction(projectId: string, amount: number) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false };
    const { error } = await supabase.from('projects').update({ budget: amount }).eq('id', projectId).eq('user_id', user.id);
    if (error) return { success: false, error: error.message };
    await trackActivity();
    revalidatePath(`/dashboard/projects/${projectId}`);
    revalidatePath('/dashboard/finances');
    return { success: true };
}

// --- CRUD OTHERS (FINANCES, RESOURCES, SOCIAL, TEMPLATES) ---

export async function deleteSubscription(id: string) {
  const supabase = await createClient(); await supabase.from('subscriptions').delete().eq('id', id);
  revalidatePath('/dashboard/finances');
}
export async function deleteResource(id: string) {
  const supabase = await createClient(); await supabase.from('resources').delete().eq('id', id);
  revalidatePath('/dashboard/resources'); revalidatePath('/dashboard/life');
}
export async function deleteTemplate(id: string) {
  const supabase = await createClient(); await supabase.from('templates').delete().eq('id', id);
  revalidatePath('/dashboard/templates');
}
export async function deleteSocial(id: string) {
  const supabase = await createClient(); await supabase.from('social_accounts').delete().eq('id', id);
  revalidatePath('/dashboard/social');
}
export async function updateTemplate(id: string, formData: FormData) {
    const supabase = await createClient();
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const { error } = await supabase.from('templates').update({ title, content }).eq('id', id);
    if (error) return { success: false, error: error.message };
    revalidatePath(`/dashboard/templates/${id}`);
    revalidatePath('/dashboard/templates');
    return { success: true };
}

export async function updateSocialMetrics(id: string, newValue: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('social_accounts').update({ followers_count: newValue, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) return { success: false };
  revalidatePath('/dashboard/social');
  return { success: true };
}

export async function updatePersonalCash(amount: number) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('profiles').update({ personal_cash_on_hand: amount }).eq('id', user?.id);
    revalidatePath('/dashboard/finances');
}

/**
 * Aggiunta Spesa (Blindata con Access Control e nuovi campi)
 */
export async function addSubscription(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const [profileReq, countReq] = await Promise.all([
        supabase.from('profiles').select('plan_status').eq('id', user.id).single(),
        supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
    ]);
    
    const access = canCreateMore(profileReq.data?.plan_status || 'free', countReq.count || 0, 'expenses');
    if (!access.allowed) return { success: false, error: access.message };

    // ESTRAZIONE COMPLETA DEI DATI
    const payload = {
        title: formData.get('title'),
        cost: parseFloat(formData.get('cost') as string),
        category: formData.get('category'),
        currency: formData.get('currency') || 'EUR',           // AGGIUNTO
        renewal_date: formData.get('renewal_date'),           // AGGIUNTO (Fondamentale!)
        description: formData.get('description'),             // AGGIUNTO
        project_id: formData.get('project_id') || null,
        user_id: user.id,
        active: true
    };

    const { error } = await supabase.from('subscriptions').insert(payload);

    if (error) {
        console.error("DB Error:", error.message);
        return { success: false, error: error.message };
    }

    await trackActivity();
    revalidatePath('/dashboard/finances');
    revalidatePath('/dashboard/projects');
    revalidatePath('/dashboard/agenda'); // Importante per l'agenda!
    return { success: true };
}

// --- CONFIRM EXPENSE PAYMENT (Sottrae dal Vault e sposta data) ---
export async function confirmExpensePaymentAction(subId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false };

    const { data: sub } = await supabase.from('subscriptions').select('*').eq('id', subId).single();
    const { data: profile } = await supabase.from('profiles').select('base_currency, cash_on_hand, personal_cash_on_hand').eq('id', user.id).single();
    if (!sub || !profile) return { success: false };

    const cost = Number(sub.cost);
    let updateData: any = {};
    const vaultType = sub.category === 'life' ? 'personal_cash_on_hand' : 'cash_on_hand';
    const vaultLabel = sub.category === 'life' ? 'personal' : 'business';

    updateData[vaultType] = (profile[vaultType] || 0) - cost;

    await supabase.from('profiles').update(updateData).eq('id', user.id);

    // LOGICA: Sottraiamo il numero puro (Sovereign Responsibility)
// Ma passiamo la valuta al log per l'AI
await logVaultMovement(
    supabase, 
    user.id, 
    cost, 
    vaultLabel, 
    'out', 
    `Expense Paid: ${sub.title}`,
    sub.currency // <--- PASSIAMO LA VALUTA DELLA SPESA
);

    const currentRenewal = new Date(sub.renewal_date);
    currentRenewal.setMonth(currentRenewal.getMonth() + 1);
    await supabase.from('subscriptions').update({ renewal_date: currentRenewal.toISOString().split('T')[0] }).eq('id', subId);

    // --- REVALIDATION CORE ---
    revalidatePath('/dashboard/finances');
    revalidatePath('/dashboard/agenda');
    revalidatePath('/dashboard');
    revalidatePath(`/dashboard/projects/${sub.project_id}`);
    
    return { success: true };
}

/**
 * Aggiunta Entrata (Blindata con Access Control)
 */
export async function addIncomeAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const [profileReq, countReq] = await Promise.all([
        supabase.from('profiles').select('plan_status').eq('id', user.id).single(),
        supabase.from('incomes').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
    ]);
    const access = canCreateMore(profileReq.data?.plan_status || 'free', countReq.count || 0, 'incomes');
    if (!access.allowed) return { success: false, error: access.message };

    const { error } = await supabase.from('incomes').insert({
        user_id: user.id,
        title: formData.get('title'),
        amount_gross: parseFloat(formData.get('amount_gross') as string),
        tax_percentage: parseFloat(formData.get('tax_percentage') as string) || 0,
        currency: formData.get('currency') || 'EUR',
        category: formData.get('category'),
        project_id: formData.get('project_id') === 'none' ? null : formData.get('project_id'),
        due_date: formData.get('due_date') || null,
        status: 'expected'
    });

    if (error) return { success: false, error: error.message };
    await trackActivity();
    revalidatePath('/dashboard/finances');
    revalidatePath('/dashboard/agenda');
    return { success: true };
}

// --- GLOBAL OVERHEAD ENGINE ---
export async function getGlobalOverheadAction() {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { totalOverhead: 0, perProjectWeight: 0, activeProjectsCount: 0 };

    // 1. Progetti attivi (tutti tranne archiviati)
    const { data: projects } = await supabase
        .from('projects')
        .select('id')
        .neq('status', 'archived')
        .eq('user_id', user.id);

    const activeProjectsCount = projects?.length || 0;
    if (activeProjectsCount === 0) return { totalOverhead: 0, perProjectWeight: 0, activeProjectsCount: 0 };

    // 2.overhead = tutto ciò che NON è 'life' o 'personal' e non ha progetto
    const { data: generalSubs } = await supabase
        .from('subscriptions')
        .select('cost')
        .is('project_id', null)
        .eq('user_id', user.id)
        .not('category', 'ilike', 'life')     // Case-insensitive check
        .not('category', 'ilike', 'personal'); // Case-insensitive check

    const totalGeneralCost = generalSubs?.reduce((acc, sub) => acc + Number(sub.cost || 0), 0) || 0;
    
    return {
        totalOverhead: totalGeneralCost,
        perProjectWeight: totalGeneralCost / activeProjectsCount,
        activeProjectsCount
    };
}

// --- FINANCIAL ACTIONS WITH AUDIT TRAIL ---

export async function confirmIncomeReceiptAction(incomeId: string) {
    const { createClient } = await import('@/lib/supabase/server');
    const { revalidatePath } = await import('next/cache');
    
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    // 1. Recupero i dettagli
    const { data: income } = await supabase.from('incomes').select('*').eq('id', incomeId).single();
    if (!income) return { success: false, error: "Income not found" };

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (!profile) return { success: false, error: "Profile not found" };

    const amountGross = Number(income.amount_gross);
    const taxPercentage = Number(income.tax_percentage || 0);
    const taxAmount = (amountGross * taxPercentage) / 100;
    const netAmount = amountGross - taxAmount;

    let updateData: any = {};
    const vaultType = income.category === 'personal' ? 'personal_cash_on_hand' : 'cash_on_hand';
    const vaultLabel = income.category === 'personal' ? 'personal' : 'business';

    updateData[vaultType] = Number(profile[vaultType] || 0) + netAmount;
    updateData.tax_reserve = Number(profile.tax_reserve || 0) + taxAmount;

    // 2. Aggiornamento Profilo
    const { error: profError } = await supabase.from('profiles').update(updateData).eq('id', user.id);
    if (profError) return { success: false, error: profError.message };

    // 3. SCRITTURA LOG (Spostato qui per sicurezza)
    const logsToInsert = [
        {
            user_id: user.id,
            amount: netAmount,
            vault_type: vaultLabel,
            movement_type: 'in',
            description: `Income Confirmed: ${income.title}`
        }
    ];

    if (taxAmount > 0) {
        logsToInsert.push({
            user_id: user.id,
            amount: taxAmount,
            vault_type: 'tax',
            movement_type: 'in',
            description: `Tax Provision: ${income.title}`
        });
    }

    await supabase.from('vault_logs').insert(logsToInsert);

    // 4. Aggiornamento stato Income
    if (income.is_recurring) {
        const nextDate = new Date(income.due_date);
        nextDate.setMonth(nextDate.getMonth() + 1);
        await supabase.from('incomes').update({ 
            due_date: nextDate.toISOString().split('T')[0] 
        }).eq('id', incomeId);
    } else {
        await supabase.from('incomes').update({ status: 'received' }).eq('id', incomeId);
    }

    // 5. REVALIDATE FORZATO (Il segreto per far sparire il tasto e mostrare i log)
    revalidatePath('/dashboard/finances');
    revalidatePath('/dashboard/agenda');
    revalidatePath('/dashboard'); 
    
    return { success: true };
}

// --- UPDATE SUBSCRIPTION (SPESA) ---
export async function updateSubscriptionAction(id: string, formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const projectId = formData.get('project_id');

    const { error } = await supabase.from('subscriptions').update({
        title: formData.get('title'),
        cost: parseFloat(formData.get('cost') as string),
        currency: formData.get('currency'),
        category: formData.get('category'),
        renewal_date: formData.get('renewal_date'),
        project_id: projectId === 'none' || !projectId ? null : projectId, // Gestione sicura null
    }).eq('id', id).eq('user_id', user.id);

    if (error) return { success: false, error: error.message };
    
    revalidatePath('/dashboard/finances');
    revalidatePath('/dashboard/agenda');
    return { success: true };
}

// --- UPDATE INCOME (ENTRATA) ---
export async function updateIncomeAction(id: string, formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false };

    const { error } = await supabase.from('incomes').update({
        title: formData.get('title'),
        amount_gross: parseFloat(formData.get('amount_gross') as string),
        tax_percentage: parseFloat(formData.get('tax_percentage') as string),
        category: formData.get('category'),
        currency: formData.get('currency'),
        due_date: formData.get('due_date'),
        project_id: formData.get('project_id') === 'none' ? null : formData.get('project_id'),
        is_recurring: formData.get('is_recurring') === 'on' // Gestione checkbox
    }).eq('id', id).eq('user_id', user.id);

    if (error) return { success: false, error: error.message };
    revalidatePath('/dashboard/finances');
    return { success: true };
}
// --- AUTH & NOTIFICATIONS ---

export async function validateAndConsumeKey(key: string, userEmail?: string) {
    const supabaseAdmin = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data: keyData, error: fetchError } = await supabaseAdmin.from('access_keys').select('*').eq('key', key).single();
    if (fetchError || !keyData || keyData.used_count >= keyData.max_uses) return { valid: false };
    await supabaseAdmin.from('access_keys').update({ used_count: keyData.used_count + 1 }).eq('id', keyData.id);
    try {
        await resend.emails.send({
            from: FROM_EMAIL, to: ADMIN_EMAIL, subject: `🚀 Nuovo Founder su MindHub!`,
            html: `<p>Utente: ${userEmail || 'N/A'}</p><p>Chiave: ${key}</p>`
        });
    } catch (err) { console.error("Resend error:", err); }
    revalidatePath('/dashboard/admin');
    return { valid: true, credits: keyData.credits_reward };
}

export async function notifyNewUserVerified(email: string) {
    try {
        await resend.emails.send({
            from: 'MindHub System <system@mindhub.website>', to: ADMIN_EMAIL, subject: `🎉 Nuovo Founder: ${email}`,
            html: `<p>L'utente <strong>${email}</strong> è entrato in MindHub.</p>`
        });
    } catch (e) { console.error("Resend error:", e); }
}

export async function submitContactForm(formData: FormData) {
    const supabase = await createClient();
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const message = formData.get('message') as string;
    const { error } = await supabase.from('support_tickets').insert({ name, email, message });
    if (error) return { success: false, error: error.message };
    await resend.emails.send({
        from: 'MindHub Support <system@mindhub.website>', to: ADMIN_EMAIL, subject: `✉️ Messaggio Contatti da ${name}`,
        html: `<p><strong>Nome:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Messaggio:</strong> ${message}</p>`
    });
    return { success: true };
}

// --- ADMIN & GOD MODE ---

export async function getAdminMetrics() {
    const supabaseAdminClient = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!, 
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const [reports, projects, tasks, subs, profs, keys] = await Promise.all([
        supabaseAdminClient.from('ai_reports').select('*', { count: 'exact', head: true }),
        supabaseAdminClient.from('projects').select('*', { count: 'exact', head: true }),
        supabaseAdminClient.from('tasks').select('*', { count: 'exact', head: true }),
        supabaseAdminClient.from('subscriptions').select('cost'),
        supabaseAdminClient.from('profiles').select('credits'),
        supabaseAdminClient.from('access_keys').select('used_count') // <--- QUERY AGGIUNTA
    ]);

    const globalBurn = subs.data?.reduce((acc, curr) => acc + Number(curr.cost || 0), 0) || 0;
    const totalKeysUsed = keys.data?.reduce((acc: number, curr: any) => acc + (curr.used_count || 0), 0) || 0;
    const totalCredits = profs.data?.reduce((acc: number, curr: any) => acc + (curr.credits || 0), 0) || 0;
    const totalRows = (tasks.count || 0) + (projects.count || 0);

    return {
        aiCostEst: (reports.count || 0) * 0.0018,
        totalProjects: projects.count || 0,
        totalTasks: tasks.count || 0,
        globalBurn: globalBurn,
        activeUsers: profs.data?.length || 0,
        estimatedRevenue: totalKeysUsed * 99,
        dbCapacityPercent: (totalRows / 100000) * 100,
        creditsInCirculation: totalCredits
    };
}

    // 2. USA SUPABASE_ADMIN per recuperare i dati di TUTTI
export async function getGodModeAnalytics() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: adminCheck } = await supabase.from('profiles').select('is_admin').eq('id', user?.id).single();
    if (!adminCheck?.is_admin) throw new Error("Unauthorized");

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const sevenDaysAgo = new Date(new Date().setDate(now.getDate() - 7)).toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(new Date().setDate(now.getDate() - 30)).toISOString().split('T')[0];

    const [dauReq, wauReq, mauReq, allUsersReq, reportsReq] = await Promise.all([
        supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }).eq('last_activity_date', today),
        supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }).gte('last_activity_date', sevenDaysAgo),
        supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }).gte('last_activity_date', thirtyDaysAgo),
        supabaseAdmin.from('profiles').select('id, credits, plan_status'),
        supabaseAdmin.from('ai_reports').select('id', { count: 'exact', head: true })
    ]);

    const totalUsers = allUsersReq.data?.length || 0;
    const reportsCount = reportsReq.count || 0; // <--- FIX: Forziamo a 0 se null

    return {
        retention: { 
            dau: dauReq.count || 0, 
            wau: wauReq.count || 0, 
            mau: mauReq.count || 0,
            totalUsers, 
            activeRate: totalUsers > 0 ? (((wauReq.count || 0) / totalUsers) * 100).toFixed(1) : 0 
        },
        credits: { 
            totalConsumed: reportsCount, 
            remainingInSystem: allUsersReq.data?.reduce((acc, p) => acc + (p.credits || 0), 0) || 0, 
            usersOut: allUsersReq.data?.filter(p => (p.credits || 0) <= 0).length || 0, 
            avgPerUser: totalUsers > 0 ? (reportsCount / totalUsers).toFixed(2) : 0 
        }
    };
}


// Aggiorna crediti usando supabaseAdmin (permesso di scrittura su altri profili)
export async function addCredits(formData: FormData) {
  const userId = formData.get('userId') as string;
  const amount = Number(formData.get('amount'));
  if (!userId || isNaN(amount)) return;
  
  const { data: p } = await supabaseAdmin.from('profiles').select('credits').eq('id', userId).single();
  await supabaseAdmin.from('profiles').update({ credits: (p?.credits || 0) + amount }).eq('id', userId);
  revalidatePath('/dashboard/admin');
}

// Bannare utenti usando supabaseAdmin
export async function toggleBan(userId: string, currentStatus: boolean) {
    await supabaseAdmin.from('profiles').update({ is_banned: !currentStatus }).eq('id', userId);
    revalidatePath('/dashboard/admin');
}

export async function toggleAdminRole(userId: string, currentStatus: boolean) {
    const supabase = await createClient(); await supabase.from('profiles').update({ is_admin: !currentStatus }).eq('id', userId);
    revalidatePath('/dashboard/admin');
}

export async function createAnnouncement(formData: FormData) {
    const supabase = await createClient(); 
    const message = formData.get('message') as string;
    if (message) await supabase.from('announcements').insert({ message, active: true });
    revalidatePath('/dashboard/admin');
}

export async function updateTrackingSettings(formData: FormData) {
    const supabase = await createClient(); 
    const ga_id = formData.get('ga_id') as string; 
    const clarity_id = formData.get('clarity_id') as string;
    await supabase.from('app_settings').update({ ga_id, clarity_id }).neq('id', '00000000-0000-0000-0000-000000000000');
    revalidatePath('/dashboard/admin');
}

export async function deleteUserAccount(surveyReason: string) {
    const supabase = await createClient(); 
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not found" };
    await supabase.from('exit_surveys').insert({ user_id: user.id, reason: surveyReason });
    await supabase.from('profiles').delete().eq('id', user.id);
    await supabase.auth.signOut(); return { success: true };
}

export async function seedDemoData() {
    const supabase = await createClient(); 
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authorized" };
    await supabase.from('projects').delete().eq('user_id', user.id);
    const { data: projects } = await supabase.from('projects').insert([
        { user_id: user.id, title: "MindHub SaaS", status: "active", progress: 65, type: "personal", hourly_rate: 80 },
        { user_id: user.id, title: "Client App", status: "active", progress: 40, type: "client", hourly_rate: 120 }
    ]).select();
    revalidatePath('/dashboard'); return { success: true };
}

// --- MOMENTUM & STREAK SYSTEM ---

export async function trackActivity() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase.from('profiles').select('timezone, streak, last_activity_date, last_rewarded_streak, credits').eq('id', user.id).single();
    if (!profile) return;

    const userTimezone = profile.timezone || 'Europe/Rome';
    const now = new Date();
    const localDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: userTimezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
    if (profile.last_activity_date === localDateStr) return;

    const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = new Intl.DateTimeFormat('en-CA', { timeZone: userTimezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(yesterday);

    let newStreak = (profile.last_activity_date === yesterdayStr) ? (profile.streak || 0) + 1 : 1;
    const updateData: any = { streak: newStreak, last_activity_date: localDateStr };

    if (newStreak > 0 && newStreak % 10 === 0 && newStreak > (profile.last_rewarded_streak || 0)) {
        updateData.credits = (profile.credits || 0) + 1;
        updateData.last_rewarded_streak = newStreak;
    }
    await supabase.from('profiles').update(updateData).eq('id', user.id);
    revalidatePath('/dashboard');
}

export async function getStreakData() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { currentStreak: 0, progress: 0 };

    const { data: profile } = await supabase.from('profiles').select('streak, last_activity_date, timezone').eq('id', user.id).single();
    if (!profile) return { currentStreak: 0, progress: 0 };

    const userTimezone = profile.timezone || 'Europe/Rome';
    const now = new Date();
    const localDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: userTimezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
    const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = new Intl.DateTimeFormat('en-CA', { timeZone: userTimezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(yesterday);

    const isActive = profile.last_activity_date === localDateStr || profile.last_activity_date === yesterdayStr;
    const currentStreak = isActive ? (profile.streak || 0) : 0;
    return { currentStreak, progress: currentStreak % 10 === 0 && currentStreak > 0 ? 10 : currentStreak % 10 };
}

export async function getMomentumData() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: activity } = await supabase.from('tasks').select('updated_at').eq('user_id', user?.id).eq('is_completed', true).gte('updated_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());
    const counts: Record<string, number> = {};
    activity?.forEach(a => { const d = a.updated_at.split('T')[0]; counts[d] = (counts[d] || 0) + 1; });
    return counts;
}

export async function updateUserTimezone(timezone: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('profiles').update({ timezone }).eq('id', user.id);
    revalidatePath('/dashboard');
}

// --- PROJECT NOTES ---

export async function addProjectNoteAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const projectId = formData.get('projectId') as string;

    // --- NEXUS PERMISSION CHECK ---
    const { data: role } = await supabase.rpc('get_nexus_role', { 
        proj_id: projectId, 
        req_user_id: user.id 
    });

    if (role === 'none' || role === 'guest') return;

    await supabase.from('project_notes').insert({ 
        project_id: projectId, 
        user_id: user.id, 
        content: formData.get('content'), 
        is_public: formData.get('isPublic') === 'true' 
    });
    
    revalidatePath(`/dashboard/projects/${projectId}`);
}

export async function deleteProjectNoteAction(noteId: string, projectId: string) {
    const supabase = await createClient(); await supabase.from('project_notes').delete().eq('id', noteId);
    revalidatePath(`/dashboard/projects/${projectId}`);
}

// --- LOCALE & MISC ---

export async function setLanguage(locale: string) {
    (await cookies()).set('mindhub_locale', locale);
}

export async function getDashboardStrategicData() {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    try {
        const [profileReq, subsReq, staleReq, tasksReq, globalTasksReq] = await Promise.all([
            supabase.from('profiles').select('cash_on_hand, personal_cash_on_hand').eq('id', user.id).single(),
            supabase.from('subscriptions').select('cost, category').eq('user_id', user.id).eq('active', true),
            supabase.from('projects').select('id').eq('user_id', user.id).eq('status', 'active').lt('updated_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
            supabase.from('tasks').select('id').eq('user_id', user.id).eq('is_completed', false).eq('due_date', new Date().toISOString().split('T')[0]),
            supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_completed', false).is('project_id', null)
        ]);

        const subs = subsReq.data || [];
        const businessBurn = subs.filter(s => s.category !== 'life').reduce((acc, s) => acc + Number(s.cost || 0), 0);
        const lifeBurn = subs.filter(s => s.category === 'life').reduce((acc, s) => acc + Number(s.cost || 0), 0);
        const totalCash = (profileReq.data?.cash_on_hand || 0) + (profileReq.data?.personal_cash_on_hand || 0);
        const runway = (businessBurn + lifeBurn) > 0 ? parseFloat((totalCash / (businessBurn + lifeBurn)).toFixed(1)) : 0;
        const [allocationData, projectsCount] = await Promise.all([
    getGlobalAllocationAction(),
    supabase.from('projects').select('id', { count: 'exact', head: true }).eq('user_id', user.id).neq('status', 'archived')
]);

return { 
    runway, 
    businessBurn, 
    lifeBurn, 
    staleProjectsCount: staleReq.data?.length || 0, 
    expiringTasksCount: tasksReq.data?.length || 0, 
    globalTasksCount: globalTasksReq?.count || 0, 
    // Nuovi dati di allocazione
    allocation: allocationData,
    activeProjectsCount: projectsCount.count || 0
};
        
    } catch (error) {
        console.error("Strategic Data Error:", error);
        return { runway: 0, businessBurn: 0, lifeBurn: 0, staleProjectsCount: 0, expiringTasksCount: 0, globalTasksCount: 0, renewalsTodayCount: 0 };
    }
}

export async function updateCashAction(amount: number, isPersonal: boolean = false) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false };
    const column = isPersonal ? 'personal_cash_on_hand' : 'cash_on_hand';
    await supabase.from('profiles').update({ [column]: amount }).eq('id', user.id);
    revalidatePath('/dashboard/finances');
    return { success: true };
}

export async function getVaultLogsAction() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase
        .from('vault_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10); // Mostriamo gli ultimi 10 movimenti

    return data || [];
}

/**
 * Aggiorna le preferenze di comunicazione operativa (Email Consents)
 */
// 2. FIX PREFERENCES (Più sicuro e performante)
export async function updateOperationalPreferencesAction(prefs: { email_monday_brief: boolean, email_friday_wrap: boolean }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Identity not verified" };

    // Usiamo l'operatore || di Postgres per fondere il JSONB direttamente nel DB
    // Questo previene la perdita di altre preferenze (es. showSocial, showLife)
    const { error } = await supabase.rpc('merge_profile_preferences', {
        user_id: user.id,
        new_prefs: prefs
    });

    // Se non hai la funzione RPC (consigliata), usiamo questo approccio sicuro:
    const { data: current } = await supabase.from('profiles').select('preferences').eq('id', user.id).single();
    const updated = { ...(current?.preferences || {}), ...prefs };
    
    const { error: updateError } = await supabase
        .from('profiles')
        .update({ preferences: updated })
        .eq('id', user.id);

    if (updateError) return { success: false, error: updateError.message };

    revalidatePath('/dashboard/settings');
    return { success: true };
}

// --- FINANCIAL AUDIT CLEANUP ---

export async function deleteVaultLogAction(logId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const { error, count } = await supabase
        .from('vault_logs')
        .delete()
        .eq('id', logId)
        .eq('user_id', user.id);

    if (error) {
        console.error("Delete error:", error);
        return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/finances');
    return { success: true };
}

export async function purgeVaultLogsAction() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const { error } = await supabase
        .from('vault_logs')
        .delete()
        .eq('user_id', user.id);

    if (error) {
        console.error("Purge error:", error);
        return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/finances');
    return { success: true };
}

export async function togglePinProject(projectId: string, currentStatus: boolean) {
    const supabase = await createClient();
    await supabase.from('projects').update({ is_pinned: !currentStatus }).eq('id', projectId);
    revalidatePath('/dashboard'); // Aggiorna la sidebar ovunque
}

export async function getSidebarCountsAction() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { activeProjects: 0, tasksToday: 0, pendingExpenses: 0 };

    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];

    const [projects, tasks, expenses] = await Promise.all([
        // 1. Progetti Attivi
        supabase.from('projects').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'active'),
        // 2. Task in scadenza OGGI
        supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_completed', false).eq('due_date', today),
        // 3. Spese scadute o in scadenza nei prossimi 7 giorni
        supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('active', true).lte('renewal_date', nextWeekStr)
    ]);

    return {
        activeProjects: projects.count || 0,
        tasksToday: tasks.count || 0,
        pendingExpenses: expenses.count || 0
    };
}

// --- CAPITAL ALLOCATION LOGIC (Punto 4) ---

/**
 * Calcola la salute finanziaria globale: Liquidità vs Budget Promessi
 */
export async function getGlobalAllocationAction() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const [profileReq, projectsReq] = await Promise.all([
        supabase.from('profiles').select('cash_on_hand').eq('id', user.id).single(),
        supabase.from('projects').select('budget').eq('user_id', user.id).neq('status', 'archived')
    ]);

    const totalCash = profileReq.data?.cash_on_hand || 0;
    const totalAllocated = projectsReq.data?.reduce((acc, p) => acc + Number(p.budget || 0), 0) || 0;
    
    return {
        totalCash,
        totalAllocated,
        freeCash: totalCash - totalAllocated,
        isOverAllocated: totalAllocated > totalCash,
        utilizationRate: totalCash > 0 ? Math.round((totalAllocated / totalCash) * 100) : 0
    };
}

/**
 * Calcola il consumo specifico del budget di un progetto
 * Include spese dirette e, solo per i Client, il costo del lavoro (ore * rate)
 */
export async function getProjectFinancialHealthAction(projectId: string) {
    const supabase = await createClient();
    
    const [projectReq, subsReq, logsReq] = await Promise.all([
        supabase.from('projects').select('*').eq('id', projectId).single(),
        supabase.from('subscriptions').select('cost').eq('project_id', projectId).eq('active', true),
        // Recuperiamo solo i log APPROVATI per il calcolo del budget reale
        supabase.from('time_logs').select('cost_impact, minutes').eq('project_id', projectId).eq('status', 'approved')
    ]);

    const project = projectReq.data;
    if (!project) return null;

    // 1. Spese vive (Subscriptions collegate)
    const directExpenses = subsReq.data?.reduce((acc, s) => acc + Number(s.cost || 0), 0) || 0;

    // 2. Costo del lavoro (Somma degli impatti approvati)
    // Se è un progetto Client, usiamo la somma dei cost_impact (tariffe differenziate)
    const laborCost = logsReq.data?.reduce((acc, l) => acc + Number(l.cost_impact || 0), 0) || 0;

    const totalConsumed = directExpenses + laborCost;
    const remainingBudget = (project.budget || 0) - totalConsumed;

    return {
        initialBudget: project.budget || 0,
        totalConsumed,
        remainingBudget,
        burnPercentage: project.budget > 0 ? Math.min(Math.round((totalConsumed / project.budget) * 100), 100) : 0,
        isDepleted: totalConsumed >= (project.budget || 0) && project.budget > 0
    };
}

export async function getFinancesAuditDataAction() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const [logsReq, projectsReq] = await Promise.all([
        supabase.from('vault_logs').select('amount').eq('user_id', user.id).eq('vault_type', 'tax').eq('movement_type', 'in'),
        supabase.from('projects').select('id, title, budget').eq('user_id', user.id).neq('status', 'archived')
    ]);

    const totalTaxIsolated = logsReq.data?.reduce((acc, log) => acc + Number(log.amount), 0) || 0;
    const projectBreakdown = projectsReq.data || [];

    return {
        totalTaxIsolated,
        projectBreakdown
    };
}

export async function getPaginatedNotes(projectId: string, offset: number = 0, limit: number = 20) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('project_notes')
        .select('*') // Solo colonne della tabella note
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
    
    if (error) throw error;
    return data || [];
}

// Alias compatibilità
export const updateCash = updateCashAction;
