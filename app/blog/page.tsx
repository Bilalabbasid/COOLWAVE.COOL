import type { Metadata } from 'next';
import { Breadcrumb } from '@/components/Breadcrumb';
import { PostCard } from '@/components/Cards';
import { BlogCategoryNav } from '@/components/BlogCategoryNav';
import { posts } from '@/lib/registry';

export const metadata: Metadata = {
  title: 'Guides: Cooling, Heating, Energy & Weather',
  description: 'Plain-English guides to AC sizing, heating and energy costs, humidity, wind chill and sound, each linked to a free calculator.',
  alternates: { canonical: '/blog' },
};

export default function BlogIndex() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <Breadcrumb crumbs={[{ name: 'Guides', path: '/blog' }]} />
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight">Guides</h1>
      <p className="mt-2 max-w-2xl text-muted">Answers to the questions people actually ask about cooling, heating, energy bills and the weather.</p>
      <BlogCategoryNav active={null} />
      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((p) => (
          <li key={p.slug}>
            <PostCard p={p} />
          </li>
        ))}
      </ul>
    </div>
  );
}
