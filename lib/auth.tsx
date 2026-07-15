'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { login, getCurrentUser } from '@/lib/api';

interface User {
  id: number;
  email: string;
  role: string;
  first_name: string;
  last_name: string;
  school: number | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');
      if (storedToken && refreshToken) {
        setToken(storedToken);
        try {
          const userData = await getCurrentUser();
          setUser(userData);
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          setToken(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const handleLogin = async (email: string, password: string) => {
    const data = await login(email, password);
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    setToken(data.access);
    const userData = await getCurrentUser();
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login: handleLogin, logout: handleLogout, loading }}>
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
