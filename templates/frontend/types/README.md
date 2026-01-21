# Type Templates

TypeScript type definitions and schemas.

## Base Types

```ts
/**
 * types/base.ts
 * Common base types used across the application
 */

export interface Entity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Timestamps {
  createdAt: string;
  updatedAt: string;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
  page?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  meta?: Record<string, unknown>;
}
```

## User Types

```ts
/**
 * types/UserTypes.ts
 * User-related type definitions
 */

import { z } from 'zod';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends User {
  bio?: string;
  location?: string;
  website?: string;
  socialLinks?: {
    twitter?: string;
    github?: string;
    linkedin?: string;
  };
}

export interface UserSession {
  user: User;
  token: string;
  refreshToken: string;
  expiresAt: string;
}

// Zod schemas for validation
export const CreateUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const UpdateUserSchema = z.object({
  name: z.string().min(2).optional(),
  bio: z.string().max(500).optional(),
  location: z.string().optional(),
  website: z.string().url().optional(),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
```

## API Types

```ts
/**
 * types/APITypes.ts
 * API request/response types
 */

import { z } from 'zod';

export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}

export interface ApiRequestConfig {
  method: HttpMethod;
  url: string;
  params?: Record<string, string | number>;
  data?: unknown;
  headers?: Record<string, string>;
  timeout?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}

// Generic API response schemas
export const SuccessResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    meta: z.object({
      timestamp: z.string(),
      requestId: z.string(),
    }),
  });

export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    message: z.string(),
    code: z.string().optional(),
    details: z.unknown().optional(),
  }),
});
```

## Form Types

```ts
/**
 * types/FormTypes.ts
 * Form-related type definitions
 */

import { z } from 'zod';

export interface FormField<T = unknown> {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'checkbox' | 'radio';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  defaultValue?: T;
  options?: Array<{ value: string; label: string }>;
  validation?: z.ZodType<T>;
  helperText?: string;
}

export interface FormConfig<T extends Record<string, unknown>> {
  fields: FormField[];
  schema: z.ZodType<T>;
  submitLabel?: string;
  onCancel?: () => void;
}

export interface FormState<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isDirty: boolean;
  isValid: boolean;
  isSubmitting: boolean;
}

// Example: Contact form types
export const ContactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

export type ContactFormData = z.infer<typeof ContactFormSchema>;
```

## Component Types

```ts
/**
 * types/ComponentTypes.ts
 * Reusable component type definitions
 */

import type { HTMLAttributes, ReactNode } from 'react';

// Button variants
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface BaseButtonProps extends HTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

// Input types
export interface BaseInputProps extends HTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
}

// Select types
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface BaseSelectProps extends HTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  helperText?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

// Table types
export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => ReactNode;
  width?: string | number;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  keyField: keyof T;
  sortable?: boolean;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyMessage?: string;
}
```

## Navigation Types

```ts
/**
 * types/NavigationTypes.ts
 * Navigation and routing types
 */

export interface NavLink {
  href: string;
  label: string;
  icon?: string;
  badge?: number | string;
  external?: boolean;
  children?: NavLink[];
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface NavSection {
  title: string;
  items: NavLink[];
}

export interface SidebarProps {
  navigation: NavSection[];
  currentPath: string;
  collapsed?: boolean;
  onCollapse?: () => void;
}
```

## Notification Types

```ts
/**
 * types/NotificationTypes.ts
 * Notification/toast types
 */

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title?: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface NotificationOptions {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  maxNotifications?: number;
  duration?: number;
}
```

## Export All Types

```ts
/**
 * types/index.ts
 * Central export for all types
 */

// Base types
export * from './base';

// Domain types
export * from './UserTypes';
export * from './APITypes';

// UI types
export * from './FormTypes';
export * from './ComponentTypes';
export * from './NavigationTypes';
export * from './NotificationTypes';
```
