import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ChatMessage } from '@/components/ChatMessage';
import { useToast } from '@/hooks/use-toast';
import {
  Send,
  Sparkles,
  Code,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import type { Database } from '@/lib/database.types';

type Message = Database['public']['Tables']['messages']['Row'] & {
  profiles: {
    display_name: string;
  } | null;
};

interface ChatProps {
  activeRoomId: string | null;
  onRoomChange: (id: string) => void;
  onNavigateToSettings: () => void;
  onSummarize: (selectedMessages: Message[]) => void; // Nota: riceve l'array
  onDevelop: () => void;
  isSelectionModeActive?: boolean;
}

export function Chat({ onNavigateToSettings, onSummarize, onDevelop }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    loadMessages();

    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', payload.new.user_id)
            .single();

          setMessages((prev) => [
            ...prev,
            { ...payload.new, profiles: profile } as Message,
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        profiles (
          display_name
        )
      `)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load messages',
        variant: 'destructive',
      });
      return;
    }

    setMessages(data as Message[]);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    setLoading(true);

    try {
      type MessageInsert = Database['public']['Tables']['messages']['Insert'];
      const messageData: MessageInsert = {
        user_id: user.id,
        content: newMessage.trim(),
      };
      const { error } = await supabase.from('messages').insert(messageData);

      if (error) throw error;

      setNewMessage('');

      const totalMessages = messages.length + 1;
      if (totalMessages % 20 === 0) {
        await createSnapshot(totalMessages);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createSnapshot = async (messageCount: number) => {
    const recentMessages = messages.slice(-20);
    const snapshotData = {
      messages: recentMessages.map((m) => ({
        user: m.profiles?.display_name || 'Unknown',
        content: m.content,
        timestamp: m.created_at,
      })),
    };

    type SnapshotInsert = Database['public']['Tables']['context_snapshots']['Insert'];
    const snapshot: SnapshotInsert = {
      snapshot_data: snapshotData,
      message_count: messageCount,
    };
    await supabase.from('context_snapshots').insert(snapshot);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to sign out',
        variant: 'destructive',
      });
    }
  };

  const MenuContent = () => (
    <div className="space-y-2">
      <div className="px-4 py-3 bg-gray-800/50 rounded-lg border border-gray-700">
        <p className="text-sm font-medium text-white">{profile?.display_name}</p>
        <p className="text-xs text-gray-400">{profile?.email}</p>
      </div>
      <Button
        onClick={onSummarize}
        className="w-full justify-start bg-violet-600 hover:bg-violet-500 text-white"
      >
        <Sparkles className="mr-2 h-4 w-4" />
        Summarize Chat
      </Button>
      <Button
        onClick={onDevelop}
        className="w-full justify-start bg-green-600 hover:bg-green-500 text-white"
      >
        <Code className="mr-2 h-4 w-4" />
        Develop
      </Button>
      <Button
        onClick={onNavigateToSettings}
        variant="outline"
        className="w-full justify-start border-gray-700 bg-gray-800/50 text-white hover:bg-gray-800"
      >
        <Settings className="mr-2 h-4 w-4" />
        Settings
      </Button>
      <Button
        onClick={handleSignOut}
        variant="outline"
        className="w-full justify-start border-gray-700 bg-gray-800/50 text-white hover:bg-gray-800"
      >
        <LogOut className="mr-2 h-4 w-4" />
        Sign Out
      </Button>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
            <Sparkles className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">IdeaForge</h1>
            <p className="text-xs text-gray-400">Collaborative AI Workspace</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <Button
            onClick={onSummarize}
            size="sm"
            className="bg-violet-600 hover:bg-violet-500 text-white"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Summarize
          </Button>
          <Button
            onClick={onDevelop}
            size="sm"
            className="bg-green-600 hover:bg-green-500 text-white"
          >
            <Code className="mr-2 h-4 w-4" />
            Develop
          </Button>
          <Button
            onClick={onNavigateToSettings}
            size="sm"
            variant="outline"
            className="border-gray-700 bg-gray-800/50 text-white hover:bg-gray-800"
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            onClick={handleSignOut}
            size="sm"
            variant="outline"
            className="border-gray-700 bg-gray-800/50 text-white hover:bg-gray-800"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>

        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="md:hidden border-gray-700 bg-gray-800/50 text-white"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-gray-900 border-gray-800">
            <MenuContent />
          </SheetContent>
        </Sheet>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="p-4 rounded-full bg-violet-500/10 border border-violet-500/20 inline-block">
                <Sparkles className="h-8 w-8 text-violet-400" />
              </div>
              <h3 className="text-xl font-semibold text-white">Start Brainstorming</h3>
              <p className="text-gray-400 max-w-md">
                Share your ideas and transform conversations into real applications with AI
              </p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              isOwn={message.user_id === user?.id}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSend}
        className="border-t border-gray-800 bg-gray-900/80 backdrop-blur-sm p-4"
      >
        <div className="flex gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 resize-none min-h-[44px] max-h-32"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
          />
          <Button
            type="submit"
            disabled={loading || !newMessage.trim()}
            className="bg-violet-600 hover:bg-violet-500 text-white px-6"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </form>
    </div>
  );
}
