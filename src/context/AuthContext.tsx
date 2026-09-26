/**
 * RapidRescue Auth Context & State Provider
 *
 * Centralized authentication state management supporting:
 * - unauthenticated
 * - authenticating
 * - authenticated
 * - restoring_session
 * - error
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import {
  AuthState,
  AuthStatus,
  PatientProfile,
  LoginCredentials,
  RegisterPayload,
} from '@/types/auth.types';
import { ApiError } from '@/types/api.types';
import { authService } from '@/services/auth.service';

interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  restoreSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<AuthStatus>('restoring_session');
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const restoreSession = useCallback(async () => {
    try {
      setStatus('restoring_session');
      setError(null);
      const restoredPatient = await authService.restoreSession();
      if (restoredPatient) {
        setPatient(restoredPatient);
        setStatus('authenticated');
      } else {
        setPatient(null);
        setStatus('unauthenticated');
      }
    } catch (err) {
      console.warn('[AuthProvider] Session restore error:', err);
      setPatient(null);
      setStatus('unauthenticated');
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setStatus('authenticating');
      setError(null);
      const response = await authService.login(credentials);
      setPatient(response.patient);
      setStatus('authenticated');
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      const errorMessage =
        apiErr.message || 'Authentication failed. Please check your credentials.';
      setError(errorMessage);
      setStatus('error');
      throw err;
    }
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    try {
      setStatus('authenticating');
      setError(null);
      const response = await authService.register(payload);
      setPatient(response.patient);
      setStatus('authenticated');
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      const errorMessage =
        apiErr.message || 'Registration failed. Please check your information.';
      setError(errorMessage);
      setStatus('error');
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.warn('[AuthProvider] Logout warning:', err);
    } finally {
      setPatient(null);
      setError(null);
      setStatus('unauthenticated');
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      patient,
      error,
      isLoading: status === 'authenticating' || status === 'restoring_session',
      isAuthenticated: status === 'authenticated' && patient !== null,
      login,
      register,
      logout,
      clearError,
      restoreSession,
    }),
    [status, patient, error, login, register, logout, clearError, restoreSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
