import Link from 'next/link';
import { SITE } from '@/lib/site';

export function ReviewBox({ reviewedAgainst, updated }: { reviewedAgainst: string; updated: string }) {
  const date = new Date(`${updated}T00:00:00Z`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
  return (
    <aside className="mt-10 flex gap-3 rounded-xl border border-border bg-surface-2 p-4 text-sm">
      <span aria-hidden="true" className="mt-0.5 text-lg text-good">
        ✓
      </span>
      <div>
        <p>
          <strong>Formula reviewed against {reviewedAgainst}.</strong> Written and checked by{' '}
          <Link href="/about" className="text-brand underline underline-offset-2">
            {SITE.author}
          </Link>
          . Last reviewed <time dateTime={updated}>{date}</time>.
        </p>
        <p className="mt-1 text-muted">
          Spotted an error? Email{' '}
          <a href={`mailto:${SITE.email}`} className="text-brand underline underline-offset-2">
            {SITE.email}
          </a>{' '}
          and we will fix it.
        </p>
      </div>
    </aside>
  );
}
