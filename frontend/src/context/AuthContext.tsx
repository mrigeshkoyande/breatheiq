import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiRequest, SESSION_HINT_KEY, setAccessToken } from '../services/api';
import { AuthResponse, User } from '../types/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  setUserProfile: (updated: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasHint] = useState(() => localStorage.getItem(SESSION_HINT_KEY) === 'true');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(hasHint);
  const queryClient = useQueryClient();

  const refreshAuth = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    if (!hasHint) return;
    let active = true;
    apiRequest<AuthResponse>('/auth/refresh', { method: 'POST' })
      .then((res) => {
        if (!active) return;
        setAccessToken(res.access_token);
        setUser(res.user);
        localStorage.setItem(SESSION_HINT_KEY, 'true');
      })
      .catch(() => {
        if (!active) return;
        setAccessToken(null);
        setUser(null);
        localStorage.removeItem(SESSION_HINT_KEY);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [hasHint]);

  const login = async (email: string, password: string) => {
    const res = await apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setAccessToken(res.access_token);
    setUser(res.user);
    localStorage.setItem(SESSION_HINT_KEY, 'true');
    queryClient.clear();
  };

  const signup = async (email: string, password: string, fullName?: string) => {
    const res = await apiRequest<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name: fullName }),
    });
    setAccessToken(res.access_token);
    setUser(res.user);
    localStorage.setItem(SESSION_HINT_KEY, 'true');
    queryClient.clear();
  };

  const logout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } finally {
      setAccessToken(null);
      setUser(null);
      localStorage.removeItem(SESSION_HINT_KEY);
      queryClient.clear();
    }
  };

  const setUserProfile = useCallback((updated: User) => {
    setUser(updated);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshAuth, setUserProfile }}>
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
