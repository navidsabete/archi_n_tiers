/**
 * Auth Controller - Authentication Context
 * Implements auth state management with React Context
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { IUserResponse } from '@ligue-sportive/shared';
import { ApiService } from '../models/api';

interface AuthContextType {
  user: IUserResponse | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => Promise<void>;
  logout: () => void;
  isAdmin: () => boolean;
  isVendeur:() => boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<IUserResponse | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }

    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const response = await ApiService.login(email, password);
      const newToken = response.token;
      const newUser = response.user;

      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<void> => {
    try {
      const response = await ApiService.register(data);
      const newToken = response.token;
      const newUser = response.user;

      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = (): void => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const isAdmin = (): boolean => {
    return user?.role === 'ADMIN';
  };
  const isVendeur = (): boolean => {
    return user?.role === 'VENDEUR';
  };

  return (
    <AuthContext.Provider
      value={{ user, token, login, register, logout, isAdmin, isVendeur, isLoading }}
    >
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