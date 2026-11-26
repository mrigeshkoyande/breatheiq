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

function readSessionHint(): boolean {
  try {
    return localStorage.getItem(SESSION_HINT_KEY) === 'true';
  } catch (err: unknown) {
    if (err instanceof Error && import.meta.env.DEV) console.debug(err.message);
    return false;
  }
}

function writeSessionHint(enabled: boolean): void {
  try {
    if (enabled) {
      localStorage.setItem(SESSION_HINT_KEY, 'true');
    } else {
      localStorage.removeItem(SESSION_HINT_KEY);
    }
  } catch (err: unknown) {
    if (err instanceof Error && import.meta.env.DEV) console.debug(err.message);
  }
}

function commitSession(res: AuthResponse, setUser: (u: User | null) => void): void {
  setAccessToken(res.access_token);
  setUser(res.user);
  writeSessionHint(true);
}

function clearSession(setUser: (u: User | null) => void): void {
  setAccessToken(null);
  setUser(null);
  writeSessionHint(false);
}

/** Provides in-memory JWT session state and silent refresh cookie synchronization. */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasHint] = useState(readSessionHint);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(hasHint);
  const queryClient = useQueryClient();

  const refreshAuth = useCallback(async (): Promise<void> => {
    try {
      const res = await apiRequest<AuthResponse>('/auth/refresh', { method: 'POST' });
      commitSession(res, setUser);
    } catch (err: unknown) {
      if (err instanceof Error && import.meta.env.DEV) console.debug(err.message);
      clearSession(setUser);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasHint) return;
    let active = true;
    apiRequest<AuthResponse>('/auth/refresh', { method: 'POST' })
      .then((res) => {
        if (active) commitSession(res, setUser);
      })
      .catch((err: unknown) => {
        if (err instanceof Error && import.meta.env.DEV) console.debug(err.message);
        if (active) clearSession(setUser);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [hasHint]);

  const login = async (email: string, password: string): Promise<void> => {
    const res = await apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    commitSession(res, setUser);
    queryClient.clear();
  };

  const signup = async (email: string, password: string, fullName?: string): Promise<void> => {
    const res = await apiRequest<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name: fullName }),
    });
    commitSession(res, setUser);
    queryClient.clear();
  };

  const logout = async (): Promise<void> => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } finally {
      clearSession(setUser);
      queryClient.clear();
    }
  };

  const setUserProfile = useCallback((updated: User): void => {
    setUser(updated);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, signup, logout, refreshAuth, setUserProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/** Returns the active authentication context; must be called inside `<AuthProvider>`. */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
