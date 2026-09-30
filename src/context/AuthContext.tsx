import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  AuthSession,
  UserRole,
  AuthStatus,
  LoginCredentials,
  DriverRegistrationData,
  AuthResponse,
} from '../types';
import { authService, tokenStorage } from '../services';
import { setUnauthorizedHandler } from '../services/api/apiClient';

interface AuthContextValue {
  status: AuthStatus;
  role: UserRole | null;
  session: AuthSession | null;
  error: string | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  register: (data: DriverRegistrationData) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<AuthStatus>('INITIALIZING');
  const [session, setSession] = useState<AuthSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check if an existing session exists upon app start
  useEffect(() => {
    let isMounted = true;

    // Register 401 callback to clear local session and prompt login
    setUnauthorizedHandler(() => {
      if (isMounted) {
        setSession(null);
        setStatus('UNAUTHENTICATED');
        setError('Your session has expired. Please log in again.');
      }
    });

    const initAuth = async () => {
      try {
        const existingSession = await authService.getCurrentSession();
        if (isMounted) {
          if (existingSession) {
            setSession(existingSession);
            setStatus('AUTHENTICATED');
          } else {
            setSession(null);
            setStatus('UNAUTHENTICATED');
          }
        }
      } catch {
        if (isMounted) {
          setSession(null);
          setStatus('UNAUTHENTICATED');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      isMounted = false;
      setUnauthorizedHandler(null);
    };
  }, []);

  const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    if (isLoading && status === 'AUTHENTICATING') {
      return { success: false, error: 'Login is already processing. Please wait.' };
    }
    setIsLoading(true);
    setStatus('AUTHENTICATING');
    setError(null);

    try {
      const response = await authService.login(credentials);

      if (response.success && response.session) {
        if (response.session.token) {
          await tokenStorage.setToken(response.session.token);
        }
        setSession(response.session);
        setStatus('AUTHENTICATED');
        setIsLoading(false);
        return response;
      } else {
        const errMessage = response.error || 'Authentication failed. Please verify credentials.';
        setError(errMessage);
        setStatus('ERROR');
        setIsLoading(false);
        return { success: false, error: errMessage };
      }
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : 'A network error occurred. Please try again.';
      setError(errMessage);
      setStatus('ERROR');
      setIsLoading(false);
      return { success: false, error: errMessage };
    }
  };

  const register = async (data: DriverRegistrationData): Promise<AuthResponse> => {
    setIsLoading(true);
    setStatus('AUTHENTICATING');
    setError(null);

    try {
      const response = await authService.register(data);

      if (response.success && response.session) {
        if (response.session.token) {
          await tokenStorage.setToken(response.session.token);
        }
        setSession(response.session);
        setStatus('AUTHENTICATED');
        setIsLoading(false);
        return response;
      } else {
        const errMessage = response.error || 'Registration failed. Please check your information.';
        setError(errMessage);
        setStatus('ERROR');
        setIsLoading(false);
        return { success: false, error: errMessage };
      }
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : 'An error occurred during registration.';
      setError(errMessage);
      setStatus('ERROR');
      setIsLoading(false);
      return { success: false, error: errMessage };
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authService.logout();
      await tokenStorage.clearToken();
    } finally {
      setSession(null);
      setStatus('UNAUTHENTICATED');
      setError(null);
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
    if (status === 'ERROR') {
      setStatus('UNAUTHENTICATED');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        status,
        role: session?.role ?? null,
        session,
        error,
        isLoading,
        login,
        register,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
