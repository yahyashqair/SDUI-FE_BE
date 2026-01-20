# SDUI - Server-Driven UI with Astro & React

A complete Server-Driven UI implementation using Astro framework and React. This system allows the server to control the UI structure dynamically, enabling features like A/B testing, feature flags, and personalized experiences without app updates.

## Features

- **Real AI Agent**: Integrated OpenAI-compatible agent for planning and code generation
- **Release Pipeline**: Snapshot and deploy versions of your Micro-Frontends and Backend Functions
- **Master Dashboard**: Central control plane to manage MFEs, Functions, Routes, and Releases
- **Type-Safe**: Full TypeScript support with comprehensive type definitions
- **Component Registry**: Central registry for dynamic component resolution
- **Action System**: Server-defined actions for navigation and API calls
- **State Management**: Built-in loading states, error handling, and form values
- **Dynamic Rendering**: Render React components based on server data
- **11 Component Types**: Text, Button, Container, Card, Hero, List, Input, Image, Badge, Divider, Spacer
- **Comprehensive Tests**: 74 unit tests covering registry, server utilities, and types
- **Demo Pages**: 6 example pages showcasing different use cases
- **Minimal JS Bundle**: Astro's zero-JS by default with selective React hydration

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

Visit `http://localhost:4321/sdui` to see the demo.

## Project Structure

```
├── public/
├── src/
│   ├── components/
│   │   └── react/          # React component implementations
│   ├── sdui/               # SDUI core system
│   │   ├── types.ts        # TypeScript definitions
│   │   ├── registry.ts     # Component registry
│   │   ├── renderer.tsx    # Dynamic renderer
│   │   ├── server.ts       # Server utilities
│   │   ├── examples.ts     # Pre-built examples
│   │   └── __tests__/      # Unit tests
│   ├── layouts/
│   └── pages/
│       └── sdui/           # Demo pages
├── docs/
│   └── SDUI_GUIDE.md      # Complete documentation
├── astro.config.mjs
├── package.json
├── vitest.config.ts
└── tsconfig.json
```

## Usage Example

```typescript
// Create a view on the server
import { hero, button, createView, navigateAction } from './sdui/server';

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

// Render on the client
import { SDUIRenderer } from './sdui/renderer';

<SDUIRenderer client:load component={view.root} />
```

## Commands

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally                      |
| `npm test`                | Run tests in watch mode                         |
| `npm run test:run`        | Run tests once                                  |
| `npm run test:ui`         | Run tests with UI                               |

## Documentation

For complete documentation, see [docs/SDUI_GUIDE.md](./docs/SDUI_GUIDE.md).

## Demo Pages

- `/sdui` - Main demo index
- `/sdui/hero` - Hero section example
- `/sdui/showcase` - All components showcase
- `/sdui/product` - E-commerce product page
- `/sdui/dashboard` - Admin dashboard
- `/sdui/blog` - Blog post example
- `/sdui/interactive` - Interactive form demo

## Tech Stack

- **Astro** - Modern web framework
- **React** - UI library for components
- **TypeScript** - Type safety
- **Vitest** - Testing framework
- **Tailwind CSS** - Styling (via classes)

## License

MIT - This is a template project. Feel free to modify and use as needed.
