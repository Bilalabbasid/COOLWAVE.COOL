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
    <>
      <section className="cw-hero relative z-10">
        {/* Decorative wave: fixed height and absolutely positioned, so it never shifts layout. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-10 overflow-hidden sm:h-14">
          <svg viewBox="0 0 1200 56" preserveAspectRatio="none" className="cw-hero-wave absolute bottom-0 left-0 h-full w-[106%]">
            <path
              d="M0 30c100-22 200-22 300 0s200 22 300 0 200-22 300 0 200 22 300 0"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
              className="text-brand opacity-25"
            />
            <path
              d="M0 42c100-18 200-18 300 0s200 18 300 0 200-18 300 0 200 18 300 0"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
              className="text-accent opacity-30"
            />
          </svg>
        </div>
        <div className="mx-auto max-w-6xl px-4 pt-8 pb-12 sm:pt-14 sm:pb-20">
          <h1 className="max-w-3xl text-[1.875rem] leading-[1.15] font-extrabold tracking-tight sm:text-5xl">
            Home climate and energy calculators you can trust
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted sm:mt-4 sm:text-lg">
            Size an air conditioner, find out what a heater really costs to run, check the dew point or wind chill, and more. Every formula is
            checked against primary sources such as the US National Weather Service, the Department of Energy and ASHRAE. Imperial and metric
            units throughout.
          </p>
          <div className="mt-5 max-w-xl sm:mt-6">
            <SearchBox items={searchItems} />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 pt-2">
        {popular.length > 0 && (
          <section aria-labelledby="popular-heading" className="py-5 sm:py-7">
            <h2 id="popular-heading" className="text-xl font-bold sm:text-2xl">
              Popular calculators
            </h2>
            <ul className="mt-3 grid gap-3 sm:mt-4 sm:grid-cols-2 lg:grid-cols-3">
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
            <section key={cat.slug} aria-labelledby={`${cat.slug}-heading`} className="py-5 sm:py-7">
              <div className="flex items-baseline justify-between gap-4">
                <h2 id={`${cat.slug}-heading`} className="text-xl font-bold sm:text-2xl">
                  {cat.name}
                </h2>
                <Link href={`/category/${cat.slug}`} className="-my-2 inline-flex min-h-11 shrink-0 items-center text-sm font-semibold text-brand underline-offset-2 hover:underline">
                  All {cat.name.toLowerCase()} →
                </Link>
              </div>
              <p className="mt-1 text-[0.95rem] text-muted">{cat.short}</p>
              <ul className="mt-3 grid gap-3 sm:mt-4 sm:grid-cols-2 lg:grid-cols-3">
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
          <section aria-labelledby="latest-heading" className="py-5 sm:py-7">
            <div className="flex items-baseline justify-between gap-4">
              <h2 id="latest-heading" className="text-xl font-bold sm:text-2xl">
                Latest guides
              </h2>
              <Link href="/blog" className="-my-2 inline-flex min-h-11 shrink-0 items-center text-sm font-semibold text-brand underline-offset-2 hover:underline">
                All guides →
              </Link>
            </div>
            <ul className="mt-3 grid gap-3 sm:mt-4 sm:grid-cols-2 lg:grid-cols-3">
              {posts.slice(0, 6).map((p) => (
                <li key={p.slug}>
                  <PostCard p={p} />
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="py-6 sm:py-8">
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-sm)] sm:p-6">
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
    </>
  );
}
