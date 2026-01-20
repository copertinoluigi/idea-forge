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
      console.log("AuthContext: Caricamento profilo per", userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.warn("AuthContext: Errore query profilo", error);
        return;
      }

      if (data) {
        setProfile(data);
      } else {
        console.log("AuthContext: Profilo non trovato, auto-creazione...");
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: email,
            display_name: email.split('@')[0],
            has_completed_setup: false
          })
          .select()
          .single();
        
        if (createError) {
          console.error("AuthContext: Errore creazione profilo", createError);
        } else {
          setProfile(newProfile);
        }
      }
    } catch (err) {
      console.error("AuthContext: Eccezione durante loadProfile", err);
    }
  };

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          if (session?.user) {
            setUser(session.user);
            // Non usiamo "await" qui per non bloccare il setLoading(false)
            loadProfile(session.user.id, session.user.email!);
          }
        }
      } catch (e) {
        console.error("AuthContext: Errore inizializzazione", e);
      } finally {
        if (mounted) setLoading(false); // GARANTITO: sblocca lo spinner
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

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, displayName: string, inviteCode: string) => {
    const { data: invite } = await supabase.from('invites').select('*').eq('code', inviteCode).eq('is_used', false).maybeSingle();
    if (!invite) throw new Error('Invito non valido o già usato.');

    const { data: authData, error: authErr } = await supabase.auth.signUp({ email, password });
    if (authErr) throw authErr;
    if (!authData.user) throw new Error('Signup fallito.');

    await supabase.from('profiles').insert({ id: authData.user.id, email, display_name: displayName, has_completed_setup: false });
    await supabase.from('invites').update({ is_used: true, used_by: authData.user.id, used_at: new Date().toISOString() }).eq('id', invite.id);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) await loadProfile(user.id, user.email!);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth deve essere usato dentro AuthProvider');
  return context;
}
