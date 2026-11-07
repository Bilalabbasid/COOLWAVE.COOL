import Link from 'next/link';
import { CATEGORIES } from '@/lib/categories';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <p className="text-sm font-semibold tracking-wide text-brand uppercase">Error 404</p>
      <h1 className="mt-2 text-3xl font-extrabold">We couldn’t find that page</h1>
      <p className="mt-3 text-muted">The link may be old or mistyped. These sections might help:</p>
      <ul className="mt-6 flex flex-wrap justify-center gap-2">
        {CATEGORIES.map((c) => (
          <li key={c.slug}>
            <Link href={`/category/${c.slug}`} className="inline-flex h-11 items-center rounded-full border border-border bg-surface px-4 text-sm font-semibold hover:border-brand">
              {c.name}
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-8">
        <Link href="/" className="font-semibold text-brand underline">
          Go to the home page
        </Link>
      </p>
    </div>
  );
}
