import type { Metadata } from 'next';
import { StaticPage } from '@/components/StaticPage';
import { pageMeta } from '@/lib/meta';
import { SITE } from '@/lib/site';

export const metadata: Metadata = pageMeta({
  title: 'Terms of Use',
  description: 'The terms for using CoolWave calculators and guides, including limits on how results should be relied on.',
  path: '/terms',
});

export default function TermsPage() {
  return (
    <StaticPage title="Terms of use" path="/terms" updated="November 8, 2026">
      <p>By using {SITE.name} you agree to these terms. If you do not agree, please do not use the site.</p>
      <h2>Information only</h2>
      <p>
        Calculators and guides are provided for general information and planning. Results depend on the inputs you give and on the
        assumptions stated on each page. They are not professional engineering, electrical, medical, food-safety or financial advice. For
        decisions about equipment sizing, safety or health, consult a qualified professional and follow official guidance in your area.
      </p>
      <h2>No warranty</h2>
      <p>
        We work hard to keep formulas accurate and sources current, but the site is provided “as is” without warranties of any kind. To the
        fullest extent permitted by law, we are not liable for any loss arising from use of the site or reliance on its results.
      </p>
      <h2>Acceptable use</h2>
      <p>
        You may use the calculators freely for personal and commercial purposes. You may not copy the site’s text in bulk, scrape it
        automatically at a rate that affects other users, or present our content as your own.
      </p>
      <h2>Third-party links</h2>
      <p>We link to official sources and to retailers. We are not responsible for the content or practices of other websites.</p>
      <h2>Changes</h2>
      <p>We may update these terms. The date above shows when they last changed.</p>
      <h2>Contact</h2>
      <p>
        <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
      </p>
    </StaticPage>
  );
}
