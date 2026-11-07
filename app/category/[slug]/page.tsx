import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Breadcrumb } from '@/components/Breadcrumb';
import { CalculatorCard, PostCard } from '@/components/Cards';
import { CATEGORIES, getCategory } from '@/lib/categories';
import { calculatorsInCategory, postsInCategory } from '@/lib/registry';

export const dynamicParams = false;

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<'/category/[slug]'>): Promise<Metadata> {
  const cat = getCategory((await params).slug);
  if (!cat) return {};
  return {
    title: `${cat.name} Calculators`,
    description: `${cat.short} Free ${cat.name.toLowerCase()} calculators with imperial and metric units, checked against primary sources.`.slice(0, 155),
    alternates: { canonical: `/category/${cat.slug}` },
  };
}

export default async function CategoryPage({ params }: PageProps<'/category/[slug]'>) {
  const cat = getCategory((await params).slug);
  if (!cat) notFound();
  const calcs = calculatorsInCategory(cat.slug);
  const guides = postsInCategory(cat.slug);
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <Breadcrumb crumbs={[{ name: cat.name, path: `/category/${cat.slug}` }]} />
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight">{cat.name} calculators</h1>
      <p className="mt-3 max-w-3xl text-lg text-muted">{cat.intro}</p>
      <section aria-labelledby="calcs-h" className="mt-8">
        <h2 id="calcs-h" className="text-2xl font-bold">
          Calculators
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {calcs.map((c) => (
            <li key={c.slug}>
              <CalculatorCard c={c} />
            </li>
          ))}
        </ul>
      </section>
      {guides.length > 0 && (
        <section aria-labelledby="guides-h" className="mt-10">
          <h2 id="guides-h" className="text-2xl font-bold">
            Guides
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
