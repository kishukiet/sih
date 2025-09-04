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
    // Auto-login with default user - no authentication required
    const defaultUser: User = {
      id: 'default-user',
      email: 'admin@system.com',
      role: 'SUPERVISOR' // Give highest privileges by default
    };

    // Set a dummy token for API calls
    const dummyToken = 'system-access-token';
    localStorage.setItem('token', dummyToken);
    localStorage.setItem('user', JSON.stringify(defaultUser));

    setUser(defaultUser);
    socketService.connect(dummyToken);
    setLoading(false);
  }, []);

  const login = async () => {
    // No-op - login is bypassed
    return Promise.resolve();
  };

  const logout = () => {
    // Optional: Keep user logged in even on logout
    // Or implement role switching here
    console.log('Logout requested - staying logged in with system access');
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

  // Always render children - no login required
  return <>{children}</>;
}