import { JsonLd } from './JsonLd';
import { faqLd } from '@/lib/seo';
import type { FaqItem } from '@/lib/registry-types';

/** Accordion built on <details>: keyboard accessible and needs no JavaScript. */
export function Faq({ items, heading = 'Frequently asked questions', id = 'faq' }: { items: FaqItem[]; heading?: string; id?: string }) {
  if (!items.length) return null;
  return (
    <section aria-labelledby={`${id}-heading`} className="mt-12">
      <h2 id={`${id}-heading`} className="text-2xl font-bold">
        {heading}
      </h2>
      <div className="mt-4 divide-y divide-border rounded-xl border border-border bg-surface">
        {items.map((f) => (
          <details key={f.q} className="group px-4 py-3 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-semibold">
              <h3 className="text-base">{f.q}</h3>
              <span aria-hidden="true" className="mt-0.5 shrink-0 text-brand transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-2 leading-relaxed text-muted">{f.a}</p>
          </details>
        ))}
      </div>
      <JsonLd data={faqLd(items)} />
    </section>
  );
}
