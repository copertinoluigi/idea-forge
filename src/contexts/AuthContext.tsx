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

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (error) throw error;
      setProfile(data);
      return data;
    } catch (err) {
      console.error("AuthContext: Error loading profile", err);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && mounted) {
        setUser(session.user);
        await loadProfile(session.user.id);
      }
      if (mounted) setLoading(false);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (mounted) {
        if (session?.user) {
          setUser(session.user);
          await loadProfile(session.user.id);
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
    if (user) await loadProfile(user.id);
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, displayName: string, inviteCode: string) => {
    const { data: invite } = await supabase.from('invites').select('*').eq('code', inviteCode).eq('is_used', false).maybeSingle();
    if (!invite) throw new Error('Codice non valido o già usato');

    const { data: authData, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) throw signUpError;
    if (!authData.user) throw new Error('User creation failed');

    const { error: pErr } = await supabase.from('profiles').insert({ id: authData.user.id, email, display_name: displayName });
    if (pErr) throw pErr;

    await supabase.from('invites').update({ is_used: true, used_by: authData.user.id, used_at: new Date().toISOString() }).eq('id', invite.id);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
