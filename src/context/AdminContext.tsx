import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AdminSession, AdminCredentials, AdminAuthResponse } from '../types';
import { adminAuthService } from '../services';

import { useAuth } from './AuthContext';

interface AdminContextValue {
  isAuthenticated: boolean;
  role: 'ADMIN' | null;
  adminId: string | null;
  adminName: string | null;
  session: AdminSession | null;
  loading: boolean;
  error: string | null;
  login: (credentials: AdminCredentials) => Promise<AdminAuthResponse>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  setAdminSession: (session: AdminSession | null) => void;
  clearError: () => void;
}

const AdminContext = createContext<AdminContextValue | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session: authSession, logout: authLogout } = useAuth();
  const initialAdminSession = authSession?.role === 'ADMIN' ? (authSession as AdminSession) : null;
  const [session, setSession] = useState<AdminSession | null>(initialAdminSession);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authSession?.role === 'ADMIN') {
      setSession(authSession as AdminSession);
    } else if (!authSession) {
      setSession(null);
    }
  }, [authSession]);

  const checkSession = useCallback(async () => {
    try {
      if (authSession?.role === 'ADMIN') {
        setSession(authSession as AdminSession);
        return;
      }
      const existing = await adminAuthService.getCurrentSession();
      if (existing) {
        setSession(existing);
      }
    } catch (err) {
      // no session
    }
  }, [authSession]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = async (credentials: AdminCredentials): Promise<AdminAuthResponse> => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminAuthService.login(credentials);
      if (res.success && res.session) {
        setSession(res.session);
        setLoading(false);
        return res;
      } else {
        const msg = res.error || 'Admin authentication failed.';
        setError(msg);
        setLoading(false);
        return { success: false, error: msg };
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Admin sign in error.';
      setError(msg);
      setLoading(false);
      return { success: false, error: msg };
    }
  };

  const logout = async (): Promise<void> => {
    setLoading(true);
    try {
      await adminAuthService.logout();
      await authLogout();
    } finally {
      setSession(null);
      setError(null);
      setLoading(false);
    }
  };

  const setAdminSession = (newSession: AdminSession | null) => {
    setSession(newSession);
  };

  const clearError = () => setError(null);

  return (
    <AdminContext.Provider
      value={{
        isAuthenticated: Boolean(session || (authSession?.role === 'ADMIN')),
        role: (session?.role || (authSession?.role === 'ADMIN' ? 'ADMIN' : null)),
        adminId: session?.adminId || (authSession?.role === 'ADMIN' ? authSession.adminId : null),
        adminName: session?.name || (authSession?.role === 'ADMIN' ? authSession.name : null),
        session: session || (authSession?.role === 'ADMIN' ? (authSession as AdminSession) : null),
        loading,
        error,
        login,
        logout,
        refreshSession: checkSession,
        setAdminSession,
        clearError,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = (): AdminContextValue => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
