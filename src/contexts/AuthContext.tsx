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

  const syncProfile = async (userId: string, email: string) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (error) throw error;
      
      if (data) {
        setProfile(data);
      } else {
        // Auto-creazione se il profilo manca
        const { data: newProfile, error: createError } = await supabase.from('profiles').insert({
          id: userId, email, display_name: email.split('@')[0], has_completed_setup: false
        }).select().single();
        if (!createError) setProfile(newProfile);
      }
    } catch (e) {
      console.error("BYOI Auth: Sync Error", e);
    }
  };

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted) {
        if (session?.user) {
          setUser(session.user);
          // Aspettiamo il profilo PRIMA di togliere il caricamento
          await loadProfile(session.user.id, session.user.email!);
        }
        setLoading(false);
      }
    }

    initAuth();

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

    // Ascolto cambiamenti
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (mounted) {
        if (session?.user) {
          setUser(session.user);
          await syncProfile(session.user.id, session.user.email!);
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      }
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  const refreshProfile = async () => {
    if (user) await syncProfile(user.id, user.email!);
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, displayName: string, inviteCode: string) => {
    const { data: invite } = await supabase.from('invites').select('*').eq('code', inviteCode).eq('is_used', false).maybeSingle();
    if (!invite) throw new Error('Invito non valido o già usato.');
    const { data: auth, error: aErr } = await supabase.auth.signUp({ email, password });
    if (aErr || !auth.user) throw aErr || new Error('Signup fallito');
    await supabase.from('profiles').insert({ id: auth.user.id, email, display_name: displayName });
    await supabase.from('invites').update({ is_used: true, used_by: auth.user.id, used_at: new Date().toISOString() }).eq('id', invite.id);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const c = useContext(AuthContext);
  if (!c) throw new Error("useAuth error");
  return c;
};
