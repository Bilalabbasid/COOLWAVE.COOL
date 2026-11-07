import Link from 'next/link';
import { LogoMark } from './Logo';
import { CATEGORIES } from '@/lib/categories';
import { SITE } from '@/lib/site';

const LEGAL = [
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
  { href: '/privacy-policy', label: 'Privacy policy' },
  { href: '/terms', label: 'Terms of use' },
  { href: '/affiliate-disclosure', label: 'Affiliate disclosure' },
];

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-6 px-4 py-8 sm:grid-cols-3 sm:gap-8 sm:py-10">
        <div className="col-span-2 sm:col-span-1">
          <p className="flex items-center gap-2 font-bold">
            <LogoMark size={24} /> {SITE.name}
          </p>
          <p className="mt-2 text-sm text-muted">{SITE.tagline}. Every formula is checked against a primary source.</p>
        </div>
        <nav aria-label="Calculator categories">
          <p className="font-semibold">Calculators</p>
          <ul className="mt-1 text-sm">
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link href={`/category/${c.slug}`} className="inline-flex min-h-11 items-center text-muted underline-offset-2 hover:text-brand hover:underline">
                  {c.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/blog" className="inline-flex min-h-11 items-center text-muted underline-offset-2 hover:text-brand hover:underline">
                Guides
              </Link>
            </li>
          </ul>
        </nav>
        <nav aria-label="Company">
          <p className="font-semibold">Company</p>
          <ul className="mt-1 text-sm">
            {LEGAL.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="inline-flex min-h-11 items-center text-muted underline-offset-2 hover:text-brand hover:underline">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <p className="border-t border-border px-4 py-4 text-center text-xs text-muted">
        Results are estimates for information only and are not professional engineering, medical or safety advice. © {SITE.name}
      </p>
    </footer>
  );
}
