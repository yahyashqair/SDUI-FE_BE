/**
 * useAuth hook
 */

import { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useAuth(): AuthState & {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
} {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    const token = localStorage.getItem('auth-token');
    const userJson = localStorage.getItem('auth-user');

    if (token && userJson) {
      try {
        setState({
          user: JSON.parse(userJson),
          token,
          isLoading: false,
          isAuthenticated: true,
        });
      } catch {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    } else {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const { user, token } = await response.json();

    localStorage.setItem('auth-token', token);
    localStorage.setItem('auth-user', JSON.stringify(user));

    setState({ user, token, isLoading: false, isAuthenticated: true });
  };

  const logout = () => {
    localStorage.removeItem('auth-token');
    localStorage.removeItem('auth-user');
    setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
  };

  return {
    ...state,
    login,
    logout,
  };
}
