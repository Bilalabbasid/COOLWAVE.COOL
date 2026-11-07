import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Breadcrumb } from '@/components/Breadcrumb';
import { CalculatorWidget } from '@/components/calculator/CalculatorWidget';
import { WidgetHost } from '@/components/widgets/WidgetHost';
import { Faq } from '@/components/Faq';
import { SourcesList } from '@/components/SourcesList';
import { RelatedCalculators, RelatedPosts } from '@/components/RelatedCalculators';
import { ReviewBox } from '@/components/ReviewBox';
import { AffiliateBox } from '@/components/AffiliateBox';
import { AdSlot } from '@/components/Ads';
import { JsonLd } from '@/components/JsonLd';
import { calculators, getCalculatorEntry, postsForCalculator } from '@/lib/registry';
import { getCategory } from '@/lib/categories';
import { calculatorLd } from '@/lib/seo';
import { toShell } from '@/lib/engine/types';
import { defaultValues } from '@/lib/engine/values';

export const dynamicParams = false;

export function generateStaticParams() {
  return calculators.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<'/calculators/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const entry = getCalculatorEntry(slug);
  if (!entry) return {};
  const c = entry.config;
  const url = `/calculators/${c.slug}`;
  return {
    title: { absolute: c.metaTitle },
    description: c.metaDescription,
    alternates: { canonical: url },
    openGraph: { title: c.metaTitle, description: c.metaDescription, url, type: 'website' },
    twitter: { title: c.metaTitle, description: c.metaDescription },
  };
}

export default async function CalculatorPage({ params }: PageProps<'/calculators/[slug]'>) {
  const { slug } = await params;
  const entry = getCalculatorEntry(slug);
  if (!entry) notFound();
  const { config, content } = entry;
  const category = getCategory(config.category)!;
  const system = config.defaultUnitSystem ?? 'imperial';
  const initialResult = config.compute(defaultValues(config, system), system);
  const Content = content?.default;
  const relatedPosts = [...new Set([...config.relatedPosts, ...postsForCalculator(config.slug).map((p) => p.slug)])];

  return (
    <article className="mx-auto max-w-3xl px-4 pt-4 pb-8">
      <Breadcrumb
        crumbs={[
          { name: category.name, path: `/category/${category.slug}` },
          { name: config.title, path: `/calculators/${config.slug}` },
        ]}
      />
      <h1 className="mt-2 text-2xl leading-tight font-extrabold tracking-tight sm:text-3xl">{config.h1}</h1>
      <p className="mt-1 mb-4 text-muted">{config.shortDescription}</p>

      {config.widget ? (
        <WidgetHost kind={config.widget} shell={toShell(config)} />
      ) : (
        <CalculatorWidget shell={toShell(config)} initialResult={initialResult} />
      )}

      {config.disclaimer && (
        <p role="note" className="mt-4 rounded-lg border-l-4 border-caution bg-surface px-4 py-3 text-sm">
          <strong>Important:</strong> {config.disclaimer}
        </p>
      )}

      <AdSlot label="Advertisement" />

      {content && content.howTo.length > 0 && (
        <section aria-labelledby="howto-heading" className="mt-10">
          <h2 id="howto-heading" className="text-2xl font-bold">
            How to use the {config.title.toLowerCase().includes('calculator') ? config.title : `${config.title} tool`}
          </h2>
          <ol className="mt-4 list-decimal space-y-2 pl-6">
            {content.howTo.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </section>
      )}

      {Content && (
        <div className="prose-cw mt-10">
          <Content />
        </div>
      )}

      <section aria-labelledby="assumptions-heading" className="mt-12">
        <h2 id="assumptions-heading" className="text-2xl font-bold">
          {config.estimate ? 'How this estimate works' : 'Assumptions'}
        </h2>
        <ul className="mt-4 list-disc space-y-1.5 pl-6">
          {config.assumptions.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      </section>

      {content && <Faq items={content.faq} />}

      <AdSlot label="Advertisement" />

      <SourcesList sources={config.sources} />
      {config.affiliate && <AffiliateBox keys={config.affiliate} />}
      <RelatedCalculators slugs={config.relatedCalculators} />
      <RelatedPosts slugs={relatedPosts} />
      <ReviewBox reviewedAgainst={config.reviewedAgainst} updated={config.updated} />

      <JsonLd data={calculatorLd(config)} />
    </article>
  );
}
