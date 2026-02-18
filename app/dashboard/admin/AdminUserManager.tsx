'use client'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, ShieldCheck, Shield, Coins, Plus, Ban, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { toggleBan, toggleAdminRole, addCredits } from '@/app/actions'
import { toast } from 'sonner'

export default function AdminUserManager({ users }: { users: any[] }) {
  const [selectedUserId, setSelectedUserId] = useState<string>("")

  const selectedUser = users.find(u => u.id === selectedUserId)

  // Gestori per le azioni con Toast di feedback
  const handleAddCredits = async (formData: FormData) => {
    await addCredits(formData)
    toast.success("Credits added successfully")
  }

  const handleToggleAdmin = async (userId: string, status: boolean) => {
      await toggleAdminRole(userId, status)
      toast.success(status ? "Admin rights revoked" : "User promoted to Admin")
  }

  const handleToggleBan = async (userId: string, status: boolean) => {
      await toggleBan(userId, status)
      toast.warning(status ? "User unbanned" : "User BANNED")
  }

  return (
    <Card className="h-full">
        <CardHeader className="border-b bg-gray-50/50 pb-4">
            <CardTitle className="flex items-center gap-2 mb-4">
                <Users className="h-5 w-5 text-indigo-600" /> User Management
            </CardTitle>
            
            {/* SELEZIONE UTENTE */}
            <div className="relative">
                <select 
                    className="w-full p-3 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                >
                    <option value="" disabled>Select a user to manage...</option>
                    {users.map(u => (
                        <option key={u.id} value={u.id}>
                            {u.email} ({u.first_name} {u.last_name}) {u.is_admin ? '[ADMIN]' : ''} {u.is_banned ? '[BANNED]' : ''}
                        </option>
                    ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
            </div>
        </CardHeader>

        <CardContent className="p-6">
            {!selectedUser ? (
                <div className="flex flex-col items-center justify-center h-[300px] text-gray-400 border-2 border-dashed rounded-xl">
                    <Users className="h-10 w-10 mb-2 opacity-20" />
                    <p>Select a user from the dropdown above</p>
                </div>
            ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                    
                    {/* INFO HEADER */}
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900">{selectedUser.first_name} {selectedUser.last_name}</h3>
                            <p className="text-gray-500 font-mono text-sm mt-1">{selectedUser.email}</p>
                            <p className="text-xs text-gray-400 mt-1">ID: {selectedUser.id}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            {selectedUser.is_admin && <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full flex items-center gap-1"><ShieldCheck className="h-3 w-3"/> ADMIN</span>}
                            {selectedUser.is_banned ? 
                                <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full flex items-center gap-1"><Ban className="h-3 w-3"/> BANNED</span> :
                                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1"><CheckCircle2 className="h-3 w-3"/> ACTIVE</span>
                            }
                        </div>
                    </div>

                    <div className="border-t border-gray-100 my-4"></div>

                    {/* ACTIONS GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* CREDITS MANAGER */}
                        <div className="bg-yellow-50/50 border border-yellow-100 p-4 rounded-xl">
                            <h4 className="text-sm font-bold text-yellow-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Coins className="h-4 w-4" /> Credits Balance
                            </h4>
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-3xl font-bold text-gray-900">{selectedUser.credits || 0}</span>
                                <span className="text-xs text-gray-500">Available Credits</span>
                            </div>
                            <form action={handleAddCredits} className="flex gap-2">
                                <input type="hidden" name="userId" value={selectedUser.id} />
                                <input name="amount" type="number" defaultValue="10" className="w-20 p-2 text-sm border rounded-md focus:ring-yellow-500 focus:border-yellow-500" />
                                <Button type="submit" size="sm" className="bg-yellow-600 hover:bg-yellow-700 text-white flex-1">
                                    <Plus className="h-4 w-4 mr-1" /> Add Credits
                                </Button>
                            </form>
                        </div>

                        {/* SECURITY ACTIONS */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Security Actions</h4>
                            
                            <form action={async () => await handleToggleAdmin(selectedUser.id, selectedUser.is_admin)}>
                                <Button variant="outline" className="w-full justify-start border-purple-200 text-purple-700 hover:bg-purple-50">
                                    <Shield className="h-4 w-4 mr-2" /> 
                                    {selectedUser.is_admin ? "Revoke Admin Rights" : "Promote to Admin"}
                                </Button>
                            </form>

                            <form action={async () => await handleToggleBan(selectedUser.id, selectedUser.is_banned)}>
                                <Button variant="outline" className={`w-full justify-start ${selectedUser.is_banned ? "border-green-200 text-green-700 hover:bg-green-50" : "border-red-200 text-red-600 hover:bg-red-50"}`}>
                                    {selectedUser.is_banned ? <CheckCircle2 className="h-4 w-4 mr-2" /> : <AlertTriangle className="h-4 w-4 mr-2" />}
                                    {selectedUser.is_banned ? "Unban User" : "Ban User Access"}
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </CardContent>
    </Card>
  )
}
