'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

  const fetchProfile = async (userId: string, email: string): Promise<User | null> => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      console.error('Error fetching profile:', error);
      // Fallback a metadata si no se pudo leer la tabla
      return null;
    }

    return {
      uid: userId,
      email: email,
      name: profile.name,
      role: profile.role as UserRole,
      avatarUrl: profile.avatar_url,
    };
  };

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

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
         if (mounted) {
             const fullUser = await fetchProfile(session.user.id, session.user.email!);
             if (fullUser) setUser(fullUser);
         }
      } else if (event === 'SIGNED_OUT') {
        if (mounted) setUser(null);
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    console.log("1. Intentando login en Supabase con:", email);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    console.log("2. LOGIN DATA RECIBIDA:", data);
    console.log("3. LOGIN ERROR RECIBIDO:", error);

    if (error) throw new Error(error.message);
    
    if (data.session?.user) {
        console.log("4. Login exitoso en Auth. Buscando perfil para UID:", data.session.user.id);
        const fullUser = await fetchProfile(data.session.user.id, data.session.user.email!);
        console.log("5. Perfil obtenido (fullUser):", fullUser);

        if (fullUser) {
            setUser(fullUser);
            console.log("6. Redirigiendo según el rol:", fullUser.role);
            switch (fullUser.role) {
                case 'admin':
                    router.push('/dashboard');
                    break;
                case 'mechanic':
                    router.push('/mechanic/dashboard');
                    break;
                case 'client':
                    router.push('/portal/dashboard');
                    break;
                default:
                    router.push('/login');
            }
        } else {
            console.error("6. ERROR GRAVE: fetchProfile devolvió null. No se encontró el perfil en la tabla 'profiles'.");
        }
    }
  };

  const signup = async (email: string, password: string, name: string, role: UserRole) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
        }
      }
    });
    if (error) throw new Error(error.message);
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
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
