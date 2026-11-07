import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Breadcrumb } from '@/components/Breadcrumb';
import { PostCard } from '@/components/Cards';
import { BlogCategoryNav } from '@/components/BlogCategoryNav';
import { CATEGORIES, getCategory } from '@/lib/categories';
import { postsInCategory } from '@/lib/registry';

export const dynamicParams = false;

export function generateStaticParams() {
  const withPosts = CATEGORIES.filter((c) => postsInCategory(c.slug).length > 0);
  // Next requires at least one entry; fall back to all categories before any posts exist.
  return (withPosts.length ? withPosts : CATEGORIES).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<'/blog/category/[slug]'>): Promise<Metadata> {
  const cat = getCategory((await params).slug);
  if (!cat) return {};
  return {
    title: `${cat.name} Guides`,
    description: `Guides on ${cat.name.toLowerCase()}: ${cat.short}`.slice(0, 155),
    alternates: { canonical: `/blog/category/${cat.slug}` },
  };
}

export default async function BlogCategoryPage({ params }: PageProps<'/blog/category/[slug]'>) {
  const cat = getCategory((await params).slug);
  if (!cat) notFound();
  const list = postsInCategory(cat.slug);
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <Breadcrumb
        crumbs={[
          { name: 'Guides', path: '/blog' },
          { name: cat.name, path: `/blog/category/${cat.slug}` },
        ]}
      />
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight">{cat.name} guides</h1>
      <BlogCategoryNav active={cat.slug} />
      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((p) => (
          <li key={p.slug}>
            <PostCard p={p} />
          </li>
        ))}
      </ul>
    </div>
  );
}
