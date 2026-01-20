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
        // Creazione forzata se il profilo manca (Auto-Repair)
        console.log("Auth: Profilo non trovato, creazione di emergenza...");
        const { data: newProfile, error: createError } = await supabase.from('profiles').insert({
          id: userId, 
          email, 
          display_name: email.split('@')[0], 
          has_completed_setup: false
        }).select().single();
        
        if (!createError) setProfile(newProfile);
      }
    } catch (e) {
      console.error("AuthContext: Errore durante la sincronizzazione profilo", e);
    }
  };

  useEffect(() => {
    let mounted = true;

    async function getInitialSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted) {
        if (session?.user) {
          setUser(session.user);
          await syncProfile(session.user.id, session.user.email!);
        }
        setLoading(false);
      }
    }

    getInitialSession();

    // FIX: Aggiunto underscore a _event per evitare l'errore TS6133
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

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, displayName: string, inviteCode: string) => {
    const { data: invite } = await supabase.from('invites').select('*').eq('code', inviteCode).eq('is_used', false).maybeSingle();
    if (!invite) throw new Error('Codice invito non valido o già usato.');

    const { data: authData, error: authErr } = await supabase.auth.signUp({ email, password });
    if (authErr) throw authErr;
    if (!authData.user) throw new Error('Creazione account fallita.');

    const { error: pErr } = await supabase.from('profiles').insert({
      id: authData.user.id,
      email,
      display_name: displayName,
      has_completed_setup: false
    });
    if (pErr) throw pErr;

    await supabase.from('invites').update({ is_used: true, used_by: authData.user.id, used_at: new Date().toISOString() }).eq('id', invite.id);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      refreshProfile: async () => { if(user) await syncProfile(user.id, user.email!); }, 
      signIn, 
      signUp, 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth deve essere usato dentro AuthProvider');
  return context;
}
