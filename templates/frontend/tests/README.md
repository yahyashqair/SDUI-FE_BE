# Frontend Testing Templates

Testing guidelines and templates for the frontend.

## Testing Setup

The project uses:
- **Vitest** for unit tests
- **Testing Library** for component tests
- **Playwright** for E2E tests

## Component Test Template

```tsx
/**
 * components/__tests__/Button.test.tsx
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../Button';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick handler when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', () => {
    const handleClick = vi.fn();
    render(
      <Button onClick={handleClick} disabled>
        Click me
      </Button>
    );

    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('applies correct variant class', () => {
    const { container } = render(
      <Button variant="danger">Delete</Button>
    );
    expect(container.firstChild).toHaveClass('bg-red-600');
  });

  it('shows loading state', () => {
    const { container } = render(
      <Button loading>Submit</Button>
    );
    expect(container.firstChild).toHaveClass('opacity-50');
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(
      <Button aria-label="Close dialog" onClick={() => {}}>
        ×
      </Button>
    );
    expect(screen.getByLabelText('Close dialog')).toBeInTheDocument();
  });
});
```

## Hook Test Template

```ts
/**
 * hooks/__tests__/useAuth.test.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth } from '../useAuth';

// Mock fetch
global.fetch = vi.fn();

describe('useAuth', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('initializes with unauthenticated state', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('logs in successfully', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
        token: 'fake-jwt-token',
      }),
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.email).toBe('test@example.com');
    expect(localStorage.getItem('auth-token')).toBe('fake-jwt-token');
  });

  it('logs out and clears storage', () => {
    localStorage.setItem('auth-token', 'fake-token');
    localStorage.setItem('auth-user', JSON.stringify({ id: '1' }));

    const { result } = renderHook(() => useAuth());

    act(() => {
      result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem('auth-token')).toBeNull();
  });

  it('handles login errors', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
    });

    const { result } = renderHook(() => useAuth());

    await expect(
      act(async () => {
        await result.current.login('test@example.com', 'wrong-password');
      })
    ).rejects.toThrow('Login failed');
  });
});
```

## Utility Test Template

```ts
/**
 * lib/__tests__/apiClient.test.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { api } from '../apiClient';

global.fetch = vi.fn();

describe('apiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('makes GET request', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: 'test' }),
    });

    const result = await api.get('/test');

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    );
    expect(result).toEqual({ data: 'test' });
  });

  it('makes POST request with data', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    await api.post('/test', { name: 'Test' });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'Test' }),
      })
    );
  });

  it('includes auth token when available', async () => {
    localStorage.setItem('auth-token', 'fake-token');
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: 'test' }),
    });

    await api.get('/protected');

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/protected',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer fake-token',
        }),
      })
    );
  });

  it('throws error on non-OK response', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: async () => ({ error: 'Not found' }),
    });

    await expect(api.get('/not-found')).rejects.toThrow('API Error: 404 Not Found');
  });
});
```

## Service Test Template

```ts
/**
 * services/__tests__/userService.test.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserService } from '../userService';

global.fetch = vi.fn();

describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    vi.clearAllMocks();
    userService = new UserService();
  });

  it('fetches users', async () => {
    const mockUsers = [
      { id: '1', email: 'user1@example.com', name: 'User 1' },
      { id: '2', email: 'user2@example.com', name: 'User 2' },
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockUsers,
    });

    const users = await userService.getUsers();

    expect(users).toHaveLength(2);
    expect(users[0].email).toBe('user1@example.com');
  });

  it('creates user with valid input', async () => {
    const input = {
      email: 'new@example.com',
      name: 'New User',
      password: 'securepassword',
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: { id: '3', ...input } }),
    });

    const user = await userService.createUser(input);

    expect(user.email).toBe(input.email);
  });

  it('validates invalid email', async () => {
    const input = {
      email: 'invalid-email',
      name: 'Test',
      password: 'password',
    };

    await expect(userService.createUser(input)).rejects.toThrow();
  });
});
```

## E2E Test Template (Playwright)

```ts
/**
 * e2e/login.spec.ts
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('shows validation errors for empty fields', async ({ page }) => {
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
  });

  test('logs in with valid credentials', async ({ page }) => {
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Welcome back')).toBeVisible();
  });

  test('shows error for invalid credentials', async ({ page }) => {
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'wrong-password');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });

  test('redirects to dashboard if already logged in', async ({ page }) => {
    // Set auth cookie
    await page.context().addCookies([
      {
        name: 'auth-token',
        value: 'fake-token',
        domain: 'localhost',
        path: '/',
      },
    ]);

    await page.goto('/login');
    await expect(page).toHaveURL('/dashboard');
  });
});

test.describe('Dashboard', () => {
  test('displays user data', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Navigate to dashboard
    await expect(page.locator('h1')).toContainText('Dashboard');
    await expect(page.locator('[data-testid="user-stats"]')).toBeVisible();
  });

  test('allows navigation to settings', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('a[href="/settings"]');

    await expect(page).toHaveURL('/settings');
    await expect(page.locator('h1')).toContainText('Settings');
  });
});
```

## Vitest Config Template

```ts
/**
 * vitest.config.ts
 */

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/types/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

## Test Setup File

```ts
/**
 * src/tests/setup.ts
 * Vitest setup file
 */

import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});
```

## Testing Best Practices

1. **Test behavior, not implementation**: Focus on what the component does, not how
2. **Use getBy* for expected elements**: Use findBy* for async, queryBy* for absence
3. **Mock external dependencies**: Mock API calls, localStorage, etc.
4. **Test user interactions**: Test what users see and do
5. **Keep tests isolated**: Each test should be independent
6. **Use descriptive test names**: Should describe what is being tested
7. **Test edge cases**: Error states, empty states, loading states
8. **Aim for high coverage**: But prioritize critical paths
