import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  profileLoading: boolean; // Nuovo: separiamo il loading del profilo
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
  const [profileLoading, setProfileLoading] = useState(false);
  
  // Ref per prevenire race conditions
  const isLoadingProfile = useRef(false);
  const loadingTimeout = useRef<NodeJS.Timeout | null>(null);

  const loadProfile = async (userId: string, email: string, isInitialLoad = false) => {
    // Previeni chiamate duplicate
    if (isLoadingProfile.current) {
      console.log('⏭️ BYOI: Profile load già in corso, skip');
      return;
    }

    isLoadingProfile.current = true;
    setProfileLoading(true);
    
    console.log('🔄 BYOI: Profile fetch started per', email);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('❌ BYOI: Profile fetch error', error);
        throw error;
      }

      if (data) {
        console.log('✅ BYOI: Profile caricato', data.display_name);
        setProfile(data);
      } else {
        console.log('🆕 BYOI: Profilo mancante, auto-creazione...');
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
          console.error('❌ BYOI: Auto-creazione profilo fallita', createError);
          throw createError;
        }
        
        console.log('✅ BYOI: Profilo creato', newProfile.display_name);
        setProfile(newProfile);
      }
    } catch (err) {
      console.error('💥 BYOI: Errore critico nel caricamento profilo', err);
      // Non bloccare l'app: l'utente può comunque vedere la UI
      setProfile(null);
    } finally {
      isLoadingProfile.current = false;
      setProfileLoading(false);
      
      // Se è il caricamento iniziale, sblocchiamo il loading globale
      if (isInitialLoad) {
        console.log('🏁 BYOI: Auth loading completato');
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      console.log('🚀 BYOI: Init auth started');
      
      // Timeout di sicurezza: dopo 5 secondi sblocchiamo comunque
      loadingTimeout.current = setTimeout(() => {
        if (mounted) {
          console.warn('⏱️ BYOI: Timeout raggiunto, forzatura loading=false');
          setLoading(false);
        }
      }, 5000);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (session?.user) {
          console.log('👤 BYOI: Sessione trovata per', session.user.email);
          setUser(session.user);
          // CRITICO: isInitialLoad=true per sbloccare loading dopo fetch
          await loadProfile(session.user.id, session.user.email!, true);
        } else {
          console.log('🚫 BYOI: Nessuna sessione attiva');
          setLoading(false);
        }
      } catch (e) {
        console.error('💥 BYOI: Init auth error', e);
        if (mounted) setLoading(false);
      } finally {
        // Pulizia timeout
        if (loadingTimeout.current) {
          clearTimeout(loadingTimeout.current);
        }
      }
    }

    initAuth();

    // Listener per cambio stato (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 BYOI: Auth state change ->', event);
      
      if (!mounted) return;

      // CRITICO: Non ricaricare il profilo se l'evento è INITIAL_SESSION
      // (viene già gestito da initAuth)
      if (event === 'INITIAL_SESSION') {
        console.log('⏭️ BYOI: INITIAL_SESSION già gestita, skip');
        return;
      }

      if (session?.user) {
        setUser(session.user);
        // isInitialLoad=false perché non è il primo caricamento
        await loadProfile(session.user.id, session.user.email!, false);
      } else {
        console.log('👋 BYOI: Logout/session cleared');
        setUser(null);
        setProfile(null);
      }
      
      setLoading(false);
    });

    return () => {
      console.log('🧹 BYOI: AuthContext cleanup');
      mounted = false;
      if (loadingTimeout.current) {
        clearTimeout(loadingTimeout.current);
      }
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, displayName: string, inviteCode: string) => {
    const { data: invite } = await supabase
      .from('invites')
      .select('*')
      .eq('code', inviteCode)
      .eq('is_used', false)
      .maybeSingle();

    if (!invite) throw new Error('Codice invito non valido o già usato');

    const { data: authData, error: authErr } = await supabase.auth.signUp({ email, password });
    if (authErr) throw authErr;
    if (!authData.user) throw new Error('Signup fallito');

    const { error: pErr } = await supabase.from('profiles').insert({
      id: authData.user.id,
      email,
      display_name: displayName,
      has_completed_setup: false
    });
    if (pErr) throw pErr;

    await supabase.from('invites').update({ 
      is_used: true, 
      used_by: authData.user.id, 
      used_at: new Date().toISOString() 
    }).eq('id', invite.id);
  };

  const signOut = async () => {
    console.log('👋 BYOI: Logout triggered');
    await supabase.auth.signOut();
    localStorage.clear();
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) {
      console.log('🔄 BYOI: Manual profile refresh');
      await loadProfile(user.id, user.email!, false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      profileLoading,
      signIn, 
      signUp, 
      signOut, 
      refreshProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
