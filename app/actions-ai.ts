'use server'
import { createClient } from '@/lib/supabase/server'
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { revalidatePath } from 'next/cache'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const ADMIN_EMAIL = 'copertino.luigi@gmail.com'
const FROM_EMAIL = 'MindHub System <system@mindhub.website>'

export async function generateAnalysis(lang: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  // 1. RECUPERO DATI GRANULARI (v2.1 - Actionable Context)
  const [profileReq, projects, finances, incomes, tasks] = await Promise.all([
    supabase.from('profiles').select('credits, cash_on_hand, personal_cash_on_hand, tax_reserve, email').eq('id', user.id).single(),
    supabase.from('projects').select('id, title, status, progress, budget, description').eq('user_id', user.id).neq('status', 'archived'),
    supabase.from('subscriptions').select('title, cost, category, project_id').eq('user_id', user.id).eq('active', true),
    supabase.from('incomes').select('title, amount_gross, tax_percentage, category, project_id').eq('user_id', user.id).eq('status', 'expected'),
    supabase.from('tasks').select('title, priority, due_date, project_id').eq('user_id', user.id).eq('is_completed', false)
  ])

  const profile = profileReq.data
  if (!profile || (profile.credits || 0) < 1) throw new Error("NO_CREDITS")

  // 2. PRE-CALCOLO METRICHE PER IL PROMPT & METADATA BOX
  const bizBurn = finances.data?.filter(s => s.category !== 'life').reduce((acc, s) => acc + Number(s.cost), 0) || 0;
  const lifeBurn = finances.data?.filter(s => s.category === 'life').reduce((acc, s) => acc + Number(s.cost), 0) || 0;
  const totalBurn = bizBurn + lifeBurn;
  const totalCash = (profile.cash_on_hand || 0) + (profile.personal_cash_on_hand || 0);
  const totalRunway = totalBurn > 0 ? (totalCash / totalBurn).toFixed(1) : 'Infinite';
  const projectContext = projects.data?.map(p => ({ id: p.id, title: p.title })) || [];
  const languageName = lang === 'it' ? 'Italian' : (lang === 'es' ? 'Spanish' : 'English');

  const prompt = `
    Role: You are a Senior Strategic Advisor for high-growth founders. 
    Objective: Provide a brutal, data-driven analysis in ${languageName}.

    ANALYSIS METADATA (Visible to user):
    - Analyzed Nodes: ${projectContext.length}
    - System Liquidity: ${totalCash} EUR
    - Total Monthly Burn: ${totalBurn} EUR
    - Operational Runway: ${totalRunway} Months

    FINANCIAL DATA:
    - Business Vault: ${profile.cash_on_hand} EUR (Burn: ${bizBurn})
    - Personal Pocket: ${profile.personal_cash_on_hand} EUR (Burn: ${lifeBurn})
    - Tax Reserve: ${profile.tax_reserve} EUR (Untouchable)
    - Expected Incomes: ${JSON.stringify(incomes.data)}

    OPERATIONAL DATA:
    - Active Projects: ${JSON.stringify(projects.data)}
    - High Priority Tasks: ${JSON.stringify(tasks.data?.filter(t => t.priority === 'high'))}

    STRATEGIC DIRECTIVES:
    1. Financial Integrity: Is personal burn endangering the startup?
    2. Efficiency Audit: Which project has the worst Budget vs Progress ratio?
    3. Operational Risk: Spot "Zombie Projects" (Low activity, high cost).

    OUTPUT FORMAT (Strict Markdown):
    ## 📊 Analysis Context (Metadata)
    *Display the analysis metadata clearly here.*

    ## 🧠 Executive Summary
    ## 💸 Financial Health & Runway Audit
    ## 🏗️ Project ROI & Efficiency
    ## ⚡ Immediate Strategic Tasks
    *Write the advice here.*

    [ACTIONABLE_SUGGESTIONS_START]
    Provide exactly 3 actionable tasks in this STRICT JSON array format:
    [{"title": "Task Name", "project_id": "UUID_OR_NULL", "priority": "high", "reason": "Explain why this is mandatory"}]
    
    CRITICAL RULES FOR project_id:
    1. "reason" field is MANDATORY and must be a descriptive string.
    2. For project-specific tasks, use the UUID from this list: ${JSON.stringify(projectContext)}.
    3. For "Reduce Personal Expenses", "Global Strategy", or "Mindset", use null (without quotes).
    [ACTIONABLE_SUGGESTIONS_END]
  `

  try {
    const { text } = await generateText({
      model: openai('gpt-4o-mini'),
      system: 'You are an objective AI Co-founder. You help founders reduce errors and optimize margins. Use clear, professional language. No fluff.',
      prompt: prompt,
      temperature: 0.1, // Massima precisione analitica
    })

    await Promise.all([
        supabase.from('profiles').update({ credits: profile.credits - 1 }).eq('id', user.id),
        supabase.from('ai_reports').insert({ user_id: user.id, content: text }),
        resend.emails.send({
            from: FROM_EMAIL, to: ADMIN_EMAIL, subject: `🤖 AI Strategy Generated`,
            html: `<p>User <strong>${profile.email}</strong> generated a Strategic Report.</p>`
        })
    ])
    
    revalidatePath('/dashboard'); 
    return text
  } catch (error) {
    console.error(error); throw new Error("AI_SERVICE_ERROR")
  }
}

