import type { ReactNode } from 'react';
import { Breadcrumb } from './Breadcrumb';

export function StaticPage({ title, path, updated, children }: { title: string; path: string; updated?: string; children: ReactNode }) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-6">
      <Breadcrumb crumbs={[{ name: title, path }]} />
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight">{title}</h1>
      {updated && <p className="mt-2 text-sm text-muted">Last updated {updated}</p>}
      <div className="prose-cw mt-6">{children}</div>
    </article>
  );
}
