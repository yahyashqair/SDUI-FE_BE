# Page Templates

Pages in Astro use file-based routing. Create pages in `src/pages/` and they automatically become routes.

## Page Route Patterns

```
src/pages/
├── index.astro           → /
├── about.astro           → /about
├── blog/
│   ├── index.astro       → /blog
│   └── [slug].astro      → /blog/:slug (dynamic)
└── api/
    ├── users.ts          → /api/users (endpoint)
    └── [id].ts           → /api/users/:id
```

## Static Page Template

```astro
---
/**
 * src/pages/about.astro
 * Static about page
 */

import BaseLayout from '@/layouts/BaseLayout.astro';

// Page metadata
const title = 'About Us';
const description = 'Learn about our company';
---

<BaseLayout {title} {description}>
  <section class="py-16">
    <div class="container mx-auto px-4">
      <h2 class="text-3xl font-bold mb-6">Our Story</h2>
      <p class="text-lg mb-4">Content goes here...</p>
    </div>
  </section>
</BaseLayout>
```

## Dynamic Page Template

```astro
---
/**
 * src/pages/blog/[slug].astro
 * Dynamic blog post page
 */

import { getCollection } from 'astro:content';
import BaseLayout from '@/layouts/BaseLayout.astro';
import BlogPostLayout from '@/layouts/BlogPost.astro';

// Get all posts
const posts = await getCollection('blog');

// Export paths for static generation
export function getStaticPaths() {
  return posts.map((post) => ({
    params: { slug: post.slug },
    props: { post },
  }));
}

// Get the current post
const { post } = Astro.props;
const { Content, title, publishDate, author, tags, description } = await post.render();
---

<BlogPostLayout
  {title}
  publishDate={publishDate}
  author={author}
  tags={tags}
  description={description}
>
  <Content />
</BlogPostLayout>
```

## API Endpoint Template

```ts
/**
 * src/pages/api/users.ts
 * API endpoint for user operations
 */

import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ url, request }) => {
  // Get query parameters
  const limit = Number(url.searchParams.get('limit') || '10');
  const offset = Number(url.searchParams.get('offset') || '0');

  // Get auth token from header
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Fetch data
    const users = await db.getUsers(limit, offset);

    return new Response(
      JSON.stringify({ users, total: users.length }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    // Validate input
    if (!body.email || !body.name) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create user
    const user = await db.createUser(body);

    return new Response(
      JSON.stringify(user),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

## Server-Side Rendered Page

```astro
---
/**
 * src/pages/dashboard/index.astro
 * Server-rendered dashboard page
 */

import BaseLayout from '@/layouts/DashboardLayout.astro';
import { getUser } from '@/lib/auth';
import { getDashboardData } from '@/lib/dashboard';

// Check authentication
const user = await getUser(Astro.request);
if (!user) {
  return Astro.redirect('/login');
}

// Fetch data on the server
const dashboardData = await getDashboardData(user.id);
---

<BaseLayout title="Dashboard" currentPath="/dashboard">
  <div class="dashboard">
    <h2 class="text-2xl font-bold mb-6">Welcome back, {user.name}!</h2>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-lg font-semibold mb-2">Total Users</h3>
        <p class="text-3xl font-bold text-blue-600">{dashboardData.totalUsers}</p>
      </div>

      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-lg font-semibold mb-2">Active Sessions</h3>
        <p class="text-3xl font-bold text-green-600">{dashboardData.activeSessions}</p>
      </div>

      <div class="bg-white p-6 rounded-lg shadow">
        <h3 class="text-lg font-semibold mb-2">Revenue</h3>
        <p class="text-3xl font-bold text-purple-600">${dashboardData.revenue}</p>
      </div>
    </div>
  </div>
</BaseLayout>
```

## Form Handling Page

```astro
---
/**
 * src/pages/contact.astro
 * Contact page with form handling
 */

import BaseLayout from '@/layouts/BaseLayout.astro';

// Check for form submission
let success = false;
let error = null;

if (Astro.request.method === 'POST') {
  try {
    const formData = await Astro.request.formData();
    const name = formData.get('name');
    const email = formData.get('email');
    const message = formData.get('message');

    // Process form...
    success = true;
  } catch (e) {
    error = 'Failed to submit form';
  }
}
---

<BaseLayout title="Contact Us">
  <section class="max-w-2xl mx-auto py-12 px-4">
    <h1 class="text-3xl font-bold mb-6">Contact Us</h1>

    {success && (
      <div class="bg-green-100 text-green-800 p-4 rounded mb-6">
        Thank you! Your message has been sent.
      </div>
    )}

    {error && (
      <div class="bg-red-100 text-red-800 p-4 rounded mb-6" role="alert">
        {error}
      </div>
    )}

    <form method="POST" class="space-y-4">
      <div>
        <label for="name" class="block text-sm font-medium mb-1">Name</label>
        <input
          type="text"
          id="name"
          name="name"
          required
          class="w-full px-3 py-2 border rounded"
        />
      </div>

      <div>
        <label for="email" class="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          id="email"
          name="email"
          required
          class="w-full px-3 py-2 border rounded"
        />
      </div>

      <div>
        <label for="message" class="block text-sm font-medium mb-1">Message</label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          class="w-full px-3 py-2 border rounded"
        />
      </div>

      <button
        type="submit"
        class="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Send Message
      </button>
    </form>
  </section>
</BaseLayout>
```

## Redirects

```ts
/**
 * src/pages/old-page.ts
 * Redirect to new location
 */

import { redirect } from 'astro:middleware';

export async function GET(context) {
  return redirect('/new-page', 301);
}
```
