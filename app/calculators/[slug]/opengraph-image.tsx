import { calculators, getCalculator } from '@/lib/registry';
import { getCategory } from '@/lib/categories';
import { OG_SIZE, ogCard } from '@/lib/og';

export const size = OG_SIZE;
export const contentType = 'image/png';
export const alt = 'CoolWave calculator';

export function generateStaticParams() {
  return calculators.map((c) => ({ slug: c.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const c = getCalculator((await params).slug);
  return ogCard({ title: c?.h1 ?? 'CoolWave calculator', label: getCategory(c?.category ?? '')?.name ?? 'Calculator' });
}
