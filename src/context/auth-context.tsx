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
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return {
      uid: userId,
      email: email,
      name: profile.name,
      role: profile.role as UserRole,
      avatarUrl: profile.avatar_url,
    };
  }, []);

  // Core init: read existing session from localStorage (no network call needed)
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && mounted) {
        const fullUser = await fetchProfile(session.user.id, session.user.email!);
        if (fullUser && mounted) setUser(fullUser);
      }
      if (mounted) setLoading(false);
    };

    initialize();

    // Listen to ALL auth events — especially TOKEN_REFRESHED
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          // Only re-fetch profile if we don't already have the user
          // (TOKEN_REFRESHED fires frequently, avoid unnecessary DB calls)
          setUser(prev => {
            if (prev?.uid === session.user.id) return prev; // Already have it, no change
            return prev; // Will trigger fetchProfile below
          });
          // Always update for SIGNED_IN, only if missing for TOKEN_REFRESHED
          if (event === 'SIGNED_IN') {
            const fullUser = await fetchProfile(session.user.id, session.user.email!);
            if (fullUser && mounted) setUser(fullUser);
          } else {
            // TOKEN_REFRESHED: just ensure user is still set
            setUser(prev => {
              if (!prev && session?.user) {
                // Was lost, restore from session metadata
                fetchProfile(session.user.id, session.user.email!).then(u => {
                  if (u && mounted) setUser(u);
                });
              }
              return prev;
            });
          }
        }
      } else if (event === 'SIGNED_OUT') {
        if (mounted) setUser(null);
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Tab visibility recovery: when returning to tab, verify session is still valid
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState !== 'visible') return;

      // Tab became visible — check if session is still alive
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // Session truly expired, clear user state
        setUser(null);
        return;
      }

      // Session exists but user state was lost (e.g., due to component unmount)
      setUser(prev => {
        if (!prev && session.user) {
          fetchProfile(session.user.id, session.user.email!).then(u => {
            if (u) setUser(u);
          });
        }
        return prev;
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchProfile]);

  const login = async (email: string, password: string) => {
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
    await supabase.auth.signOut();
    setUser(null);
    router.push('/');
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
