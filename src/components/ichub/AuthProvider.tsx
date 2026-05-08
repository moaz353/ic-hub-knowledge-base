import { useState, useEffect, createContext, useContext, useCallback, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  username: string | null;
  loading: boolean;
  // Back-compat shims for legacy GitHub-token callers:
  hasToken: boolean;
  requireToken: () => Promise<string | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  username: null,
  loading: true,
  hasToken: false,
  requireToken: async () => null,
  logout: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up listener FIRST
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        // Defer profile fetch
        setTimeout(async () => {
          const { data } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', sess.user.id)
            .maybeSingle();
          setUsername(data?.username ?? null);
        }, 0);
      } else {
        setUsername(null);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  // Back-compat: any code calling requireToken() now just checks auth state.
  const requireToken = useCallback(async (): Promise<string | null> => {
    const { data } = await supabase.auth.getSession();
    return data.session ? 'authenticated' : null;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user, session, username, loading,
        hasToken: !!session,
        requireToken,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
