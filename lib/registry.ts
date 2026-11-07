import { CALCULATOR_ENTRIES } from '@/calculators/_registry.generated';
import { POSTS } from '@/content/blog/_posts.generated';
import type { CategorySlug } from './categories';

export const calculators = CALCULATOR_ENTRIES.map((e) => e.config);

export function getCalculatorEntry(slug: string) {
  return CALCULATOR_ENTRIES.find((e) => e.config.slug === slug);
}

export function getCalculator(slug: string) {
  return calculators.find((c) => c.slug === slug);
}

export function calculatorsInCategory(cat: CategorySlug) {
  return calculators.filter((c) => c.category === cat);
}

export const posts = POSTS;

export function getPost(slug: string) {
  return POSTS.find((p) => p.slug === slug);
}

export function postsInCategory(cat: CategorySlug) {
  return POSTS.filter((p) => p.category === cat);
}

export function postsForCalculator(slug: string) {
  return POSTS.filter((p) => p.calculator === slug);
}

/** Calculators the editorial team considers the most useful starting points. */
export const POPULAR = [
  'btu-calculator',
  'electricity-cost-calculator',
  'dew-point-calculator',
  'heat-index-calculator',
  'mini-split-size-calculator',
  'noise-generator',
];
