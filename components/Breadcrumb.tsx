import Link from 'next/link';
import { JsonLd } from './JsonLd';
import { breadcrumbLd, type Crumb } from '@/lib/seo';

export function Breadcrumb({ crumbs }: { crumbs: Crumb[] }) {
  const all: Crumb[] = [{ name: 'Home', path: '/' }, ...crumbs];
  return (
    <>
      {/* One line: earlier crumbs keep their width and the current page name truncates if space runs out. */}
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <ol className="flex items-center gap-x-1.5">
          {all.map((c, i) => {
            const last = i === all.length - 1;
            return (
              <li key={c.path} className={`flex items-center gap-1.5 ${last ? 'min-w-0' : 'shrink-0'}`}>
                {i > 0 && <span aria-hidden="true">›</span>}
                {last ? (
                  <span aria-current="page" className="truncate text-text">
                    {c.name}
                  </span>
                ) : (
                  // Padding with matching negative margin enlarges the tap area without moving anything.
                  <Link href={c.path} className="-my-3 inline-block rounded py-3 underline-offset-2 hover:text-brand hover:underline">
                    {c.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <JsonLd data={breadcrumbLd(all)} />
    </>
  );
}
