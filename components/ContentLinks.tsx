import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * Internal link to a calculator. Broken slugs are caught by tests/links.test.ts,
 * which scans every MDX file, so the build itself never depends on page order.
 */
export function CalcLink({ slug, children }: { slug: string; children: ReactNode }) {
  return <Link href={`/calculators/${slug}`}>{children}</Link>;
}

/** Internal link to a blog post (checked by tests/links.test.ts). */
export function PostLink({ slug, children }: { slug: string; children: ReactNode }) {
  return <Link href={`/blog/${slug}`}>{children}</Link>;
}
