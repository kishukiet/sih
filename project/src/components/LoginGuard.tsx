import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../lib/api';
import socketService from '../lib/socket';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 🔑 BYPASS: Auto set dummy token & user
    const dummyToken = 'dummy-token';
    const dummyUser: User = {
      id: '123',
      name: 'Guest User',
      email: 'guest@example.com',
      role: 'operator', // or supervisor if needed
    };

    localStorage.setItem('token', dummyToken);
    localStorage.setItem('user', JSON.stringify(dummyUser));

    setUser(dummyUser);
    socketService.connect(dummyToken);

    setLoading(false);
  }, []);

  // login() no longer used, but keeping for compatibility
  const login = async () => Promise.resolve();

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    socketService.disconnect();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export function LoginGuard({ children }: { children: ReactNode }) {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // 🚀 BYPASS: Always render children (skip LoginForm)
  return <>{children}</>;
}
