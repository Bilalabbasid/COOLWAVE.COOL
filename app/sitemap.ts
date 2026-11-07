import type { MetadataRoute } from 'next';
import { CATEGORIES } from '@/lib/categories';
import { calculators, posts, postsInCategory } from '@/lib/registry';
import { absoluteUrl } from '@/lib/site';

const STATIC_PAGES = ['/about', '/contact', '/privacy-policy', '/terms', '/affiliate-disclosure'];

export default function sitemap(): MetadataRoute.Sitemap {
  const latest = [...calculators.map((c) => c.updated), ...posts.map((p) => p.updated)].sort().at(-1);
  return [
    { url: absoluteUrl('/'), lastModified: latest, changeFrequency: 'weekly', priority: 1 },
    { url: absoluteUrl('/calculators'), lastModified: latest, changeFrequency: 'weekly', priority: 0.8 },
    { url: absoluteUrl('/blog'), lastModified: latest, changeFrequency: 'weekly', priority: 0.7 },
    ...CATEGORIES.map((c) => ({ url: absoluteUrl(`/category/${c.slug}`), lastModified: latest, changeFrequency: 'monthly' as const, priority: 0.7 })),
    ...calculators.map((c) => ({ url: absoluteUrl(`/calculators/${c.slug}`), lastModified: c.updated, changeFrequency: 'monthly' as const, priority: 0.9 })),
    ...CATEGORIES.filter((c) => postsInCategory(c.slug).length).map((c) => ({
      url: absoluteUrl(`/blog/category/${c.slug}`),
      lastModified: latest,
      changeFrequency: 'monthly' as const,
      priority: 0.4,
    })),
    ...posts.map((p) => ({ url: absoluteUrl(`/blog/${p.slug}`), lastModified: p.updated, changeFrequency: 'monthly' as const, priority: 0.6 })),
    ...STATIC_PAGES.map((path) => ({ url: absoluteUrl(path), changeFrequency: 'yearly' as const, priority: 0.2 })),
  ];
}
