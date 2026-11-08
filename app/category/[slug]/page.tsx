import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Breadcrumb } from '@/components/Breadcrumb';
import { CalculatorCard, PostCard } from '@/components/Cards';
import { CATEGORIES, getCategory } from '@/lib/categories';
import { calculatorsInCategory, postsInCategory } from '@/lib/registry';
import { pageMeta } from '@/lib/meta';

export const dynamicParams = false;

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<'/category/[slug]'>): Promise<Metadata> {
  const cat = getCategory((await params).slug);
  if (!cat) return {};
  return pageMeta({
    title: `${cat.name} Calculators`,
    description: `${cat.short} Free ${cat.name.toLowerCase()} calculators with imperial and metric units, checked against primary sources.`.slice(0, 155),
    path: `/category/${cat.slug}`,
  });
}

export default async function CategoryPage({ params }: PageProps<'/category/[slug]'>) {
  const cat = getCategory((await params).slug);
  if (!cat) notFound();
  const calcs = calculatorsInCategory(cat.slug);
  const guides = postsInCategory(cat.slug);
  return (
    <div className="mx-auto max-w-6xl px-4 pt-3 pb-6 sm:pt-5">
      <Breadcrumb crumbs={[{ name: cat.name, path: `/category/${cat.slug}` }]} />
      <h1 className="mt-2 text-[1.75rem] leading-tight font-extrabold tracking-tight sm:mt-3 sm:text-3xl">{cat.name} calculators</h1>
      <p className="mt-2 max-w-3xl text-base text-muted sm:mt-3 sm:text-lg">{cat.intro}</p>
      <section aria-labelledby="calcs-h" className="mt-8">
        <h2 id="calcs-h" className="text-xl font-bold sm:text-2xl">
          Calculators
        </h2>
        <ul className="mt-3 grid gap-3 sm:mt-4 sm:grid-cols-2 lg:grid-cols-3">
          {calcs.map((c) => (
            <li key={c.slug}>
              <CalculatorCard c={c} />
            </li>
          ))}
        </ul>
      </section>
      {guides.length > 0 && (
        <section aria-labelledby="guides-h" className="mt-8 sm:mt-10">
          <h2 id="guides-h" className="text-xl font-bold sm:text-2xl">
            Guides
          </h2>
          <ul className="mt-3 grid gap-3 sm:mt-4 sm:grid-cols-2 lg:grid-cols-3">
            {guides.map((p) => (
              <li key={p.slug}>
                <PostCard p={p} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
