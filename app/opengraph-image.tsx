import { OG_SIZE, ogCard } from '@/lib/og';

export const size = OG_SIZE;
export const contentType = 'image/png';
export const alt = 'CoolWave — home climate and energy calculators';

export default function Image() {
  return ogCard({ title: 'Home climate, energy and weather calculators', label: 'coolwave.cool' });
}
