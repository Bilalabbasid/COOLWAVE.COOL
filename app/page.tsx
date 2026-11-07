import Link from 'next/link';
import type { Metadata } from 'next';
import { SearchBox, type SearchItem } from '@/components/SearchBox';
import { CalculatorCard, PostCard } from '@/components/Cards';
import { JsonLd } from '@/components/JsonLd';
import { CATEGORIES } from '@/lib/categories';
import { POPULAR, calculators, calculatorsInCategory, getCalculator, posts } from '@/lib/registry';
import { organizationLd, websiteLd } from '@/lib/seo';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: { absolute: 'CoolWave: BTU, Energy Cost & Weather Calculators' },
  description:
    'Free calculators for AC sizing, heating and electricity costs, dew point, wind chill and sound. Formulas checked against NWS, DOE and ASHRAE sources.',
  alternates: { canonical: '/' },
  openGraph: { url: '/', title: 'CoolWave: BTU, Energy Cost & Weather Calculators' },
};

export default function HomePage() {
  const searchItems: SearchItem[] = [
    ...calculators.map((c) => ({
      title: c.title,
      href: `/calculators/${c.slug}`,
      text: [c.shortDescription, c.primaryKeyword, ...c.secondaryKeywords].join(' '),
      kind: 'Calculator' as const,
    })),
    ...posts.map((p) => ({ title: p.title, href: `/blog/${p.slug}`, text: `${p.description} ${p.keyword}`, kind: 'Guide' as const })),
  ];
  const popular = POPULAR.map(getCalculator).filter((c): c is NonNullable<typeof c> => Boolean(c));

  return (
    <div className="mx-auto max-w-6xl px-4">
      <section className="py-10 sm:py-14">
        <h1 className="max-w-3xl text-3xl leading-tight font-extrabold tracking-tight sm:text-5xl">
          Home climate and energy calculators you can trust
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          Size an air conditioner, find out what a heater really costs to run, check the dew point or wind chill, and more. Every formula is
          checked against primary sources such as the US National Weather Service, the Department of Energy and ASHRAE. Imperial and metric
          units throughout.
        </p>
        <div className="mt-6 max-w-xl">
          <SearchBox items={searchItems} />
        </div>
      </section>

      {popular.length > 0 && (
        <section aria-labelledby="popular-heading" className="py-6">
          <h2 id="popular-heading" className="text-2xl font-bold">
            Popular calculators
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {popular.map((c) => (
              <li key={c.slug}>
                <CalculatorCard c={c} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {CATEGORIES.map((cat) => {
        const items = calculatorsInCategory(cat.slug);
        if (!items.length) return null;
        return (
          <section key={cat.slug} aria-labelledby={`${cat.slug}-heading`} className="py-6">
            <div className="flex items-baseline justify-between gap-4">
              <h2 id={`${cat.slug}-heading`} className="text-2xl font-bold">
                {cat.name}
              </h2>
              <Link href={`/category/${cat.slug}`} className="shrink-0 text-sm font-semibold text-brand hover:underline">
                All {cat.name.toLowerCase()} →
              </Link>
            </div>
            <p className="mt-1 text-muted">{cat.short}</p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((c) => (
                <li key={c.slug}>
                  <CalculatorCard c={c} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      {posts.length > 0 && (
        <section aria-labelledby="latest-heading" className="py-6">
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="latest-heading" className="text-2xl font-bold">
              Latest guides
            </h2>
            <Link href="/blog" className="shrink-0 text-sm font-semibold text-brand hover:underline">
              All guides →
            </Link>
          </div>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {posts.slice(0, 6).map((p) => (
              <li key={p.slug}>
                <PostCard p={p} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="py-8">
        <div className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="text-xl font-bold">Why trust {SITE.name}?</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-6 text-muted">
            <li>Every formula cites a primary source, and each calculator is unit-tested against reference values from that source.</li>
            <li>If a formula is only valid in a certain range, such as wind chill or heat index, we tell you instead of showing a wrong number.</li>
            <li>Results that are rules of thumb are clearly labelled as estimates, with the assumptions written out.</li>
          </ul>
        </div>
      </section>

      <JsonLd data={[organizationLd(), websiteLd()]} />
    </div>
  );
}
