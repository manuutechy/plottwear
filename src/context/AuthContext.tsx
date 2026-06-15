'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch, setAuthToken, getAuthToken } from '@/lib/api';

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: 'customer' | 'admin';
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: any) => Promise<User>;
  register: (data: any) => Promise<User>;
  logout: () => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    const token = getAuthToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const userData = await apiFetch<User>('/auth/me');
      if (userData && userData.is_active) {
        setUser(userData);
      } else {
        // Log out if inactive
        setAuthToken(null);
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
      setAuthToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (credentials: any): Promise<User> => {
    setLoading(true);
    try {
      const response = await apiFetch<{ user: User; access_token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      setAuthToken(response.access_token);
      setUser(response.user);
      return response.user;
    } catch (error) {
      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: any): Promise<User> => {
    setLoading(true);
    try {
      const response = await apiFetch<{ user: User; access_token: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      setAuthToken(response.access_token);
      setUser(response.user);
      return response.user;
    } catch (error) {
      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout failed on backend, cleaning up client anyway:', error);
    } finally {
      setAuthToken(null);
      setUser(null);
      setLoading(false);
    }
  };

  const updateProfile = async (data: any) => {
    setLoading(true);
    try {
      const response = await apiFetch<{ user: User }>('/auth/me', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      setUser(response.user);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateProfile,
        isAuthenticated,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
