# Service Templates

Services handle external API communication and data transformation.

## Base Service Class

```ts
/**
 * services/baseService.ts
 * Base class for all services with common functionality
 */

import type { z } from 'zod';

export class ServiceError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

export abstract class BaseService {
  protected baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  protected async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new ServiceError(
        `Request failed: ${response.statusText}`,
        response.status
      );
    }

    return response.json();
  }

  protected async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  protected async post<T, D = unknown>(
    endpoint: string,
    data: D
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  protected async put<T, D = unknown>(
    endpoint: string,
    data: D
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  protected async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  protected validate<T>(
    schema: z.ZodSchema<T>,
    data: unknown
  ): T {
    return schema.parse(data);
  }
}
```

## User Service

```ts
/**
 * services/userService.ts
 * User-related API operations
 */

import { z } from 'zod';
import { BaseService, ServiceError } from './baseService';

// Schemas
const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(['user', 'admin', 'moderator']),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(8),
});

const UpdateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
});

export type User = z.infer<typeof UserSchema>;
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;

export class UserService extends BaseService {
  constructor() {
    super('/api/users');
  }

  async getUsers(params?: { limit?: number; offset?: number }): Promise<User[]> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.offset) searchParams.set('offset', String(params.offset));

    const users = await this.get<User[]>(
      searchParams.toString() ? `?${searchParams}` : ''
    );

    return users.map((user) => this.validate(UserSchema, user));
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.get<{ user: User }>(`/${id}`);
    return this.validate(UserSchema, user.user);
  }

  async createUser(input: CreateUserInput): Promise<User> {
    this.validate(CreateUserSchema, input);

    const user = await this.post<{ user: User }, CreateUserInput>('', input);
    return this.validate(UserSchema, user.user);
  }

  async updateUser(id: string, input: UpdateUserInput): Promise<User> {
    this.validate(UpdateUserSchema, input);

    const user = await this.put<{ user: User }, UpdateUserInput>(
      `/${id}`,
      input
    );
    return this.validate(UserSchema, user.user);
  }

  async deleteUser(id: string): Promise<void> {
    await this.delete(`/${id}`);
  }
}

// Singleton instance
export const userService = new UserService();
```

## Auth Service

```ts
/**
 * services/authService.ts
 * Authentication and authorization operations
 */

import { z } from 'zod';
import { BaseService } from './baseService';
import { storage } from '@/lib/storage';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
});

const AuthResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    email: z.string(),
    name: z.string(),
  }),
  token: z.string(),
  refreshToken: z.string(),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type AuthUser = z.infer<typeof AuthResponseSchema>['user'];

const TOKEN_KEY = 'auth-token';
const REFRESH_TOKEN_KEY = 'refresh-token';
const USER_KEY = 'auth-user';

export class AuthService extends BaseService {
  constructor() {
    super('/api/auth');
  }

  async login(input: LoginInput): Promise<{ user: AuthUser; token: string }> {
    this.validate(LoginSchema, input);

    const response = await this.post('/login', input);
    const { user, token, refreshToken } = AuthResponseSchema.parse(response);

    // Store auth data
    storage.set(TOKEN_KEY, token);
    storage.set(REFRESH_TOKEN_KEY, refreshToken);
    storage.set(USER_KEY, user);

    return { user, token };
  }

  async register(input: RegisterInput): Promise<{ user: AuthUser; token: string }> {
    this.validate(RegisterSchema, input);

    const response = await this.post('/register', input);
    const { user, token, refreshToken } = AuthResponseSchema.parse(response);

    storage.set(TOKEN_KEY, token);
    storage.set(REFRESH_TOKEN_KEY, refreshToken);
    storage.set(USER_KEY, user);

    return { user, token };
  }

  async logout(): Promise<void> {
    try {
      await this.post('/logout', {});
    } finally {
      storage.remove(TOKEN_KEY);
      storage.remove(REFRESH_TOKEN_KEY);
      storage.remove(USER_KEY);
    }
  }

  async refresh(): Promise<string> {
    const refreshToken = storage.get<string | null>(REFRESH_TOKEN_KEY, null);
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.post('/refresh', { refreshToken });
    const { token, refreshToken: newRefreshToken } = AuthResponseSchema.parse(response);

    storage.set(TOKEN_KEY, token);
    storage.set(REFRESH_TOKEN_KEY, newRefreshToken);

    return token;
  }

  getCurrentUser(): AuthUser | null {
    return storage.get<AuthUser | null>(USER_KEY, null);
  }

  getToken(): string | null {
    return storage.get<string | null>(TOKEN_KEY, null);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export const authService = new AuthService();
```

## Data Service (with caching)

```ts
/**
 * services/dataService.ts
 * Data service with built-in caching
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export class DataService<T> extends BaseService {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private cacheDuration: number;

  constructor(baseUrl: string, cacheDuration = 5 * 60 * 1000) {
    super(baseUrl);
    this.cacheDuration = cacheDuration;
  }

  private setCache(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  private getCache(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > this.cacheDuration;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  async fetch(
    endpoint: string,
    options: { forceRefresh?: boolean } = {}
  ): Promise<T> {
    const cacheKey = endpoint;

    if (!options.forceRefresh) {
      const cached = this.getCache(cacheKey);
      if (cached) return cached;
    }

    const data = await this.get<T>(endpoint);
    this.setCache(cacheKey, data);

    return data;
  }

  clearCache(): void {
    this.cache.clear();
  }

  invalidate(endpoint: string): void {
    this.cache.delete(endpoint);
  }
}
```

## File Upload Service

```ts
/**
 * services/fileService.ts
 * File upload and management
 */

import { BaseService } from './baseService';

export class FileService extends BaseService {
  constructor() {
    super('/api/files');
  }

  async upload(file: File, options?: {
    onProgress?: (progress: number) => void;
  }): Promise<{ url: string; id: string }> {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && options?.onProgress) {
          const progress = (e.loaded / e.total) * 100;
          options.onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new Error(`Upload failed: ${xhr.statusText}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      xhr.open('POST', this.baseUrl);
      xhr.send(formData);
    });
  }

  async delete(id: string): Promise<void> {
    await this.delete(`/${id}`);
  }

  getUploadUrl(): string {
    return this.baseUrl;
  }
}

export const fileService = new FileService();
```

## Usage Example

```ts
// In your component or hook
import { userService } from '@/services/userService';
import { authService } from '@/services/authService';

// Get users
const users = await userService.getUsers({ limit: 10 });

// Create user
const newUser = await userService.createUser({
  email: 'user@example.com',
  name: 'John Doe',
  password: 'securepassword',
});

// Login
const { user, token } = await authService.login({
  email: 'user@example.com',
  password: 'securepassword',
});

// Check auth
if (authService.isAuthenticated()) {
  const currentUser = authService.getCurrentUser();
}
```
