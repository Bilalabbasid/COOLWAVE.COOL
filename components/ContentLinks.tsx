import Link from 'next/link';
import type { ReactNode } from 'react';
import { CALCULATOR_LOADERS } from '@/calculators/_loaders.generated';
import { POSTS } from '@/content/blog/_posts.generated';

/** Internal link to a calculator. Fails the build if the slug does not exist (no broken links). */
export function CalcLink({ slug, children }: { slug: string; children: ReactNode }) {
  if (!(slug in CALCULATOR_LOADERS)) throw new Error(`CalcLink: unknown calculator "${slug}"`);
  return <Link href={`/calculators/${slug}`}>{children}</Link>;
}

/** Internal link to a blog post. Fails the build if the slug does not exist. */
export function PostLink({ slug, children }: { slug: string; children: ReactNode }) {
  if (!POSTS.some((p) => p.slug === slug)) throw new Error(`PostLink: unknown post "${slug}"`);
  return <Link href={`/blog/${slug}`}>{children}</Link>;
}
