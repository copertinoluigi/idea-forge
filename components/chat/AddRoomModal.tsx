'use client'

import { useState } from 'react'
import { createRoom, joinRoom } from '@/app/actions-rooms'
import { X, Plus, LogIn, Hash, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface AddRoomModalProps {
  onClose: () => void
  onSuccess: () => void
}

type Mode = 'choice' | 'create' | 'join'

export default function AddRoomModal({ onClose, onSuccess }: AddRoomModalProps) {
  const [mode, setMode] = useState<Mode>('choice')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    if (!name.trim()) return setError('Room name is required')
    setLoading(true)
    setError('')
    const room = await createRoom(name, description, isPrivate)
    if (room) {
      onSuccess()
    } else {
      setError('Failed to create room')
    }
    setLoading(false)
  }

  const handleJoin = async () => {
    if (!joinCode.trim()) return setError('Join code is required')
    setLoading(true)
    setError('')
    const result = await joinRoom(joinCode.trim().toUpperCase())
    if ('error' in result && result.error) {
      setError(result.error)
    } else {
      onSuccess()
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 fade-in duration-200">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <X size={18} />
        </button>

        {mode === 'choice' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-lg font-black uppercase tracking-tight text-slate-900">Add Room</h2>
              <p className="text-xs text-slate-400 mt-1">Create a new room or join an existing one</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setMode('create')}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-dashed border-slate-200 hover:border-primary hover:bg-primary/5 transition-all group"
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <Plus size={24} />
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-slate-700">Create</span>
              </button>

              <button
                onClick={() => setMode('join')}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-dashed border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
              >
                <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                  <LogIn size={24} />
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-slate-700">Join</span>
              </button>
            </div>
          </div>
        )}

        {mode === 'create' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight text-slate-900">Create Room</h2>
              <p className="text-xs text-slate-400 mt-1">Set up a new chat room</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Room Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Product Brainstorm"
                  className="rounded-xl"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Description</label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this room about?"
                  className="rounded-xl"
                />
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <button
                  onClick={() => setIsPrivate(!isPrivate)}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors",
                    isPrivate ? "bg-primary" : "bg-slate-300"
                  )}
                >
                  <span className={cn(
                    "inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform mt-0.5",
                    isPrivate ? "translate-x-5 ml-0.5" : "translate-x-0.5"
                  )} />
                </button>
                <div className="flex items-center gap-2">
                  {isPrivate ? <Lock size={14} className="text-primary" /> : <Hash size={14} className="text-slate-400" />}
                  <span className="text-xs font-bold text-slate-700">{isPrivate ? 'Private Console (AI only)' : 'Team Room (shareable)'}</span>
                </div>
              </div>
            </div>

            {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => { setMode('choice'); setError('') }} className="flex-1 rounded-xl">Back</Button>
              <Button onClick={handleCreate} disabled={loading} className="flex-1 rounded-xl">
                {loading ? 'Creating...' : 'Create Room'}
              </Button>
            </div>
          </div>
        )}

        {mode === 'join' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight text-slate-900">Join Room</h2>
              <p className="text-xs text-slate-400 mt-1">Enter the room code to join</p>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Room Code</label>
              <Input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="e.g., BYOI-2026"
                className="rounded-xl text-center font-mono font-bold tracking-widest text-lg"
                maxLength={20}
              />
            </div>

            {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => { setMode('choice'); setError('') }} className="flex-1 rounded-xl">Back</Button>
              <Button onClick={handleJoin} disabled={loading} className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700">
                {loading ? 'Joining...' : 'Join Room'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
