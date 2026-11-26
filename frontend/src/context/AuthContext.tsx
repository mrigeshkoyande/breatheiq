import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiRequest, SESSION_HINT_KEY, setAccessToken } from '../services/api';
import { AuthResponse, User } from '../types/auth';
import { readStorage, removeStorage, writeStorage } from '../utils/storage';

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
  return readStorage(SESSION_HINT_KEY) === 'true';
}

function writeSessionHint(enabled: boolean): void {
  if (enabled) {
    writeStorage(SESSION_HINT_KEY, 'true');
  } else {
    removeStorage(SESSION_HINT_KEY);
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
    } catch {
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
      .catch(() => {
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
