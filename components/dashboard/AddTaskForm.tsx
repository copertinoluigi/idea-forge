'use client'
import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { addTask } from '@/app/actions'

// Accetta "dict" come prop
export default function AddTaskForm({ projectId, userId, dict }: { projectId: string, userId: string, dict: any }) {
  const formRef = useRef<HTMLFormElement>(null)

  return (
    <form 
        action={async (formData) => {
            await addTask(formData)
            formRef.current?.reset()
        }} 
        ref={formRef}
        className="flex flex-col md:flex-row gap-3"
    >
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="userId" value={userId} />
        
        <div className="flex-1">
            <input 
                name="title" 
                required 
                placeholder={dict.add_placeholder} // Traduzione
                className="w-full rounded-md border p-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" 
            />
        </div>
        
        <div className="flex gap-2">
            <input 
                name="dueDate" 
                type="date" 
                className="rounded-md border p-2.5 text-sm bg-white text-gray-600 focus:ring-2 focus:ring-primary/20 outline-none"
            />
            <select 
                name="priority" 
                className="rounded-md border p-2.5 text-sm bg-white text-gray-600 focus:ring-2 focus:ring-primary/20 outline-none"
            >
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="low">Low</option>
            </select>
            <Button type="submit">
                <Plus className="mr-2 h-4 w-4" /> {dict.add}
            </Button>
        </div>
    </form>
  )
}
