import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Faq } from '@/components/Faq';
import { RelatedPosts } from '@/components/RelatedCalculators';
import { AdSlot } from '@/components/Ads';
import { JsonLd } from '@/components/JsonLd';
import { POST_LOADERS } from '@/content/blog/_posts.generated';
import { getCalculator, getPost, posts } from '@/lib/registry';
import { getCategory } from '@/lib/categories';
import { blogPostingLd } from '@/lib/seo';
import { SITE } from '@/lib/site';

export const dynamicParams = false;

export function generateStaticParams() {
  // Next requires at least one param; "_none" never matches a real post and 404s.
  return posts.length ? posts.map((p) => ({ slug: p.slug })) : [{ slug: '_none' }];
}

export async function generateMetadata({ params }: PageProps<'/blog/[slug]'>): Promise<Metadata> {
  const p = getPost((await params).slug);
  if (!p) return {};
  const url = `/blog/${p.slug}`;
  return {
    title: { absolute: p.title.length <= 60 ? p.title : p.title.slice(0, 57) + '…' },
    description: p.description,
    alternates: { canonical: url },
    authors: [{ name: SITE.author }],
    openGraph: {
      type: 'article',
      url,
      title: p.title,
      description: p.description,
      publishedTime: p.date,
      modifiedTime: p.updated,
      ...(p.image ? { images: [{ url: p.image, width: 1200, height: 630, alt: p.imageAlt ?? p.title }] } : {}),
    },
    twitter: { title: p.title, description: p.description },
  };
}

const fmt = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });

export default async function PostPage({ params }: PageProps<'/blog/[slug]'>) {
  const { slug } = await params;
  const p = getPost(slug);
  const loader = POST_LOADERS[slug];
  if (!p || !loader) notFound();
  const { default: Content } = await loader();
  const cat = getCategory(p.category)!;
  const calc = getCalculator(p.calculator);
  const related = p.related ?? posts.filter((x) => x.category === p.category && x.slug !== p.slug).slice(0, 3).map((x) => x.slug);

  return (
    <article className="mx-auto max-w-3xl px-4 pt-4 pb-8">
      <Breadcrumb
        crumbs={[
          { name: 'Guides', path: '/blog' },
          { name: cat.name, path: `/blog/category/${cat.slug}` },
          { name: p.title, path: `/blog/${p.slug}` },
        ]}
      />
      <h1 className="mt-3 text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl">{p.title}</h1>
      <p className="mt-3 text-sm text-muted">
        By{' '}
        <Link href="/about" className="font-semibold text-text underline-offset-2 hover:underline">
          {SITE.author}
        </Link>{' '}
        · Last updated <time dateTime={p.updated}>{fmt(p.updated)}</time>
      </p>
      {p.image && (
        <Image
          src={p.image}
          alt={p.imageAlt ?? ''}
          width={1200}
          height={630}
          priority
          sizes="(min-width: 768px) 720px, 100vw"
          className="mt-6 h-auto w-full rounded-xl border border-border"
        />
      )}
      {calc && (
        <p className="mt-6 rounded-xl border border-border bg-surface-2 p-4 text-sm">
          <strong>Want the number for your home?</strong> Use the{' '}
          <Link href={`/calculators/${calc.slug}`} className="font-semibold text-brand underline">
            {calc.title}
          </Link>{' '}
          alongside this guide.
        </p>
      )}
      <div className="prose-cw mt-8">
        <Content />
      </div>
      <AdSlot label="Advertisement" />
      {p.faq && <Faq items={p.faq} />}
      <RelatedPosts slugs={related} heading="Keep reading" />
      <JsonLd data={blogPostingLd(p)} />
    </article>
  );
}
