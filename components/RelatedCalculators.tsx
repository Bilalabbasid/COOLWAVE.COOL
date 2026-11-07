import Link from 'next/link';
import { getCalculator, getPost } from '@/lib/registry';

export function RelatedCalculators({ slugs, heading = 'Related calculators' }: { slugs: string[]; heading?: string }) {
  const items = slugs.map(getCalculator).filter((c): c is NonNullable<typeof c> => Boolean(c));
  if (!items.length) return null;
  return (
    <section aria-labelledby="related-heading" className="mt-12">
      <h2 id="related-heading" className="text-2xl font-bold">
        {heading}
      </h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {items.map((c) => (
          <li key={c.slug}>
            <Link href={`/calculators/${c.slug}`} className="block h-full rounded-xl border border-border bg-surface p-4 transition hover:border-brand">
              <span className="font-semibold text-brand">{c.title}</span>
              <span className="mt-1 block text-sm text-muted">{c.shortDescription}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function RelatedPosts({ slugs, heading = 'Related guides' }: { slugs: string[]; heading?: string }) {
  const items = slugs.map(getPost).filter((p): p is NonNullable<typeof p> => Boolean(p));
  if (!items.length) return null;
  return (
    <section aria-labelledby="posts-heading" className="mt-12">
      <h2 id="posts-heading" className="text-2xl font-bold">
        {heading}
      </h2>
      <ul className="mt-4 space-y-3">
        {items.map((p) => (
          <li key={p.slug}>
            <Link href={`/blog/${p.slug}`} className="font-semibold text-brand underline-offset-2 hover:underline">
              {p.title}
            </Link>
            <p className="text-sm text-muted">{p.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
