# Layout Templates

Layouts in Astro wrap pages to provide consistent structure.

## Base Layout Template

```astro
---
/**
 * BaseLayout.astro
 * Main layout for all pages
 */

import BaseHead from '@/components/BaseHead.astro';
import Header from '@/components/Header.astro';
import Footer from '@/components/Footer.astro';

interface Props {
  title: string;
  description?: string;
  image?: string;
  noIndex?: boolean;
}

const {
  title,
  description = 'Default description',
  image = '/default-og.jpg',
  noIndex = false,
} = Astro.props;
---

<!DOCTYPE html>
<html lang="en">
  <head>
    <BaseHead
      title={title}
      description={description}
      image={image}
      {noIndex}
    />
  </head>
  <body class="bg-gray-50 dark:bg-gray-900">
    <Header />
    <main class="min-h-screen">
      <slot />
    </main>
    <Footer />
  </body>
</html>

<style is:global>
  /* Global styles */
  body {
    @apply text-gray-900 dark:text-gray-100;
  }
</style>
```

## Dashboard Layout

```astro
---
/**
 * DashboardLayout.astro
 * Layout for dashboard pages with sidebar navigation
 */

import BaseHead from '@/components/BaseHead.astro';
import Sidebar from '@/components/dashboard/Sidebar.astro';

interface Props {
  title: string;
  currentPath?: string;
}

const { title, currentPath = Astro.url.pathname } = Astro.props;

// Check authentication (server-side)
const isAuthenticated = Astro.cookies.get('auth-token')?.value;
if (!isAuthenticated) {
  return Astro.redirect('/login');
}
---

<!DOCTYPE html>
<html lang="en">
  <head>
    <BaseHead title={title} />
  </head>
  <body class="bg-gray-100 dark:bg-gray-900">
    <div class="flex h-screen">
      <!-- Sidebar -->
      <Sidebar currentPath={currentPath} />

      <!-- Main content -->
      <div class="flex-1 overflow-auto">
        <header class="bg-white dark:bg-gray-800 shadow-sm px-6 py-4">
          <h1 class="text-2xl font-bold">{title}</h1>
        </header>
        <main class="p-6">
          <slot />
        </main>
      </div>
    </div>
  </body>
</html>
```

## Blog Post Layout

```astro
---
/**
 * BlogPost.astro
 * Layout for blog posts with metadata
 */

import BaseHead from '@/components/BaseHead.astro';
import { getCollection } from 'astro:content';

interface Props {
  title: string;
  publishDate: Date;
  author?: string;
  tags?: string[];
  description?: string;
}

const { title, publishDate, author, tags = [], description } = Astro.props;
---

<!DOCTYPE html>
<html lang="en">
  <head>
    <BaseHead
      title={title}
      description={description}
    />
  </head>
  <body>
    <article class="max-w-3xl mx-auto px-4 py-8">
      <header class="mb-8">
        <h1 class="text-4xl font-bold mb-4">{title}</h1>
        <div class="flex items-center gap-4 text-gray-600">
          <time datetime={publishDate.toISOString()}>
            {publishDate.toLocaleDateString()}
          </time>
          {author && <span>by {author}</span>}
        </div>
        {tags.length > 0 && (
          <div class="flex gap-2 mt-4">
            {tags.map((tag) => (
              <span class="px-2 py-1 bg-gray-200 rounded text-sm">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </header>

      <div class="prose dark:prose-invert max-w-none">
        <slot />
      </div>

      <footer class="mt-12 pt-8 border-t">
        <nav>
          <a href="/blog" class="text-blue-600 hover:underline">
            ← Back to all posts
          </a>
        </nav>
      </footer>
    </article>
  </body>
</html>
```

## Minimal Layout

```astro
---
/**
 * MinimalLayout.astro
 * Minimal layout for auth pages, landing pages, etc.
 */

import BaseHead from '@/components/BaseHead.astro';

interface Props {
  title: string;
}

const { title } = Astro.props;
---

<!DOCTYPE html>
<html lang="en">
  <head>
    <BaseHead title={title} />
  </head>
  <body class="bg-gradient-to-br from-blue-50 to-indigo-100">
    <main class="min-h-screen flex items-center justify-center">
      <slot />
    </main>
  </body>
</html>

<style is:global>
  body {
    @apply text-gray-900;
  }
</style>
```

## Usage

```astro
---
// In your page file
import BaseLayout from '@/layouts/BaseLayout.astro';
---

<BaseLayout title="My Page">
  <div>Page content here</div>
</BaseLayout>
```
