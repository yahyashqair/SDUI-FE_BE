# Frontend Development Templates

This directory contains templates and guidelines for frontend development in the SDUI/MFE platform.

## Tech Stack

- **Framework**: Astro 5+ with Server Mode
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4+
- **State Management**: React Context + Hooks
- **Validation**: Zod
- **Testing**: Vitest + Testing Library + Playwright

## Project Structure

```
src/
├── components/         # Reusable UI components
│   ├── astro/         # Astro components (static, SSR)
│   ├── react/         # React components (interactive)
│   └── system/        # System-level components
├── layouts/           # Page layouts
├── pages/             # Routes (file-based routing)
├── hooks/             # Custom React hooks
├── lib/               # Utilities and helpers
├── services/          # API and data services
├── types/             # TypeScript types
├── styles/            # Global styles
├── assets/            # Static assets
├── db/                # Database queries
├── auth/              # Authentication logic
├── security/          # Security utilities
├── ai/                # AI/ML integrations
└── dashboard/         # Dashboard-specific code
```

## Development Guidelines

### Component Creation

1. **Astro Components** (`.astro`): Use for static content, SEO, SSR
2. **React Components** (`.tsx`): Use for interactivity, forms, dynamic UI

### File Naming

- Components: PascalCase (`UserProfile.astro`, `DataTable.tsx`)
- Utilities: camelCase (`formatDate.ts`, `apiClient.ts`)
- Hooks: camelCase with `use` prefix (`useAuth.ts`, `useData.ts`)
- Types: PascalCase (`UserTypes.ts`, `APITypes.ts`)

### Import Order

```typescript
// 1. External dependencies
import { useState, useEffect } from 'react';

// 2. Internal components
import { Button } from '@/components/react/Button';

// 3. Utilities and services
import { apiClient } from '@/lib/apiClient';

// 4. Types
import type { User } from '@/types/UserTypes';
```

## Getting Started

See individual template directories for detailed examples:

- [Component Templates](./components/README.md)
- [Layout Templates](./layouts/README.md)
- [Page Templates](./pages/README.md)
- [Hook Templates](./hooks/README.md)
- [Service Templates](./services/README.md)

## Best Practices

1. **Server-First**: Prefer Astro components for static content
2. **Islands Architecture**: Use React components only for interactivity
3. **Type Safety**: Always use TypeScript with strict mode
4. **Accessibility**: Follow WCAG 2.1 AA guidelines
5. **Performance**: Lazy load routes and heavy components
6. **Security**: Sanitize user input, validate with Zod
