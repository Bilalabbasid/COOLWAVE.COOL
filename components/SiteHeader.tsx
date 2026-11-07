import Link from 'next/link';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { CATEGORIES } from '@/lib/categories';

const NAV_LINK = 'inline-flex h-11 items-center rounded-lg px-2 hover:bg-surface-2 min-[400px]:px-2.5 sm:px-3';

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-1 px-3 py-1.5 min-[400px]:px-4">
        <Link href="/" aria-label="CoolWave home" className="inline-flex h-11 shrink-0 items-center rounded-lg">
          <Logo />
        </Link>
        <nav aria-label="Main" className="flex items-center text-sm font-semibold sm:gap-1">
          <Link href="/calculators" className={NAV_LINK}>
            Calculators
          </Link>
          <Link href="/blog" className={NAV_LINK}>
            Guides
          </Link>
          <ThemeToggle />
        </nav>
      </div>
      <nav aria-label="Categories" className="border-t border-border">
        <ul className="cw-strip mx-auto flex max-w-6xl gap-1 overflow-x-auto px-1.5 text-sm whitespace-nowrap">
          {CATEGORIES.map((c) => (
            <li key={c.slug} className="shrink-0">
              <Link
                href={`/category/${c.slug}`}
                className="flex h-11 items-center rounded-md px-2.5 font-medium text-muted hover:bg-surface-2 hover:text-text"
              >
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
