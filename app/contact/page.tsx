import type { Metadata } from 'next';
import { StaticPage } from '@/components/StaticPage';
import { pageMeta } from '@/lib/meta';
import { SITE } from '@/lib/site';

export const metadata: Metadata = pageMeta({
  title: 'Contact CoolWave',
  description: 'Report an error, suggest a calculator or ask a question. Email the CoolWave editorial team.',
  path: '/contact',
});

export default function ContactPage() {
  return (
    <StaticPage title="Contact us" path="/contact">
      <p>
        The quickest way to reach us is by email:{' '}
        <a href={`mailto:${SITE.email}`}>
          <strong>{SITE.email}</strong>
        </a>
        . We read everything and usually reply within a few working days.
      </p>
      <h2>Reporting an error</h2>
      <p>To help us check it quickly, please include:</p>
      <ul>
        <li>the page address (URL), or use the “Copy share link” button on the calculator so we can see your exact inputs;</li>
        <li>the result you expected and where that figure comes from.</li>
      </ul>
      <h2>Suggestions</h2>
      <p>We add calculators where there is clear demand and a reliable source for the method. Tell us what you would like to see.</p>
      <p>We cannot give personal engineering, medical or financial advice, or quote for installation work.</p>
    </StaticPage>
  );
}
