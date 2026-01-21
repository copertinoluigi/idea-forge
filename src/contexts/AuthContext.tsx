import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  profileLoading: boolean;
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

  const loadProfile = async (userId: string, email: string) => {
    if (profileLoading) return; // Evita chiamate doppie
    
    setProfileLoading(true);
    console.log('🔄 BYOI: Richiesta profilo avviata per:', userId);
    
    try {
      // Timeout forzato di 3 secondi
      const { data, error } = await Promise.race([
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout DB')), 3000))
      ]) as any;

      if (error) throw error;

      if (data) {
        console.log('✅ BYOI: Profilo ricevuto:', data.display_name);
        setProfile(data);
      } else {
        console.log('🎭 BYOI: Profilo mancante, generazione Mock...');
        setProfile({
          id: userId,
          email: email,
          display_name: email.split('@')[0],
          has_completed_setup: true, // Bypass per debug
          encrypted_api_key: null,
          ai_provider: 'google-flash',
          mcp_endpoint: null,
          last_room_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error('⚠️ BYOI: Errore o Timeout Profilo:', err);
    } finally {
      setProfileLoading(false);
      // FONDAMENTALE: Sblocchiamo l'app in ogni caso
      setLoading(false); 
      console.log('🏁 BYOI: Stato Loading sbloccato');
    }
  };

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      console.log('🚀 BYOI: Inizializzazione sessione...');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!mounted) return;

      if (session?.user) {
        console.log('👤 BYOI: Utente trovato:', session.user.email);
        setUser(session.user);
        // Lanciamo loadProfile ma NON mettiamo await, così non blocchiamo l'init
        loadProfile(session.user.id, session.user.email!);
        
        // Sblocchiamo la UI dopo un breve istante a prescindere dal profilo
        setTimeout(() => { if (mounted) setLoading(false); }, 500);
      } else {
        console.log('🚫 BYOI: Nessuna sessione');
        setLoading(false);
      }
    }

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔔 BYOI: Evento Auth:', event);
      if (!mounted) return;

      if (session?.user) {
        setUser(session.user);
        loadProfile(session.user.id, session.user.email!);
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, displayName: string, inviteCode: string) => {
    const { data: invite } = await supabase.from('invites').select('*').eq('code', inviteCode).eq('is_used', false).maybeSingle();
    if (!invite) throw new Error('Invite code non valido');

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error || !data.user) throw error || new Error('Signup error');

    await supabase.from('profiles').insert({ id: data.user.id, email, display_name: displayName });
    await supabase.from('invites').update({ is_used: true, used_by: data.user.id, used_at: new Date().toISOString() }).eq('id', invite.id);
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
    <AuthContext.Provider value={{ user, profile, loading, profileLoading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
