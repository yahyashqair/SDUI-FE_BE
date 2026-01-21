# Astro Component Templates

Astro components are compiled to static HTML at build time. Use them for SEO-critical content and layouts.

## Base Template

```astro
---
/**
 * ComponentName.astro
 *
 * @description Brief description of what this component does
 * @param {string} prop1 - Description of prop1
 * @param {number} prop2 - Description of prop2
 */

interface Props {
  prop1: string;
  prop2?: number;
  className?: string;
}

const { prop1, prop2 = 0, className = '' } = Astro.props;

// Server-side logic can go here
const computedValue = prop1.toUpperCase();
---

<!-- Component template -->
<div class={className}>
  <h2>{computedValue}</h2>
  <p>Value: {prop2}</p>
</div>

<style>
  /* Scoped styles - automatically scoped to this component */
  div {
    padding: 1rem;
    border-radius: 0.5rem;
  }
</style>
```

## Common Patterns

### Data Fetching Component

```astro
---
/**
 * DataDisplay.astro
 * Fetches data at build time (or request time in server mode)
 */

interface Props {
  id: string;
  fetchOnRequest?: boolean;
}

const { id, fetchOnRequest = false } = Astro.props;

// This runs at build time (static) or request time (server mode)
const response = await fetch(`https://api.example.com/data/${id}`);
const data = await response.json();

if (!data) {
  return Astro.redirect('/404');
}
---

<article class="data-display">
  <h1>{data.title}</h1>
  <time datetime={data.date}>
    {new Date(data.date).toLocaleDateString()}
  </time>
  <div set:html={data.content} />
</article>

<style>
  .data-display {
    @apply p-6 rounded-lg bg-white dark:bg-gray-800;
  }
</style>
```

### List Component

```astro
---
/**
 * ItemList.astro
 * Displays a list of items with optional empty state
 */

interface Item {
  id: string;
  name: string;
  description?: string;
}

interface Props {
  items: Item[];
  emptyMessage?: string;
}

const { items, emptyMessage = 'No items found' } = Astro.props;
---

<ul class="item-list">
  {items.length > 0 ? (
    items.map((item) => (
      <li data-id={item.id}>
        <h3>{item.name}</h3>
        {item.description && <p>{item.description}</p>}
      </li>
    ))
  ) : (
    <li class="empty">{emptyMessage}</li>
  )}
</ul>

<style>
  .item-list {
    @apply list-none p-0 space-y-2;
  }
  .empty {
    @apply text-gray-500 italic;
  }
</style>
```

### Container/Wrapper Component

```astro
---
/**
 * Container.astro
 * Provides consistent max-width and padding
 */

interface Props {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const { size = 'lg', className = '' } = Astro.props;

const sizeClasses = {
  sm: 'max-w-2xl',
  md: 'max-w-4xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
};
---

<div class:list={[
  'container mx-auto px-4',
  sizeClasses[size],
  className
]}>
  <slot />
</div>
```

## Best Practices

1. **Keep logic in the frontmatter**: Server-side code goes between `---` markers
2. **Use scoped styles**: Styles are automatically scoped to the component
3. **Type your props**: Always use TypeScript interfaces
4. **Handle missing data**: Return early or show fallback UI
5. **Use slots**: Make components composable with `<slot />`
