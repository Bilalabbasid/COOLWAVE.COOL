import type { Metadata } from 'next';
import { StaticPage } from '@/components/StaticPage';
import { pageMeta } from '@/lib/meta';
import { SITE } from '@/lib/site';

export const metadata: Metadata = pageMeta({
  title: 'Affiliate Disclosure',
  description: 'How CoolWave earns money from affiliate links and ads, and why it never changes our calculations.',
  path: '/affiliate-disclosure',
});

export default function AffiliateDisclosurePage() {
  return (
    <StaticPage title="Affiliate disclosure" path="/affiliate-disclosure" updated="November 8, 2026">
      <p>
        {SITE.name} is free to use. We pay for it through display advertising and affiliate links. When a page links to a retailer with a
        “Shopping for equipment?” box, those links are affiliate links: if you buy something after clicking, we may earn a small commission at
        no extra cost to you.
      </p>
      <p>
        <strong>As an Amazon Associate, {SITE.name} earns from qualifying purchases.</strong>
      </p>
      <h2>What this does not change</h2>
      <ul>
        <li>Our formulas, results and recommendations are the same whether or not a page has affiliate links.</li>
        <li>We link to product categories, not to specific products we have not assessed.</li>
        <li>Affiliate links are marked with rel=&quot;sponsored&quot; and always appear below the calculator, never inside a result.</li>
      </ul>
      <p>
        Questions? Email <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
      </p>
    </StaticPage>
  );
}
