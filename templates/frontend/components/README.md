# Component Templates

This directory contains templates for creating frontend components.

## Component Types

### Astro Components (`.astro`)

**Use for:**
- Static content
- SEO-critical pages
- Server-side rendering
- Layout components

**Template:** See [astro/](./astro/)

### React Components (`.tsx`)

**Use for:**
- Interactive UI
- Forms and validation
- Dynamic content
- State management

**Template:** See [react/](./react/)

### System Components

**Use for:**
- Error boundaries
- Loading states
- Toasts/notifications
- Modals

**Template:** See [system/](./system/)

## Component Checklist

Before creating a new component:

- [ ] Determine if Astro or React is appropriate
- [ ] Check if similar component exists
- [ ] Define props interface with TypeScript
- [ ] Add accessibility attributes
- [ ] Include error handling
- [ ] Write unit tests
- [ ] Document with JSDoc

## Example Usage

```astro
---
// Import React component for interactivity
import InteractiveButton from '@/components/react/InteractiveButton.tsx';
// Import Astro component for static content
import StaticHeader from '@/components/astro/StaticHeader.astro';
---

<StaticHeader title="My Page" />
<InteractiveButton onClick={() => console.log('clicked')} />
```
