import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthResponse } from '../types/auth';
import { apiRequest, setAccessToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_HINT_KEY = 'breatheiq_has_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshAuth = async () => {
    try {
      const res = await apiRequest<AuthResponse>('/auth/refresh', { method: 'POST' });
      setAccessToken(res.access_token);
      setUser(res.user);
      localStorage.setItem(SESSION_HINT_KEY, 'true');
    } catch {
      setAccessToken(null);
      setUser(null);
      localStorage.removeItem(SESSION_HINT_KEY);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only attempt silent session refresh if a previous session existed
    const hasSession = localStorage.getItem(SESSION_HINT_KEY) === 'true';
    if (!hasSession) {
      setLoading(false);
      return;
    }
    refreshAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setAccessToken(res.access_token);
    setUser(res.user);
    localStorage.setItem(SESSION_HINT_KEY, 'true');
  };

  const signup = async (email: string, password: string, fullName?: string) => {
    const res = await apiRequest<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name: fullName }),
    });
    setAccessToken(res.access_token);
    setUser(res.user);
    localStorage.setItem(SESSION_HINT_KEY, 'true');
  };

  const logout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } finally {
      setAccessToken(null);
      setUser(null);
      localStorage.removeItem(SESSION_HINT_KEY);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
