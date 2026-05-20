
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { User, UserRole } from '@/types';
// Simulación de Firebase Auth
// En una app real, importarías: import { auth } from '@/lib/firebase';
// y usarías onAuthStateChanged, createUserWithEmailAndPassword, etc.

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- Simulación de una base de datos de usuarios ---
const MOCK_USERS: { [email: string]: Omit<User, 'uid' | 'email'> & { password_hash: string } } = {
  'admin@lionfix.com': { name: 'Juan Pérez (Admin)', role: 'admin', password_hash: '123456', avatarUrl: 'https://placehold.co/100x100.png' },
  'mecanico@lionfix.com': { name: 'Ricardo Milos', role: 'mechanic', password_hash: '123456', avatarUrl: '/avatars/ricardo.png' },
  'cliente@lionfix.com': { name: 'Ana Martínez', role: 'client', password_hash: '123456', avatarUrl: 'https://placehold.co/100x100.png' },
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Simula `onAuthStateChanged`
    setLoading(true);
    const storedUser = sessionStorage.getItem('lionfix-user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // Simulación de login
    const foundUser = MOCK_USERS[email.toLowerCase()];
    if (foundUser && foundUser.password_hash === password) {
      const loggedInUser: User = {
        uid: `mock-uid-${email}`,
        email,
        name: foundUser.name,
        role: foundUser.role,
        avatarUrl: foundUser.avatarUrl,
      };
      setUser(loggedInUser);
      sessionStorage.setItem('lionfix-user', JSON.stringify(loggedInUser));
      
      // Redirigir según el rol
      switch (loggedInUser.role) {
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
      throw new Error("Credenciales inválidas.");
    }
  };

  const signup = async (email: string, password: string, name: string, role: UserRole) => {
     // Simulación de signup
     const lowerEmail = email.toLowerCase();
     if (MOCK_USERS[lowerEmail]) {
         throw new Error("El email ya está registrado.");
     }
     MOCK_USERS[lowerEmail] = {
         name,
         role,
         password_hash: password,
         avatarUrl: `https://placehold.co/100x100.png`
     };
  };

  const logout = async () => {
    // Simulación de logout
    setUser(null);
    sessionStorage.removeItem('lionfix-user');
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
