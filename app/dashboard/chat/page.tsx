'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getRooms, getRoomMessages, sendMessage, createRoom, joinRoom, getRoomSummaries, generateAISummary } from '@/app/actions-rooms'
import { MessageSquare, Plus, Hash, Lock, Send, Sparkles, Users, Menu, X, BookOpen, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import ChatMessage from '@/components/chat/ChatMessage'
import SummarySidebar from '@/components/chat/SummarySidebar'
import AddRoomModal from '@/components/chat/AddRoomModal'

interface Room {
  id: string
  name: string
  description: string
  is_private: boolean
  join_code: string | null
  created_at: string
}

interface Message {
  id: string
  user_id: string
  room_id: string
  content: string
  is_system: boolean
  attachments: any
  created_at: string
  profiles?: { display_name?: string; first_name?: string } | null
}

export default function ChatPage() {
  const supabase = createClient()
  const [rooms, setRooms] = useState<Room[]>([])
  const [activeRoom, setActiveRoom] = useState<Room | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)
  const [showAddRoom, setShowAddRoom] = useState(false)
  const [showRoomList, setShowRoomList] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Load rooms and user
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)
      const roomList = await getRooms()
      setRooms(roomList)
      if (roomList.length > 0) {
        setActiveRoom(roomList[0])
      }
      setLoading(false)
    }
    init()
  }, [])

  // Load messages when room changes
  useEffect(() => {
    if (!activeRoom) return
    const loadMessages = async () => {
      const msgs = await getRoomMessages(activeRoom.id)
      setMessages(msgs)
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
    loadMessages()
  }, [activeRoom?.id])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px'
    }
  }, [input])

  const handleSend = async () => {
    if (!input.trim() || !activeRoom || sending) return
    const content = input.trim()
    setInput('')
    setSending(true)

    // Optimistic update
    const tempMsg: Message = {
      id: `temp-${Date.now()}`,
      user_id: userId || '',
      room_id: activeRoom.id,
      content,
      is_system: false,
      attachments: null,
      created_at: new Date().toISOString(),
      profiles: { first_name: 'You' },
    }
    setMessages(prev => [...prev, tempMsg])
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)

    await sendMessage(activeRoom.id, content)

    // If private room, generate AI response
    if (activeRoom.is_private) {
      const aiResponse = generateMockAIResponse(content)
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        user_id: userId || '',
        room_id: activeRoom.id,
        content: aiResponse,
        is_system: true,
        attachments: null,
        created_at: new Date().toISOString(),
        profiles: null,
      }
      // Simulate typing delay
      setTimeout(() => {
        setMessages(prev => [...prev, aiMsg])
        sendMessage(activeRoom.id, aiResponse, true)
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      }, 800)
    }

    setSending(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleRoomCreated = async () => {
    setShowAddRoom(false)
    const roomList = await getRooms()
    setRooms(roomList)
    if (roomList.length > 0) {
      setActiveRoom(roomList[roomList.length - 1])
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] -m-4 md:-m-8 -mt-24 md:-mt-8 rounded-none overflow-hidden bg-white">
      {/* Room List - Desktop */}
      <div className="hidden md:flex w-72 flex-col bg-slate-50 border-r border-slate-200">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-black text-sm uppercase tracking-widest text-slate-900">Rooms</h2>
          <Button size="sm" variant="ghost" onClick={() => setShowAddRoom(true)} className="h-8 w-8 p-0">
            <Plus size={16} />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {rooms.map(room => (
            <button
              key={room.id}
              onClick={() => setActiveRoom(room)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all",
                activeRoom?.id === room.id
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-slate-600 hover:bg-slate-100"
              )}
            >
              {room.is_private ? <Lock size={16} className="shrink-0 opacity-50" /> : <Hash size={16} className="shrink-0 opacity-50" />}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold truncate">{room.name}</p>
                {room.description && <p className="text-[10px] text-slate-400 truncate mt-0.5">{room.description}</p>}
              </div>
            </button>
          ))}
          {rooms.length === 0 && (
            <div className="text-center py-10 px-4">
              <MessageSquare className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No rooms yet</p>
              <Button size="sm" onClick={() => setShowAddRoom(true)} className="mt-4">Create Room</Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Room List Toggle */}
      <div className="md:hidden fixed top-20 left-4 z-40">
        <Button size="sm" variant="outline" onClick={() => setShowRoomList(!showRoomList)} className="h-10 w-10 p-0 rounded-xl shadow-lg bg-white">
          {showRoomList ? <X size={18} /> : <Menu size={18} />}
        </Button>
      </div>

      {/* Mobile Room List Overlay */}
      {showRoomList && (
        <>
          <div className="fixed inset-0 bg-black/30 z-30 md:hidden" onClick={() => setShowRoomList(false)} />
          <div className="fixed inset-y-0 left-0 z-40 w-72 bg-slate-50 shadow-2xl md:hidden pt-16">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="font-black text-sm uppercase tracking-widest text-slate-900">Rooms</h2>
              <Button size="sm" variant="ghost" onClick={() => setShowAddRoom(true)} className="h-8 w-8 p-0">
                <Plus size={16} />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {rooms.map(room => (
                <button
                  key={room.id}
                  onClick={() => { setActiveRoom(room); setShowRoomList(false) }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all",
                    activeRoom?.id === room.id ? "bg-primary/10 text-primary" : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  {room.is_private ? <Lock size={16} /> : <Hash size={16} />}
                  <span className="text-sm font-bold truncate">{room.name}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeRoom ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
              <div className="flex items-center gap-3">
                {activeRoom.is_private ? <Lock size={18} className="text-slate-400" /> : <Hash size={18} className="text-primary" />}
                <div>
                  <h3 className="font-black text-sm uppercase tracking-tight text-slate-900">{activeRoom.name}</h3>
                  {activeRoom.description && <p className="text-[10px] text-slate-400">{activeRoom.description}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {activeRoom.join_code && (
                  <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md uppercase tracking-wider">
                    Code: {activeRoom.join_code}
                  </span>
                )}
                <Button variant="ghost" size="sm" onClick={() => setShowSidebar(!showSidebar)} className="h-8 px-3">
                  <BookOpen size={14} className="mr-1.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Summaries</span>
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-1">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Sparkles className="h-12 w-12 text-slate-200 mb-4" />
                  <p className="text-sm font-bold text-slate-400">Start a conversation</p>
                  <p className="text-xs text-slate-300 mt-1">
                    {activeRoom.is_private ? 'Messages here get AI responses automatically.' : 'Invite your team with the room code.'}
                  </p>
                </div>
              )}
              {messages.map((msg, i) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  isOwn={msg.user_id === userId}
                  showAvatar={i === 0 || messages[i - 1]?.user_id !== msg.user_id || messages[i - 1]?.is_system !== msg.is_system}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-slate-200 bg-white p-4">
              <div className="flex items-end gap-3 max-w-4xl mx-auto">
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={activeRoom.is_private ? "Ask the AI anything..." : "Type a message..."}
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-slate-400 max-h-[200px]"
                    rows={1}
                  />
                </div>
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  className="h-11 w-11 rounded-xl p-0 shrink-0"
                >
                  {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <MessageSquare className="h-16 w-16 text-slate-200 mb-6" />
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">BYOI Chat</h3>
            <p className="text-sm text-slate-400 mt-2 max-w-md">Create a room to start collaborating with your team or chat privately with AI.</p>
            <Button onClick={() => setShowAddRoom(true)} className="mt-6">
              <Plus size={16} className="mr-2" /> Create First Room
            </Button>
          </div>
        )}
      </div>

      {/* Summary Sidebar */}
      {showSidebar && activeRoom && (
        <SummarySidebar
          roomId={activeRoom.id}
          onClose={() => setShowSidebar(false)}
          onGenerate={async (mode) => {
            const messageIds = messages.map(m => m.id)
            return generateAISummary(activeRoom.id, messageIds, mode)
          }}
        />
      )}

      {/* Add Room Modal */}
      {showAddRoom && (
        <AddRoomModal
          onClose={() => setShowAddRoom(false)}
          onSuccess={handleRoomCreated}
        />
      )}
    </div>
  )
}

// Mock AI response generator
function generateMockAIResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase()

  if (lower.includes('help') || lower.includes('aiut')) {
    return "I'm here to help! Here's what I can assist with:\n\n1. **Code Architecture** — Design patterns, database schemas, API design\n2. **Business Strategy** — Go-to-market, pricing, competitive analysis\n3. **Content Creation** — Blog posts, documentation, marketing copy\n4. **Problem Solving** — Debug issues, brainstorm solutions, evaluate trade-offs\n\nWhat would you like to work on?"
  }

  if (lower.includes('database') || lower.includes('schema') || lower.includes('sql')) {
    return "Great question about databases! Here's a quick recommendation:\n\n```sql\n-- Start with a clean, normalized schema\nCREATE TABLE users (\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  email TEXT UNIQUE NOT NULL,\n  created_at TIMESTAMPTZ DEFAULT now()\n);\n```\n\nKey principles:\n- Use UUIDs for primary keys\n- Always add `created_at` timestamps\n- Enable RLS for multi-tenant security\n- Index foreign keys\n\nWant me to design a specific schema for your use case?"
  }

  if (lower.includes('budget') || lower.includes('cost') || lower.includes('spesa')) {
    return "Here's a framework for managing startup costs:\n\n## The 3-Vault System\n1. **Business Vault** — Operating expenses, SaaS subscriptions, tools\n2. **Tax Reserve** — Set aside 22-25% of every income\n3. **Personal Vault** — Your safety net\n\n## Rule of Thumb\n- Keep 6 months runway minimum\n- Track burn rate monthly\n- Review every subscription quarterly\n\nYour current burn rate and runway are visible in the **Finances** section of your dashboard."
  }

  return `I understand you're asking about: *"${userMessage.substring(0, 100)}${userMessage.length > 100 ? '...' : ''}"*\n\nHere's my analysis:\n\n1. **Key Insight**: This is an interesting area to explore. Let me break it down.\n2. **Recommendation**: Start with a minimal viable approach and iterate.\n3. **Next Steps**: Define the scope, set milestones, and track progress.\n\nWant me to dive deeper into any of these points?`
}
