import type { Source } from '@/lib/engine/types';

export function SourcesList({ sources, id = 'sources' }: { sources: Source[]; id?: string }) {
  if (!sources.length) return null;
  return (
    <section aria-labelledby={`${id}-heading`} className="mt-12">
      <h2 id={`${id}-heading`} className="text-2xl font-bold">
        Sources
      </h2>
      <ol className="mt-4 list-decimal space-y-2 pl-6 text-[0.95rem]">
        {sources.map((s) => (
          <li key={s.url}>
            <a href={s.url} rel="noopener" className="text-brand underline underline-offset-2 hover:text-brand-strong">
              {s.title}
            </a>{' '}
            <span className="text-muted">— {s.publisher}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
