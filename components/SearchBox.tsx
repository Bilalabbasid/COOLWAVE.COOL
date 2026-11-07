'use client';

import Link from 'next/link';
import { useId, useMemo, useState } from 'react';

export interface SearchItem {
  title: string;
  href: string;
  text: string;
  kind: 'Calculator' | 'Guide';
}

export function SearchBox({ items }: { items: SearchItem[] }) {
  const [q, setQ] = useState('');
  const id = useId();
  const results = useMemo(() => {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    return items
      .map((it) => {
        const hay = `${it.title} ${it.text}`.toLowerCase();
        const score = terms.reduce((s, t) => s + (it.title.toLowerCase().includes(t) ? 3 : hay.includes(t) ? 1 : -100), 0);
        return { it, score };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score || (a.it.kind === 'Calculator' ? -1 : 1))
      .slice(0, 8)
      .map((r) => r.it);
  }, [q, items]);

  return (
    <div role="search" className="relative">
      <label htmlFor={id} className="sr-only">
        Search calculators and guides
      </label>
      <input
        id={id}
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search: BTU, dew point, space heater cost…"
        autoComplete="off"
        className="h-12 w-full rounded-xl border border-field-border bg-surface px-4 text-base shadow-[var(--shadow-sm)] focus:border-brand"
      />
      {q.trim() && (
        <ul className="absolute inset-x-0 top-full z-20 mt-1 max-h-96 overflow-auto rounded-xl border border-border bg-surface p-1 shadow-lg">
          {results.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted">No matches. Try “humidity” or “cost”.</li>
          ) : (
            results.map((r) => (
              <li key={r.href}>
                <Link href={r.href} className="flex min-h-11 items-center justify-between gap-3 rounded-lg px-3 py-2 hover:bg-surface-2">
                  <span className="font-medium">{r.title}</span>
                  <span className="text-xs text-muted">{r.kind}</span>
                </Link>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
