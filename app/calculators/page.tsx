import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumb } from '@/components/Breadcrumb';
import { CalculatorCard } from '@/components/Cards';
import { CATEGORIES } from '@/lib/categories';
import { calculatorsInCategory } from '@/lib/registry';

export const metadata: Metadata = {
  title: 'All Home Climate & Energy Calculators',
  description: 'Every CoolWave calculator in one place: AC sizing, heating and energy costs, weather, ventilation and sound tools.',
  alternates: { canonical: '/calculators' },
};

export default function AllCalculatorsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <Breadcrumb crumbs={[{ name: 'Calculators', path: '/calculators' }]} />
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight">All calculators</h1>
      <p className="mt-2 max-w-2xl text-muted">Pick a category or jump straight to a tool. All calculators support imperial and metric units.</p>
      {CATEGORIES.map((cat) => {
        const items = calculatorsInCategory(cat.slug);
        if (!items.length) return null;
        return (
          <section key={cat.slug} aria-labelledby={`${cat.slug}-h`} className="mt-10">
            <h2 id={`${cat.slug}-h`} className="text-2xl font-bold">
              <Link href={`/category/${cat.slug}`} className="hover:text-brand">
                {cat.name}
              </Link>
            </h2>
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
    </div>
  );
}
