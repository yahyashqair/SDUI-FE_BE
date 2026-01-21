# React Hook Templates

Custom hooks for reusable stateful logic.

## useAuth Hook

```ts
/**
 * hooks/useAuth.ts
 * Authentication state management
 */

import { useState, useEffect, useCallback } from 'react';
import type { User } from '@/types/UserTypes';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

let authContext: AuthContextValue | null = null;

export function useAuth(): AuthContextValue {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Initialize auth from localStorage
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

  const login = useCallback(async (email: string, password: string) => {
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
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth-token');
    localStorage.removeItem('auth-user');
    setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
  }, []);

  const refresh = useCallback(async () => {
    const token = localStorage.getItem('auth-token');
    if (!token) return;

    try {
      const response = await fetch('/api/auth/refresh', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const { user, token: newToken } = await response.json();
        localStorage.setItem('auth-token', newToken);
        localStorage.setItem('auth-user', JSON.stringify(user));
        setState({ user, token: newToken, isLoading: false, isAuthenticated: true });
      } else {
        logout();
      }
    } catch {
      logout();
    }
  }, [logout]);

  if (!authContext) {
    authContext = {
      ...state,
      login,
      logout,
      refresh,
    };
  }

  return authContext;
}
```

## useFetch Hook

```ts
/**
 * hooks/useFetch.ts
 * Generic data fetching hook with loading/error states
 */

import { useState, useEffect, useCallback } from 'react';

interface FetchState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

interface FetchOptions extends RequestInit {
  enabled?: boolean;
  refetchInterval?: number;
}

export function useFetch<T>(
  url: string,
  options: FetchOptions = {}
): FetchState<T> & { refetch: () => void } {
  const { enabled = true, refetchInterval, ...fetchOptions } = options;

  const [state, setState] = useState<FetchState<T>>({
    data: null,
    isLoading: enabled,
    error: null,
  });

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: T = await response.json();
      setState({ data, isLoading: false, error: null });
    } catch (error) {
      setState({
        data: null,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Unknown error'),
      });
    }
  }, [url, enabled, fetchOptions]);

  useEffect(() => {
    fetchData();

    if (refetchInterval) {
      const interval = setInterval(fetchData, refetchInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, refetchInterval]);

  return { ...state, refetch: fetchData };
}
```

## useForm Hook

```ts
/**
 * hooks/useForm.ts
 * Form state management with validation
 */

import { useState, useCallback } from 'react';
import type { z } from 'zod';

export function useForm<T extends z.ZodType>(
  schema: T,
  initialValues: z.infer<T>
) {
  type FormValues = z.infer<T>;
  type FormErrors = Partial<Record<keyof FormValues, string>>;

  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormValues, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setValue = useCallback(
    (field: keyof FormValues, value: FormValues[keyof FormValues]) => {
      setValues((prev) => ({ ...prev, [field]: value }));
      // Clear error when value changes
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [errors]
  );

  const setTouchedField = useCallback((field: keyof FormValues) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const validate = useCallback((): boolean => {
    const result = schema.safeParse(values);

    if (!result.success) {
      const fieldErrors: FormErrors = {};
      result.error.errors.forEach((error) => {
        const field = error.path[0] as keyof FormValues;
        fieldErrors[field] = error.message;
      });
      setErrors(fieldErrors);
      return false;
    }

    setErrors({});
    return true;
  }, [values, schema]);

  const handleSubmit = useCallback(
    async (onSubmit: (values: FormValues) => Promise<void> | void) => {
      if (!validate()) return;

      setIsSubmitting(true);

      try {
        await onSubmit(values);
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, validate]
  );

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    setValue,
    setTouchedField,
    handleSubmit,
    reset,
    isValid: Object.keys(errors).length === 0,
  };
}
```

## useDebounce Hook

```ts
/**
 * hooks/useDebounce.ts
 * Debounce a value
 */

import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
```

## useLocalStorage Hook

```ts
/**
 * hooks/useLocalStorage.ts
 * Sync state with localStorage
 */

import { useState, useEffect, useCallback } from 'react';

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}
```

## useIntersectionObserver Hook

```ts
/**
 * hooks/useIntersectionObserver.ts
 * Detect when element enters viewport
 */

import { useState, useEffect, useRef } from 'react';

interface UseIntersectionObserverOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
): [React.RefObject<Element>, boolean] {
  const { threshold = 0, rootMargin = '0px', triggerOnce = false } = options;

  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef<Element>(null);
  const wasIntersecting = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isElementIntersecting = entry.isIntersecting;

        if (triggerOnce && wasIntersecting.current) {
          return;
        }

        setIsIntersecting(isElementIntersecting);

        if (isElementIntersecting) {
          wasIntersecting.current = true;
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce]);

  return [ref, isIntersecting];
}
```

## Usage Example

```tsx
import { useAuth } from '@/hooks/useAuth';
import { useFetch } from '@/hooks/useFetch';
import { useForm } from '@/hooks/useForm';
import { useDebounce } from '@/hooks/useDebounce';
import { z } from 'zod';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();
  const { data, isLoading, error } = useFetch<User[]>('/api/users');

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const form = useForm(
    z.object({
      email: z.string().email(),
      password: z.string().min(8),
    }),
    { email: '', password: '' }
  );

  // ... component logic
}
```
