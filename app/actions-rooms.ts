'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getRooms() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Get rooms where user is a member
  const { data: memberships } = await supabase
    .from('room_members')
    .select('room_id')
    .eq('user_id', user.id)

  if (!memberships || memberships.length === 0) return []

  const roomIds = memberships.map((m: any) => m.room_id)
  const { data: rooms } = await supabase
    .from('rooms')
    .select('*')
    .in('id', roomIds)
    .order('created_at', { ascending: true })

  return rooms || []
}

export async function getRoomMessages(roomId: string) {
  const supabase = await createClient()
  const { data: messages } = await supabase
    .from('messages')
    .select('*, profiles(display_name, first_name)')
    .eq('room_id', roomId)
    .order('created_at', { ascending: true })

  return messages || []
}

export async function sendMessage(roomId: string, content: string, isSystem: boolean = false) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('messages')
    .insert({
      room_id: roomId,
      user_id: user.id,
      content,
      is_system: isSystem,
      attachments: null,
    })
    .select()
    .single()

  revalidatePath('/dashboard/chat')
  return data
}

export async function createRoom(name: string, description: string, isPrivate: boolean = false) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const joinCode = isPrivate ? null : Math.random().toString(36).substring(2, 8).toUpperCase()

  const { data: room } = await supabase
    .from('rooms')
    .insert({
      name,
      description,
      created_by: user.id,
      is_private: isPrivate,
      join_code: joinCode,
      ai_provider: null,
      encrypted_api_key: null,
      mcp_endpoint: null,
    })
    .select()
    .single()

  if (room) {
    await supabase.from('room_members').insert({
      room_id: room.id,
      user_id: user.id,
      user_email: user.email,
      role: 'owner',
    })
  }

  revalidatePath('/dashboard/chat')
  return room
}

export async function joinRoom(joinCode: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: rooms } = await supabase
    .from('rooms')
    .select('*')
    .eq('join_code', joinCode)

  if (!rooms || rooms.length === 0) return { error: 'Room not found' }

  const room = rooms[0]

  // Check if already a member
  const { data: existing } = await supabase
    .from('room_members')
    .select('*')
    .eq('room_id', room.id)
    .eq('user_id', user.id)

  if (existing && existing.length > 0) return { error: 'Already a member' }

  await supabase.from('room_members').insert({
    room_id: room.id,
    user_id: user.id,
    user_email: user.email,
    role: 'member',
  })

  revalidatePath('/dashboard/chat')
  return { room }
}

export async function getRoomMembers(roomId: string) {
  const supabase = await createClient()
  const { data: members } = await supabase
    .from('room_members')
    .select('*, profiles(display_name, first_name, avatar_url)')
    .eq('room_id', roomId)

  return members || []
}

export async function getRoomSummaries(roomId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('summaries')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: false })

  return data || []
}

export async function saveSummary(roomId: string, title: string, content: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('summaries')
    .insert({ room_id: roomId, title, content })
    .select()
    .single()

  revalidatePath('/dashboard/chat')
  return data
}

export async function generateAISummary(roomId: string, messageIds: string[], mode: 'snapshot' | 'simple') {
  // In mock mode, return a pre-built summary
  if (process.env.NEXT_PUBLIC_USE_MOCKS === 'true') {
    const title = `${mode === 'snapshot' ? 'Snapshot' : 'Recap'} — ${new Date().toLocaleDateString('it-IT')}`
    const content = mode === 'snapshot'
      ? '## Blueprint\n\n### Obiettivo\nSistematizzare le decisioni emerse dalla conversazione.\n\n### Punti Chiave\n1. Architettura definita con schema condiviso\n2. RLS policies per isolamento dati\n3. Multi-tenant con tenant_id su ogni tabella\n\n### Prossimi Passi\n- Implementare le migration SQL\n- Testare le policy RLS\n- Documentare gli endpoint API'
      : '**Riassunto rapido:** Nella conversazione si è discusso di architettura multi-tenant per SaaS, optando per uno schema condiviso con RLS policies in Supabase. Sono stati definiti i modelli dati principali e le policy di sicurezza.'

    await saveSummary(roomId, title, content)
    return { title, content }
  }

  // Real implementation would call AI here
  return { title: 'Summary', content: 'AI summary generation requires API keys.' }
}
