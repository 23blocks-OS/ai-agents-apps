import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const API_URL = (window as any).__BLOCKS_API_URL__ || '';
const API_KEY = (window as any).__BLOCKS_API_KEY__ || '';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: null,
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  });

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setState(s => ({ ...s, isLoading: true, error: null }));

    try {
      const response = await fetch(`${API_URL}/api/v1/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'AppId': API_KEY,
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Login failed');
      }

      const data = await response.json();

      // Adjust based on actual API response structure
      const token = data.token || data.access_token || data.data?.token;
      const user = data.user || data.data?.user || { id: data.user_id, email };

      setState({
        token,
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return true;
    } catch (err) {
      setState(s => ({
        ...s,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Login failed',
      }));
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setState({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  }, []);

  const clearError = useCallback(() => {
    setState(s => ({ ...s, error: null }));
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