export async function generateBusinessPlan(projectId: string, lang: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const COST = 5
  const { data: profile } = await supabase.from('profiles').select('credits, email').eq('id', user.id).single()
  if (!profile || (profile.credits || 0) < COST) throw new Error("NO_CREDITS")

  const { data: project } = await supabase.from('projects').select('*').eq('id', projectId).single()
  const { data: tasks } = await supabase.from('tasks').select('*').eq('project_id', projectId)
  if (!project) throw new Error("Project not found")

  const languageName = lang === 'it' ? 'Italian' : (lang === 'es' ? 'Spanish' : 'English');
  const prompt = `Write a professional Business Plan for ${project.title} in ${languageName}. 
  Context: ${project.description}, Progress: ${project.progress}%, Tasks: ${JSON.stringify(tasks)}. Focus on market positioning and operational scaling. HTML format only.`

  try {
    const { text } = await generateText({
      model: openai('gpt-4o-mini'), 
      prompt: prompt,
      temperature: 0.5,
    })

    await Promise.all([
        supabase.from('profiles').update({ credits: profile.credits - COST }).eq('id', user.id),
        resend.emails.send({
            from: FROM_EMAIL, to: ADMIN_EMAIL, subject: `📄 Business Plan Generated`,
            html: `<p><strong>${profile.email}</strong> generated a Business Plan for: ${project.title}.</p>`
        })
    ])
    
    revalidatePath('/dashboard');
    const cleanedText = text.replace(/```html/g, '').replace(/```/g, '')
    return `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'></head><body style="font-family: Arial;">${cleanedText}</body></html>`
  } catch (error) {
    console.error(error); throw new Error("AI_SERVICE_ERROR")
  }
}

        // Funzione riassunto chat

export async function generateChatSummary(projectId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const COST = 1
    const { data: profile } = await supabase.from('profiles').select('credits, email').eq('id', user.id).single()
    if (!profile || (profile.credits || 0) < COST) throw new Error("NO_CREDITS")

    // Recuperiamo gli ultimi 50 messaggi per il contesto
    const { data: messages } = await supabase
        .from('project_messages')
        .select('content, created_at, message_type')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(50)

    if (!messages || messages.length === 0) throw new Error("NO_MESSAGES")

    const chatContext = messages.reverse().map(m => `[${m.message_type}] ${m.content}`).join('\n')

    const prompt = `Analyze the following project chat history and provide a concise strategic summary. 
    Highlight decisions made, pending blockers, and next steps. 
    Format: Bullet points. Max 150 words.
    
    CHAT HISTORY:
    ${chatContext}`

    try {
        const { text } = await generateText({
            model: openai('gpt-4o-mini'),
            prompt: prompt,
            temperature: 0.3,
        })

        // Sottraiamo il credito e salviamo il summary come messaggio AI nella chat
        await Promise.all([
            supabase.from('profiles').update({ credits: profile.credits - COST }).eq('id', user.id),
            supabase.from('project_messages').insert({
                project_id: projectId,
                user_id: user.id,
                content: `🤖 **AI STRATEGIC SUMMARY:**\n\n${text}`,
                message_type: 'ai_summary'
            })
        ])

        revalidatePath(`/dashboard/projects/${projectId}`)
        return { success: true }
    } catch (error) {
        console.error(error); throw new Error("AI_SERVICE_ERROR")
    }
}
