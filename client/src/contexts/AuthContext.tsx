import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { api } from '@/lib/api';

export interface User {
  id: number;
  nome: string;
  email: string;
}

export interface AuthState {
  user: User | null;
  permissions: string[];
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (code: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'nexus_auth';

function loadStoredAuth(): Partial<AuthState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw);
    return {
      user: data.user ?? null,
      permissions: data.permissions ?? [],
      accessToken: data.accessToken ?? null,
    };
  } catch {
    return {};
  }
}

function saveAuth(data: Partial<AuthState>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function clearAuth() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem('accessToken');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    permissions: [],
    accessToken: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const loadFromStorage = useCallback(() => {
    const stored = loadStoredAuth();
    if (stored.accessToken && stored.user) {
      localStorage.setItem('accessToken', stored.accessToken);
      setState({
        user: stored.user,
        permissions: stored.permissions ?? [],
        accessToken: stored.accessToken,
        isLoading: false,
        isAuthenticated: true,
      });
    } else {
      setState((s) => ({ ...s, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api<{
      accessToken: string;
      user: User;
      permissions: string[];
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const data = {
      accessToken: res.accessToken,
      user: res.user,
      permissions: res.permissions,
    };
    localStorage.setItem('accessToken', res.accessToken);
    saveAuth(data);
    setState({
      user: res.user,
      permissions: res.permissions,
      accessToken: res.accessToken,
      isLoading: false,
      isAuthenticated: true,
    });
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setState({
      user: null,
      permissions: [],
      accessToken: null,
      isLoading: false,
      isAuthenticated: false,
    });
  }, []);

  const hasPermission = useCallback(
    (code: string) => state.permissions.includes(code),
    [state.permissions]
  );

  const value: AuthContextValue = {
    ...state,
    login,
    logout,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
