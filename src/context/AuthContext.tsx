import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/index.js';
import { api, storage } from '../api/client.js';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (payload: { name: string; username: string; email: string; password: string; avatar?: string; bio?: string }) => Promise<void>;
  logout: () => void;
  updateProfile: (payload: Partial<User>) => Promise<User>;
  refreshMe: () => Promise<void>;
  authModalOpen: boolean;
  authModalTab: 'login' | 'register';
  openAuthModal: (tab?: 'login' | 'register') => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');

  const refreshMe = async () => {
    const token = storage.getToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const res = await api.auth.getMe();
      if (res.success && res.user) {
        setUser(res.user);
      } else {
        storage.removeToken();
        setUser(null);
      }
    } catch {
      storage.removeToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshMe();
  }, []);

  const login = async (identifier: string, password: string) => {
    const res = await api.auth.login({ identifier, password });
    if (res.token && res.user) {
      storage.setToken(res.token);
      setUser(res.user);
      setAuthModalOpen(false);
    }
  };

  const register = async (payload: { name: string; username: string; email: string; password: string; avatar?: string; bio?: string }) => {
    const res = await api.auth.register(payload);
    if (res.token && res.user) {
      storage.setToken(res.token);
      setUser(res.user);
      setAuthModalOpen(false);
    }
  };

  const logout = () => {
    storage.removeToken();
    setUser(null);
  };

  const updateProfile = async (payload: Partial<User>) => {
    const res = await api.users.updateProfile(payload);
    if (res.success && res.user) {
      setUser(res.user);
      return res.user;
    }
    throw new Error(res.message || 'Failed to update profile');
  };

  const openAuthModal = (tab: 'login' | 'register' = 'login') => {
    setAuthModalTab(tab);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        refreshMe,
        authModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
