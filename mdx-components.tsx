import type { MDXComponents } from 'mdx/types';
import Link from 'next/link';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { WorkedExample } from '@/components/WorkedExample';
import { CalcLink, PostLink } from '@/components/ContentLinks';
import { BlogImage } from '@/components/BlogImage';

function A({ href = '', ...rest }: ComponentPropsWithoutRef<'a'>) {
  if (href.startsWith('/')) return <Link href={href} {...rest} />;
  return <a href={href} rel="noopener" {...rest} />;
}

/** Monospace formula block. */
function Formula({ children }: { children: ReactNode }) {
  return <div className="formula">{children}</div>;
}

function Callout({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'warning' }) {
  const cls = tone === 'warning' ? 'border-caution bg-[color-mix(in_srgb,var(--caution)_10%,transparent)]' : 'border-accent bg-accent-soft';
  return <div className={`rounded-lg border-l-4 px-4 py-3 ${cls}`}>{children}</div>;
}

const components: MDXComponents = {
  a: A,
  Formula,
  Callout,
  WorkedExample,
  CalcLink,
  PostLink,
  BlogImage,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
