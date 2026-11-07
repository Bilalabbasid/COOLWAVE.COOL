import Link from 'next/link';
import { AFFILIATES, type AffiliateKey } from '@/lib/affiliates';

export function AffiliateBox({ keys }: { keys: AffiliateKey[] }) {
  if (!keys.length) return null;
  return (
    <aside aria-labelledby="shop-heading" className="mt-10 rounded-xl border border-border bg-surface p-4">
      <h2 id="shop-heading" className="text-lg font-bold">
        Shopping for equipment?
      </h2>
      <ul className="mt-3 space-y-2">
        {keys.map((k) => {
          const a = AFFILIATES[k];
          return (
            <li key={k}>
              <a href={a.url} rel="sponsored nofollow noopener" target="_blank" className="font-semibold text-brand underline underline-offset-2">
                {a.label}
              </a>{' '}
              <span className="text-muted">— {a.blurb}</span>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-muted">
        Disclosure: these are affiliate links. If you buy through them we may earn a commission at no extra cost to you. It never
        changes our numbers. <Link href="/affiliate-disclosure" className="underline">Learn more</Link>.
      </p>
    </aside>
  );
}
