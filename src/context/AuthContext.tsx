import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  AuthSession,
  AuthStatus,
  LoginCredentials,
  DriverRegistrationData,
  AuthResponse,
} from '../types';
import { authService } from '../services';

interface AuthContextValue {
  status: AuthStatus;
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
  const [status, setStatus] = useState<AuthStatus>('UNAUTHENTICATED');
  const [session, setSession] = useState<AuthSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Check if an existing session exists upon app start
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const existingSession = await authService.getCurrentSession();
        if (isMounted && existingSession) {
          setSession(existingSession);
          setStatus('AUTHENTICATED');
        }
      } catch (err) {
        if (isMounted) {
          setStatus('UNAUTHENTICATED');
        }
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    setIsLoading(true);
    setStatus('AUTHENTICATING');
    setError(null);

    try {
      const response = await authService.login(credentials);

      if (response.success && response.session) {
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
