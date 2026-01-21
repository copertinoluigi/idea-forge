import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string, inviteCode: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (userId: string, email: string) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (error) throw error;
      if (data) {
        setProfile(data);
      } else {
        const { data: newProfile } = await supabase.from('profiles').insert({
          id: userId, email, display_name: email.split('@')[0], has_completed_setup: false
        }).select().single();
        if (newProfile) setProfile(newProfile);
      }
    } catch (e) {
      console.error("BYOI Auth: Profile Sync Error", e);
    }
  };

  useEffect(() => {
    let mounted = true;
    const timeout = setTimeout(() => { if (mounted && loading) setLoading(false); }, 5000);

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted) {
        if (session?.user) {
          setUser(session.user);
          await loadProfile(session.user.id, session.user.email!);
        }
        setLoading(false);
        clearTimeout(timeout);
      }
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (mounted) {
        if (session?.user) {
          setUser(session.user);
          await loadProfile(session.user.id, session.user.email!);
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      }
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, profile, loading, 
      refreshProfile: async () => { if(user) await loadProfile(user.id, user.email!); },
      signIn: async (e, p) => { await supabase.auth.signInWithPassword({ email: e, password: p }) },
      signUp: async (e, p, d, i) => { 
        const { data: invite } = await supabase.from('invites').select('*').eq('code', i).eq('is_used', false).maybeSingle();
        if (!invite) throw new Error('Invite invalid');
        const { data: auth } = await supabase.auth.signUp({ email: e, password: p });
        if (auth.user) {
          await supabase.from('profiles').insert({ id: auth.user.id, email: e, display_name: d, has_completed_setup: false });
          await supabase.from('invites').update({ is_used: true, used_by: auth.user.id, used_at: new Date().toISOString() }).eq('id', invite.id);
        }
      },
      signOut: async () => { await supabase.auth.signOut(); localStorage.clear(); }
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const c = useContext(AuthContext);
  if (!c) throw new Error("useAuth error");
  return c;
};
