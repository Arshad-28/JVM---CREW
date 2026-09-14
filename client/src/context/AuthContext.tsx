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

    const isValidToken = Boolean(
      token &&
      typeof token === 'string' &&
      token.trim() !== '' &&
      token !== 'null' &&
      token !== 'undefined'
    );

    if (isValidToken && token) {
      let isMounted = true;

      // Trigger non-blocking backend warmup
      api.warmup();

      api
        .getCurrentUser()
        .then((userData) => {
          if (isMounted) {
            if (userData && userData.id) {
              setUser(userData);
            } else {
              try {
                localStorage.removeItem('jvmcrew_token');
              } catch (e) {}
              setUser(null);
            }
          }
        })
        .catch((err) => {
          console.warn('Session verification notice:', err?.message || err);
          if (isMounted) {
            // Only remove token if the server explicitly rejected the credentials (401 / 403 / Unauthorized)
            const isAuthError = err?.message?.includes('401') || err?.message?.includes('Unauthorized') || err?.message?.includes('Invalid token') || err?.message?.includes('403');
            if (isAuthError) {
              try {
                localStorage.removeItem('jvmcrew_token');
              } catch (e) {}
            }
            setUser(null);
          }
        })
        .finally(() => {
          if (isMounted) {
            setLoading(false);
          }
        });

      return () => {
        isMounted = false;
      };
    } else {
      try {
        if (token) localStorage.removeItem('jvmcrew_token');
      } catch (e) {}
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const authData = await api.login(email, password);
    if (authData && authData.token) {
      try {
        localStorage.setItem('jvmcrew_token', authData.token);
      } catch (e) {
        console.warn('localStorage setItem error:', e);
      }
    }
    setUser(authData);
  };

  const register = async (data: { name: string; email: string; password: string; teamName: string; role?: 'LEAD' | 'MEMBER' }) => {
    const authData = await api.register(data);
    if (authData && authData.token) {
      try {
        localStorage.setItem('jvmcrew_token', authData.token);
      } catch (e) {
        console.warn('localStorage setItem error:', e);
      }
    }
    setUser(authData);
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
