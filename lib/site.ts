export const SITE = {
  name: 'CoolWave',
  url: 'https://coolwave.cool',
  tagline: 'Calculators for home cooling, heating, energy and weather',
  description:
    'Free, source-checked calculators for air conditioner sizing, heating and energy costs, dew point, wind chill and sound. Imperial and metric units.',
  author: 'CoolWave Editorial',
  email: 'hello@coolwave.cool',
  locale: 'en',
} as const;

export const ENV = {
  adsenseClient: process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? '', // e.g. ca-pub-1234567890123456
  gscVerification: process.env.NEXT_PUBLIC_GSC_VERIFICATION ?? '',
};

export function absoluteUrl(path = '/'): string {
  if (path === '/' || path === '') return SITE.url;
  return `${SITE.url}${path.startsWith('/') ? path : `/${path}`}`.replace(/\/$/, '');
}
