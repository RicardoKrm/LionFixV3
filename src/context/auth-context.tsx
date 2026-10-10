'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { User, UserRole } from '@/types';
import { supabase } from '@/lib/supabase';

const USER_CACHE_KEY = 'lionfix_user_profile_cache';

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
  const currentUserIdRef = useRef<string | null>(null);
  const router = useRouter();

  const updateUserState = useCallback((newUser: User | null) => {
    currentUserIdRef.current = newUser?.uid ?? null;
    setUser(newUser);
    try {
      if (newUser) {
        localStorage.setItem(USER_CACHE_KEY, JSON.stringify(newUser));
      } else {
        localStorage.removeItem(USER_CACHE_KEY);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const fetchProfile = useCallback(async (userId: string, email: string): Promise<User> => {
    const isAdminEmail = email.toLowerCase().includes('admin');
    const fallbackUser: User = {
      uid: userId,
      email: email,
      name: isAdminEmail ? 'Administrador' : email.split('@')[0],
      role: (isAdminEmail ? 'admin' : 'mechanic') as UserRole,
      avatarUrl: 'https://placehold.co/100x100.png',
    };

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!profile) {
        return fallbackUser;
      }

      return {
        uid: userId,
        email: email,
        name: profile.name || fallbackUser.name,
        role: (profile.role || fallbackUser.role) as UserRole,
        avatarUrl: profile.avatar_url || fallbackUser.avatarUrl,
      };
    } catch (e) {
      console.error('fetchProfile failed, using fallback:', e);
      return fallbackUser;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // 0. Restore cached user immediately to avoid loading flicker
    try {
      const cached = localStorage.getItem(USER_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as User;
        if (parsed?.uid) {
          currentUserIdRef.current = parsed.uid;
          setUser(parsed);
          setLoading(false);
        }
      }
    } catch {
      // Ignore parse errors
    }

    // 1. Verify session from Supabase
    const initialize = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && mounted) {
          if (currentUserIdRef.current !== session.user.id) {
            const fullUser = await fetchProfile(session.user.id, session.user.email || '');
            if (mounted) updateUserState(fullUser);
          }
        } else if (!session && mounted) {
          updateUserState(null);
        }
      } catch (e) {
        console.error('Session initialization failed:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initialize();

    // 2. Listen for auth events
    // CRITICAL: Callback MUST NOT be async! Calling supabase.from() directly inside an async
    // onAuthStateChange callback causes a deadlock in GoTrueClient when the browser tab regains focus.
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') && session?.user) {
        // If we already have this exact user loaded, do nothing when returning from minimize/tab switch!
        if (currentUserIdRef.current === session.user.id) {
          setLoading(false);
          return;
        }

        // Defer profile fetch outside the internal GoTrue lock tick to prevent deadlocks
        const userId = session.user.id;
        const userEmail = session.user.email || '';
        setTimeout(async () => {
          if (!mounted) return;
          const fullUser = await fetchProfile(userId, userEmail);
          if (mounted) {
            updateUserState(fullUser);
            setLoading(false);
          }
        }, 0);
      } else if (event === 'SIGNED_OUT') {
        if (mounted) {
          updateUserState(null);
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [fetchProfile, updateUserState]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);

      if (data.session?.user) {
        const fullUser = await fetchProfile(data.session.user.id, data.session.user.email || email);
        updateUserState(fullUser);
        switch (fullUser.role) {
          case 'admin':    router.push('/dashboard'); break;
          case 'mechanic': router.push('/mechanic/dashboard'); break;
          case 'client':   router.push('/portal/dashboard'); break;
          default:         router.push('/dashboard');
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
      updateUserState(null);
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
