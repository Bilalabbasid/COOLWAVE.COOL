import { getPost, posts } from '@/lib/registry';
import { OG_SIZE, ogCard } from '@/lib/og';

export const size = OG_SIZE;
export const contentType = 'image/png';
export const alt = 'CoolWave guide';

export function generateStaticParams() {
  return posts.length ? posts.map((p) => ({ slug: p.slug })) : [{ slug: '_none' }];
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const p = getPost((await params).slug);
  return ogCard({ title: p?.title ?? 'CoolWave guide', label: 'Guide' });
}
