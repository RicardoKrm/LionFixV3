'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { User, UserRole } from '@/types';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchProfile = useCallback(async (userId: string, email: string): Promise<User | null> => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!profile) return null;

      return {
        uid: userId,
        email: email,
        name: profile.name,
        role: profile.role as UserRole,
        avatarUrl: profile.avatar_url,
      };
    } catch (e) {
      console.error('fetchProfile failed:', e);
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // 1. Try to restore session from localStorage immediately
    const initialize = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && mounted) {
          const fullUser = await fetchProfile(session.user.id, session.user.email!);
          if (fullUser && mounted) setUser(fullUser);
        }
      } catch (e) {
        console.error('Session initialization failed:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initialize();

    // 2. Listen for auth events
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_IN' && session?.user) {
        const fullUser = await fetchProfile(session.user.id, session.user.email!);
        if (fullUser && mounted) setUser(fullUser);
        if (mounted) setLoading(false);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        // Token was refreshed in background - restore user if lost
        setUser(prev => {
          if (prev) return prev; // Already have user, no need to re-fetch
          // User was lost - fetch it (async, then update)
          fetchProfile(session.user.id, session.user.email!).then(u => {
            if (u && mounted) setUser(u);
          });
          return null;
        });
      } else if (event === 'SIGNED_OUT') {
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Tab visibility: when user returns to tab, verify session is still alive
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setUser(null);
          return;
        }
        // If user state was lost, restore it
        setUser(prev => {
          if (prev) return prev;
          if (session?.user) {
            fetchProfile(session.user.id, session.user.email!).then(u => {
              if (u) setUser(u);
            });
          }
          return null;
        });
      } catch (e) {
        // Ignore visibility check errors silently
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchProfile]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);

      if (data.session?.user) {
        const fullUser = await fetchProfile(data.session.user.id, data.session.user.email!);
        if (fullUser) {
          setUser(fullUser);
          switch (fullUser.role) {
            case 'admin':    router.push('/dashboard'); break;
            case 'mechanic': router.push('/mechanic/dashboard'); break;
            case 'client':   router.push('/portal/dashboard'); break;
            default:         router.push('/login');
          }
        } else {
          throw new Error('Credenciales válidas, pero no se encontró un perfil asignado a este usuario.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string, role: UserRole) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, role } }
    });
    if (error) throw new Error(error.message);
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      setUser(null);
      router.push('/');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
