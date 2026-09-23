import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser } from '../types';
import { api, ApiError } from '../services/api';
import { supabase } from '../services/supabase';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string, onStatus?: (status: string) => void) => Promise<void>;
  register: (
    data: { name: string; email: string; password: string; teamName: string; role?: 'LEAD' | 'MEMBER' },
    onStatus?: (status: string) => void
  ) => Promise<void>;
  logout: () => Promise<void>;
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
    return hasStoredToken() && !getCachedUser();
  });

  useEffect(() => {
    let isMounted = true;

    // Listen to Supabase Auth state changes (token refresh, signout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      if (session?.access_token) {
        localStorage.setItem('jvmcrew_token', session.access_token);
      }
    });

    const isValidToken = hasStoredToken();

    if (isValidToken) {
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
          const isExplicitAuthFailure =
            (err instanceof ApiError && err.status === 401) ||
            err?.status === 401 ||
            err?.message?.includes('401') ||
            err?.message?.includes('Unauthorized');

          if (isExplicitAuthFailure) {
            console.warn('Session expired. Logging out.');
            if (isMounted) {
              try {
                localStorage.removeItem('jvmcrew_token');
                localStorage.removeItem('jvmcrew_cached_user');
              } catch (e) {}
              setUser(null);
            }
          } else {
            console.warn('Backend waking or network delayed; preserving session state:', err?.message || err);
          }
        })
        .finally(() => {
          if (isMounted) {
            setLoading(false);
          }
        });
    } else {
      setLoading(false);
    }

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string, onStatus?: (status: string) => void) => {
    onStatus?.('Signing in...');
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    // Fast-path: Direct backend authentication in 1 round-trip (~100-200ms)
    const backendPromise = api.login(trimmedEmail, trimmedPassword, onStatus);

    // Concurrently trigger Supabase session in parallel (non-blocking)
    const supaPromise = (async () => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password: trimmedPassword,
        });
        if (!error && data?.session?.access_token) {
          return data.session.access_token;
        }
      } catch {
        // Non-critical background failure
      }
      return null;
    })();

    let authUser: AuthUser | null = null;
    try {
      authUser = await backendPromise;
    } catch (backendErr: any) {
      // If backend login failed (e.g. user updated password in Supabase), check concurrent Supabase Auth
      const supaToken = await supaPromise;
      if (supaToken) {
        localStorage.setItem('jvmcrew_token', supaToken);
        onStatus?.('Loading workspace profile...');
        authUser = await api.getCurrentUser();
      } else {
        throw backendErr;
      }
    }

    if (authUser) {
      const activeToken = authUser.token || localStorage.getItem('jvmcrew_token');
      if (activeToken) {
        localStorage.setItem('jvmcrew_token', activeToken);
      }
      try {
        localStorage.setItem('jvmcrew_cached_user', JSON.stringify(authUser));
      } catch (e) {
        console.warn('localStorage setItem error:', e);
      }
      setUser(authUser);

      // In the background, if supaPromise succeeds and no token is in storage, keep it updated
      supaPromise
        .then((token) => {
          if (token && !localStorage.getItem('jvmcrew_token')) {
            localStorage.setItem('jvmcrew_token', token);
          }
        })
        .catch(() => {});
    }
  };

  const register = async (
    data: { name: string; email: string; password: string; teamName: string; role?: 'LEAD' | 'MEMBER' },
    onStatus?: (status: string) => void
  ) => {
    onStatus?.('Creating authentication account...');
    const trimmedEmail = data.email.trim().toLowerCase();
    let authUserId: string | undefined = undefined;
    let supaToken: string | null = null;

    // 1. Register with Supabase Auth
    try {
      const { data: supaData, error: supaErr } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: data.password.trim(),
        options: {
          data: {
            name: data.name.trim(),
          },
        },
      });

      if (supaErr) {
        if (!supaErr.message?.toLowerCase().includes('already registered')) {
          throw new Error(supaErr.message);
        }
      }

      if (supaData?.user?.id) {
        authUserId = supaData.user.id;
      }
      if (supaData?.session?.access_token) {
        supaToken = supaData.session.access_token;
      }
    } catch (err: any) {
      if (err.message && !err.message.toLowerCase().includes('already registered')) {
        throw err;
      }
    }

    // 2. Register Team & Lead in Spring Boot application database
    onStatus?.('Setting up team workspace...');
    const authData = await api.register(
      {
        name: data.name.trim(),
        email: trimmedEmail,
        password: data.password.trim(),
        teamName: data.teamName.trim(),
        authUserId,
      },
      onStatus
    );

    const tokenToStore = supaToken || authData.token;
    if (tokenToStore) {
      try {
        localStorage.setItem('jvmcrew_token', tokenToStore);
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

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Supabase signOut error:', e);
    }
    try {
      localStorage.removeItem('jvmcrew_token');
      localStorage.removeItem('jvmcrew_cached_user');
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('jvm') || key.startsWith('crew') || key.startsWith('sb-'))) {
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
