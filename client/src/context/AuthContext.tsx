import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string, onStatus?: (status: string) => void) => Promise<void>;
  register: (data: { name: string; email: string; password: string; teamName: string; role?: 'LEAD' | 'MEMBER' }, onStatus?: (status: string) => void) => Promise<void>;
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

const hasStoredToken = (): boolean => {
  try {
    const token = localStorage.getItem('jvmcrew_token');
    return Boolean(
      token &&
      typeof token === 'string' &&
      token.trim() !== '' &&
      token !== 'null' &&
      token !== 'undefined'
    );
  } catch {
    return false;
  }
};

const getCachedUser = (): AuthUser | null => {
  if (!hasStoredToken()) return null;
  try {
    const raw = localStorage.getItem('jvmcrew_cached_user');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.id && parsed.email) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return null;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(getCachedUser);
  const [loading, setLoading] = useState<boolean>(() => {
    // If we have a stored token but NO cached user, show quick loading while fetching.
    // If we have a cached user, loading is FALSE (instant render) and we verify in background.
    return hasStoredToken() && !getCachedUser();
  });

  useEffect(() => {
    const isValidToken = hasStoredToken();

    if (isValidToken) {
      let isMounted = true;

      // Trigger non-blocking backend warmup
      api.warmup();

      api
        .getCurrentUser()
        .then((userData) => {
          if (isMounted) {
            if (userData && userData.id) {
              setUser(userData);
              try {
                localStorage.setItem('jvmcrew_cached_user', JSON.stringify(userData));
              } catch (e) {}
            } else {
              try {
                localStorage.removeItem('jvmcrew_token');
                localStorage.removeItem('jvmcrew_cached_user');
              } catch (e) {}
              setUser(null);
            }
          }
        })
        .catch((err) => {
          console.warn('Session verification notice:', err?.message || err);
          if (isMounted) {
            try {
              localStorage.removeItem('jvmcrew_token');
              localStorage.removeItem('jvmcrew_cached_user');
            } catch (e) {}
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
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string, onStatus?: (status: string) => void) => {
    const authData = await api.login(email, password, onStatus);
    if (authData && authData.token) {
      try {
        localStorage.setItem('jvmcrew_token', authData.token);
        localStorage.setItem('jvmcrew_cached_user', JSON.stringify(authData));
      } catch (e) {
        console.warn('localStorage setItem error:', e);
      }
    }
    setUser(authData);
  };

  const register = async (data: { name: string; email: string; password: string; teamName: string; role?: 'LEAD' | 'MEMBER' }, onStatus?: (status: string) => void) => {
    const authData = await api.register(data, onStatus);
    if (authData && authData.token) {
      try {
        localStorage.setItem('jvmcrew_token', authData.token);
        localStorage.setItem('jvmcrew_cached_user', JSON.stringify(authData));
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
        localStorage.setItem('jvmcrew_cached_user', JSON.stringify(updated));
      } catch (e) {
        console.warn('localStorage setItem error:', e);
      }
    } else if (updated) {
      try {
        localStorage.setItem('jvmcrew_cached_user', JSON.stringify(updated));
      } catch (e) {}
    }
    setUser(updated);
    return updated;
  };

  const logout = () => {
    try {
      localStorage.removeItem('jvmcrew_token');
      localStorage.removeItem('jvmcrew_cached_user');
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
