# SDUI (Server-Driven UI) Implementation Guide

A complete Server-Driven UI implementation using Astro framework and React. This system allows the server to control the UI structure dynamically, enabling features like A/B testing, feature flags, and personalized experiences without app updates.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
- [Available Components](#available-components)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Testing](#testing)
- [Best Practices](#best-practices)

## Overview

Server-Driven UI (SDUI) is an architectural pattern where the server sends component definitions that the client renders dynamically. This implementation provides:

- Type-safe component definitions with TypeScript
- Centralized component registry
- Dynamic rendering based on server data
- Action system for navigation and API calls
- Built-in state management
- Comprehensive testing utilities

## Features

- **Type-Safe**: Full TypeScript support with comprehensive type definitions
- **Component Registry**: Central registry for dynamic component resolution
- **Action System**: Server-defined actions for navigation and API calls
- **State Management**: Built-in loading states, error handling, and form values
- **Styling Options**: Tailwind CSS classes with flexible styling system
- **Performance**: Astro's zero-JS by default with React hydration
- **Testing**: Comprehensive test suite with Vitest

## Project Structure

```
src/
├── sdui/
│   ├── types.ts           # TypeScript type definitions
│   ├── registry.ts        # Component registry system
│   ├── renderer.tsx       # Dynamic component renderer
│   ├── server.ts          # Server-side utilities
│   ├── examples.ts        # Pre-built example views
│   ├── components.ts      # Component registration
│   ├── index.ts           # Main exports
│   └── __tests__/         # Unit tests
├── components/
│   └── react/             # React component implementations
│       ├── Button.tsx
│       ├── Text.tsx
│       ├── Container.tsx
│       ├── Card.tsx
│       ├── Hero.tsx
│       ├── List.tsx
│       ├── Input.tsx
│       ├── Image.tsx
│       ├── Badge.tsx
│       ├── Divider.tsx
│       └── Spacer.tsx
└── pages/
    └── sdui/              # Demo pages
        ├── index.astro
        ├── hero.astro
        ├── showcase.astro
        ├── product.astro
        ├── dashboard.astro
        ├── blog.astro
        └── interactive.astro
```

## Quick Start

### 1. Installation

The SDUI system is already integrated into this project. To use it in a new project:

```bash
npm install @astrojs/react react react-dom
```

### 2. Register Components

Import the component registry to enable all SDUI components:

```astro
---
import '../../sdui/components.ts';
---
```

### 3. Create a View

Use server-side utilities to create an SDUI view:

```typescript
import { hero, button, createView, navigateAction } from '../../sdui/server';

const view = createView(
  hero('Welcome to SDUI', {
    subtitle: 'Server-Driven UI made easy',
    primaryAction: button('Get Started', {
      variant: 'primary',
      action: navigateAction('/getting-started'),
    }),
    alignment: 'center',
  })
);
```

### 4. Render on Client

Use the SDUIRenderer component to render the view:

```astro
---
import { SDUIRenderer } from '../../sdui/renderer';
---

<SDUIRenderer client:load component={view.root} />
```

## Core Concepts

### Component Structure

Every SDUI component has a base structure:

```typescript
interface SDUIComponent {
  id: string;           // Unique identifier
  type: string;         // Component type name
  className?: string;   // CSS classes
  style?: object;       // Inline styles
  visible?: boolean;    // Visibility flag
  aria?: object;        // Accessibility attributes
  testId?: string;      // Test ID
}
```

### View Structure

A complete SDUI view includes:

```typescript
interface SDUIView {
  version: string;       // Schema version
  title?: string;        // Page title
  meta?: {               // SEO metadata
    description?: string;
    keywords?: string[];
  };
  root: SDUIComponent;   // Root component tree
}
```

### Action System

Actions define user interactions:

```typescript
interface SDUIAction {
  type: 'navigation' | 'api' | 'custom' | 'scroll';
  payload: string | object;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: object;
}
```

## Available Components

### Text

Displays text content with various typography styles.

```typescript
text('Hello World', {
  variant: 'h1',        // h1-h6, p, span, label
  size: '2xl',          // xs, sm, md, lg, xl, 2xl, 3xl
  weight: 'bold',       // normal, medium, semibold, bold
  align: 'center',      // left, center, right
  color: 'text-blue-600',
})
```

### Button

Interactive button with variants and states.

```typescript
button('Click Me', {
  variant: 'primary',   // primary, secondary, outline, ghost, danger
  size: 'lg',          // sm, md, lg
  disabled: false,
  loading: false,
  action: navigateAction('/path'),
})
```

### Container

Flex container for layout.

```typescript
container([child1, child2], {
  direction: 'row',     // row, column
  align: 'center',      // start, center, end, stretch
  justify: 'space-between',  // start, center, end, space-between
  gap: '1rem',
  padding: '2rem',
  maxWidth: '1200px',
})
```

### Card

Card component with various visual styles.

```typescript
card([content], {
  variant: 'elevated',  // default, elevated, outlined, filled
  padding: '1.5rem',
  clickable: true,
  action: navigateAction('/details'),
})
```

### Hero

Hero section with title, subtitle, and actions.

```typescript
hero('Welcome', {
  subtitle: 'Get started',
  description: 'Full description here',
  primaryAction: button('Primary'),
  secondaryAction: button('Secondary'),
  image: image('/photo.jpg', 'Alt text'),
  alignment: 'center',
  size: 'lg',
})
```

### Input

Form input with validation.

```typescript
input('email', {
  placeholder: 'your@email.com',
  inputType: 'email',
  required: true,
  error: 'Invalid email',
})
```

### List

List component with various styles.

```typescript
list([item1, item2], {
  variant: 'bulleted',  // bulleted, numbered, none
  spacing: 'normal',    // tight, normal, relaxed
})
```

### Image

Image component with fit options.

```typescript
image('/photo.jpg', 'Description', {
  width: '100%',
  height: 'auto',
  fit: 'cover',        // cover, contain, fill, none, scale-down
  loading: 'lazy',     // lazy, eager
})
```

### Badge

Badge/tag component.

```typescript
badge('New', {
  variant: 'success',  // default, success, warning, error, info
  size: 'md',          // sm, md
})
```

### Divider

Visual divider.

```typescript
divider({
  orientation: 'horizontal',  // horizontal, vertical
  thickness: '2px',
  color: '#e5e7eb',
})
```

### Spacer

Empty space for layout.

```typescript
spacer('2rem')
```

## API Reference

### Server Utilities

#### `text(content, options)`
Create a text component.

#### `button(label, options)`
Create a button component.

#### `container(children, options)`
Create a flex container.

#### `card(children, options)`
Create a card component.

#### `hero(title, options)`
Create a hero section.

#### `image(src, alt, options)`
Create an image component.

#### `input(name, options)`
Create an input component.

#### `list(items, options)`
Create a list component.

#### `badge(label, options)`
Create a badge component.

#### `divider(options)`
Create a divider.

#### `spacer(size)`
Create a spacer.

### Action Creators

#### `navigateAction(url)`
Create a navigation action.

#### `apiAction(url, method, headers)`
Create an API action.

#### `scrollAction(selector)`
Create a scroll action.

### View Creation

#### `createView(root, options)`
Create a complete SDUI view.

#### `SDUIBuilder`
Fluent API for building views.

```typescript
const view = new SDUIBuilder()
  .setRoot(rootComponent)
  .setTitle('Page Title')
  .setMeta({ description: 'Description' })
  .build();
```

## Examples

### Simple Hero

```typescript
import { hero, button, createView, navigateAction } from '../../sdui/server';

const view = createView(
  hero('Welcome to SDUI', {
    subtitle: 'Server-Driven UI made easy',
    primaryAction: button('Get Started', {
      variant: 'primary',
      action: navigateAction('/start'),
    }),
    alignment: 'center',
  })
);
```

### Product Card

```typescript
import { card, text, image, button, apiAction } from '../../sdui/server';

const productCard = card([
  image('/product.jpg', 'Product Name', {
    width: '100%',
    height: '200px',
  }),
  text('Product Name', { variant: 'h3', weight: 'bold' }),
  text('$99.99', { variant: 'p', size: 'lg' }),
  button('Add to Cart', {
    variant: 'primary',
    action: apiAction('/api/cart/add', 'POST'),
  }),
], { variant: 'elevated' });
```

### Form Section

```typescript
import { container, input, button, text, apiAction } from '../../sdui/server';

const formSection = container([
  text('Contact Form', { variant: 'h2' }),
  input('name', { placeholder: 'Your Name', required: true }),
  input('email', {
    placeholder: 'your@email.com',
    inputType: 'email',
    required: true,
  }),
  input('message', { placeholder: 'Your Message' }),
  button('Submit', {
    variant: 'primary',
    action: apiAction('/api/contact', 'POST'),
  }),
], { direction: 'column', gap: '1rem' });
```

## Testing

Run the test suite:

```bash
npm test              # Run tests
npm run test:ui       # Run tests with UI
npm run test:run      # Run tests once
```

### Test Structure

Tests are located in `src/sdui/__tests__/`:

- `registry.test.ts` - Component registry tests
- `server.test.ts` - Server utilities tests
- `types.test.ts` - Type system tests

## Best Practices

### 1. Always Use Unique IDs

```typescript
// Good
const button1 = button('Click', { id: 'unique-button-1' });
const button2 = button('Click', { id: 'unique-button-2' });

// Avoid
const button1 = button('Click');
const button2 = button('Click');  // Same ID
```

### 2. Leverage Type Safety

```typescript
// Use type assertions when needed
const component: SDUIButtonComponent = button('Click', {
  variant: 'primary',
});
```

### 3. Compose Complex Views

```typescript
const complexView = createView(
  container([
    hero('Title', { ... }),
    divider(),
    container([
      card([ ... ]),
      card([ ... ]),
    ], { direction: 'row' }),
  ], { direction: 'column' })
);
```

### 4. Handle Actions Properly

```typescript
// Always provide proper action types
const action: SDUIAction = {
  type: 'navigation',
  payload: '/path',
};

button('Click', { action });
```

### 5. Use Responsive Design

```typescript
const container = container([ ... ], {
  className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
});
```

## Demo Pages

The implementation includes several demo pages:

- `/sdui` - Main demo index
- `/sdui/hero` - Hero section example
- `/sdui/showcase` - All components showcase
- `/sdui/product` - E-commerce product page
- `/sdui/dashboard` - Admin dashboard
- `/sdui/blog` - Blog post example
- `/sdui/interactive` - Interactive form demo

## License

This is a template project. Feel free to modify and use as needed.
