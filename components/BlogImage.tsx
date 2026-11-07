import Image from 'next/image';

/** Inline article image (lazy-loaded). Images live in /public/images/blog and are 1200x630 WebP. */
export function BlogImage({ src, alt, caption }: { src: string; alt: string; caption?: string }) {
  return (
    <figure className="my-6">
      <Image src={src} alt={alt} width={1200} height={630} sizes="(min-width: 768px) 720px, 100vw" className="h-auto w-full rounded-xl border border-border" />
      {caption && <figcaption className="mt-2 text-center text-sm text-muted">{caption}</figcaption>}
    </figure>
  );
}
