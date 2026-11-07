import type { MDXContent } from 'mdx/types';
import type { CalculatorConfig } from './engine/types';
import type { CategorySlug } from './categories';

export interface FaqItem {
  q: string;
  /** Plain text (used in FAQPage structured data and the visible accordion). */
  a: string;
}

export interface CalculatorContentModule {
  default: MDXContent;
  faq: FaqItem[];
  howTo: string[];
}

export interface CalculatorEntry {
  config: CalculatorConfig;
  content: CalculatorContentModule | null;
}

export interface PostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  updated: string;
  category: CategorySlug;
  /** Slug of the calculator this post supports. */
  calculator: string;
  keyword: string;
  related?: string[];
  image?: string;
  imageAlt?: string;
  faq?: FaqItem[];
}
