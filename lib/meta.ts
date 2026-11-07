import type { Metadata } from 'next';
import { SITE } from './site';

/**
 * Complete per-page metadata. Next replaces (does not merge) a parent's openGraph/twitter objects,
 * so every page sets title, description, canonical, og:url and twitter fields together.
 */
export function pageMeta({
  title,
  description,
  path,
  absoluteTitle = false,
  type = 'website',
}: {
  title: string;
  description: string;
  path: string;
  absoluteTitle?: boolean;
  type?: 'website' | 'article';
}): Metadata {
  const fullTitle = absoluteTitle ? title : `${title} | ${SITE.name}`;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: { title: fullTitle, description, url: path, siteName: SITE.name, type, locale: 'en_US', images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: SITE.name }] },
    twitter: { card: 'summary_large_image', title: fullTitle, description, images: ['/opengraph-image'] },
  };
}
