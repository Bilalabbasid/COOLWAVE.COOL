import type { Metadata } from 'next';
import { pageMeta } from '@/lib/meta';
import { Breadcrumb } from '@/components/Breadcrumb';
import { PostCard } from '@/components/Cards';
import { BlogCategoryNav } from '@/components/BlogCategoryNav';
import { posts } from '@/lib/registry';

export const metadata: Metadata = pageMeta({ title: "Guides: Cooling, Heating, Energy & Weather", description: "Plain-English guides to AC sizing, heating and energy costs, humidity, wind chill and sound, each linked to a free calculator.", path: "/blog" });

export default function BlogIndex() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-3 pb-6 sm:pt-5">
      <Breadcrumb crumbs={[{ name: 'Guides', path: '/blog' }]} />
      <h1 className="mt-2 text-[1.75rem] leading-tight font-extrabold tracking-tight sm:mt-3 sm:text-3xl">Guides</h1>
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
