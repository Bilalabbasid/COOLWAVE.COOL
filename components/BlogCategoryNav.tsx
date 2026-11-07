import Link from 'next/link';
import { CATEGORIES } from '@/lib/categories';
import { postsInCategory } from '@/lib/registry';

export function BlogCategoryNav({ active }: { active: string | null }) {
  const cats = CATEGORIES.filter((c) => postsInCategory(c.slug).length > 0);
  const base = 'inline-flex h-11 items-center rounded-full border px-4 text-sm font-semibold';
  return (
    <nav aria-label="Filter guides by category" className="mt-6">
      <ul className="flex flex-wrap gap-2">
        <li>
          <Link href="/blog" aria-current={active === null ? 'page' : undefined} className={`${base} ${active === null ? 'border-brand bg-brand text-white dark:text-bg' : 'border-border bg-surface hover:border-brand'}`}>
            All
          </Link>
        </li>
        {cats.map((c) => (
          <li key={c.slug}>
            <Link
              href={`/blog/category/${c.slug}`}
              aria-current={active === c.slug ? 'page' : undefined}
              className={`${base} ${active === c.slug ? 'border-brand bg-brand text-white dark:text-bg' : 'border-border bg-surface hover:border-brand'}`}
            >
              {c.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
