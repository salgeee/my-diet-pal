import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  session: { user: User } | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<{ user: User } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('auth_token');
    if (token) {
      api.get<{ user: User }>('/auth').then(({ data, error }) => {
        if (data?.user) {
          setUser(data.user);
          setSession({ user: data.user });
        } else {
          localStorage.removeItem('auth_token');
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    const { data, error } = await api.post<{ user: User; token: string }>('/auth', {
      action: 'signup',
      email,
      password,
      name,
    });

    if (error) {
      return { error: new Error(error) };
    }

    if (data?.user && data?.token) {
      localStorage.setItem('auth_token', data.token);
      setUser(data.user);
      setSession({ user: data.user });
    }

    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await api.post<{ user: User; token: string }>('/auth', {
      action: 'signin',
      email,
      password,
    });

    if (error) {
      return { error: new Error(error) };
    }

    if (data?.user && data?.token) {
      localStorage.setItem('auth_token', data.token);
      setUser(data.user);
      setSession({ user: data.user });
    }

    return { error: null };
  };

  const signOut = async () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    setSession(null);
    // Redirecionar para a página inicial
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
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
