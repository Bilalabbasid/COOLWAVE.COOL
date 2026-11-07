import Link from 'next/link';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { CATEGORIES } from '@/lib/categories';

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5">
        <Link href="/" aria-label="CoolWave home">
          <Logo />
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1 text-sm font-semibold">
          <Link href="/calculators" className="rounded-lg px-2.5 py-2 hover:bg-surface-2">
            Calculators
          </Link>
          <Link href="/blog" className="rounded-lg px-2.5 py-2 hover:bg-surface-2">
            Guides
          </Link>
          <ThemeToggle />
        </nav>
      </div>
      <nav aria-label="Categories" className="border-t border-border">
        <ul className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-1.5 text-sm whitespace-nowrap [scrollbar-width:none]">
          {CATEGORIES.map((c) => (
            <li key={c.slug}>
              <Link href={`/category/${c.slug}`} className="block rounded-md px-2.5 py-1.5 text-muted hover:bg-surface-2 hover:text-text">
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
