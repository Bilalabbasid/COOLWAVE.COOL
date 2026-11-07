import Link from 'next/link';
import type { CalculatorConfig } from '@/lib/engine/types';
import type { PostMeta } from '@/lib/registry-types';
import { getCategory } from '@/lib/categories';

export function CalculatorCard({ c }: { c: CalculatorConfig }) {
  return (
    <Link href={`/calculators/${c.slug}`} className="cw-card group p-4">
      <span className="flex items-start justify-between gap-3">
        <span className="font-semibold text-text group-hover:text-brand">{c.title}</span>
        <span aria-hidden="true" className="cw-arrow mt-px shrink-0 text-brand">
          →
        </span>
      </span>
      <span className="mt-1 block text-sm leading-snug text-muted">{c.shortDescription}</span>
    </Link>
  );
}

export function PostCard({ p }: { p: PostMeta }) {
  const cat = getCategory(p.category);
  const date = new Date(`${p.updated}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  return (
    <Link href={`/blog/${p.slug}`} className="cw-card group p-4">
      <span className="text-xs font-semibold tracking-wide text-brand uppercase">{cat?.name}</span>
      <span className="mt-1 block font-semibold text-text group-hover:text-brand">{p.title}</span>
      <span className="mt-1 block text-sm leading-snug text-muted">{p.description}</span>
      <span className="mt-2 block text-xs text-muted">Updated {date}</span>
    </Link>
  );
}
