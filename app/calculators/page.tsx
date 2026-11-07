import type { Metadata } from 'next';
import { pageMeta } from '@/lib/meta';
import Link from 'next/link';
import { Breadcrumb } from '@/components/Breadcrumb';
import { CalculatorCard } from '@/components/Cards';
import { CATEGORIES } from '@/lib/categories';
import { calculatorsInCategory } from '@/lib/registry';

export const metadata: Metadata = pageMeta({ title: "All Home Climate & Energy Calculators", description: "Every CoolWave calculator in one place: AC sizing, heating and energy costs, weather, ventilation and sound tools.", path: "/calculators" });

export default function AllCalculatorsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-3 pb-6 sm:pt-5">
      <Breadcrumb crumbs={[{ name: 'Calculators', path: '/calculators' }]} />
      <h1 className="mt-2 text-[1.75rem] leading-tight font-extrabold tracking-tight sm:mt-3 sm:text-3xl">All calculators</h1>
      <p className="mt-2 max-w-2xl text-muted">Pick a category or jump straight to a tool. All calculators support imperial and metric units.</p>
      {CATEGORIES.map((cat) => {
        const items = calculatorsInCategory(cat.slug);
        if (!items.length) return null;
        return (
          <section key={cat.slug} aria-labelledby={`${cat.slug}-h`} className="mt-8 sm:mt-10">
            <h2 id={`${cat.slug}-h`} className="text-xl font-bold sm:text-2xl">
              <Link href={`/category/${cat.slug}`} className="underline-offset-4 hover:text-brand hover:underline">
                {cat.name}
              </Link>
            </h2>
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
    </div>
  );
}
