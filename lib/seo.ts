import { SITE, absoluteUrl } from './site';
import type { CalculatorConfig } from './engine/types';
import type { FaqItem, PostMeta } from './registry-types';

export interface Crumb {
  name: string;
  path: string;
}

export function breadcrumbLd(crumbs: Crumb[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: absoluteUrl(c.path),
    })),
  };
}

export function faqLd(faq: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

export function organizationLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE.name,
    url: SITE.url,
    logo: absoluteUrl('/icon.png'),
    email: SITE.email,
    description: SITE.description,
  };
}

export function websiteLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE.name,
    url: SITE.url,
  };
}

export function calculatorLd(c: CalculatorConfig) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: c.h1,
    url: absoluteUrl(`/calculators/${c.slug}`),
    description: c.metaDescription,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    dateModified: c.updated,
    publisher: { '@type': 'Organization', name: SITE.name, url: SITE.url },
  };
}

export function blogPostingLd(p: PostMeta) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: p.title,
    description: p.description,
    datePublished: p.date,
    dateModified: p.updated,
    mainEntityOfPage: absoluteUrl(`/blog/${p.slug}`),
    image: absoluteUrl(p.image ?? `/blog/${p.slug}/opengraph-image`),
    author: { '@type': 'Organization', name: SITE.author, url: absoluteUrl('/about') },
    publisher: {
      '@type': 'Organization',
      name: SITE.name,
      url: SITE.url,
      logo: { '@type': 'ImageObject', url: absoluteUrl('/icon.png') },
    },
  };
}
