import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; teamName: string; role?: 'LEAD' | 'MEMBER' }) => Promise<void>;
  logout: () => void;
  updateAccount: (data: {
    name: string;
    email: string;
    phoneNumber?: string;
    college?: string;
    organization?: string;
    bio?: string;
    githubUrl?: string;
    linkedinUrl?: string;
    photoUrl?: string;
    avatarUrl?: string;
  }) => Promise<AuthUser>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let token: string | null = null;
    try {
      token = localStorage.getItem('jvmcrew_token');
    } catch (e) {
      console.warn('localStorage getItem error:', e);
    }

    if (token) {
      api
        .getCurrentUser()
        .then((userData) => {
          setUser(userData);
        })
        .catch(() => {
          try {
            localStorage.removeItem('jvmcrew_token');
          } catch (e) {}
          setUser(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const authData = await api.login(email, password);
      if (authData.token) {
        try {
          localStorage.setItem('jvmcrew_token', authData.token);
        } catch (e) {
          console.warn('localStorage setItem error:', e);
        }
      }
      setUser(authData);
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: { name: string; email: string; password: string; teamName: string; role?: 'LEAD' | 'MEMBER' }) => {
    setLoading(true);
    try {
      const authData = await api.register(data);
      if (authData.token) {
        try {
          localStorage.setItem('jvmcrew_token', authData.token);
        } catch (e) {
          console.warn('localStorage setItem error:', e);
        }
      }
      setUser(authData);
    } finally {
      setLoading(false);
    }
  };

  const updateAccount = async (data: {
    name: string;
    email: string;
    phoneNumber?: string;
    college?: string;
    organization?: string;
    bio?: string;
    githubUrl?: string;
    linkedinUrl?: string;
    photoUrl?: string;
    avatarUrl?: string;
  }) => {
    const updated = await api.updateAccount(data);
    if (updated.token) {
      try {
        localStorage.setItem('jvmcrew_token', updated.token);
      } catch (e) {
        console.warn('localStorage setItem error:', e);
      }
    }
    setUser(updated);
    return updated;
  };

  const logout = () => {
    try {
      localStorage.removeItem('jvmcrew_token');
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('jvm') || key.startsWith('crew'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      if (window.location.pathname !== '/') {
        window.history.replaceState(null, '', '/');
      }
    } catch (e) {
      console.warn('localStorage cleanup error:', e);
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateAccount }}>
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
