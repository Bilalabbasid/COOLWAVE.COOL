import type { Metadata } from 'next';
import { StaticPage } from '@/components/StaticPage';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How CoolWave handles data: calculations run in your browser, what cookies are used for advertising, and your choices.',
  alternates: { canonical: '/privacy-policy' },
};

export default function PrivacyPage() {
  return (
    <StaticPage title="Privacy policy" path="/privacy-policy" updated="November 8, 2026">
      <p>
        This policy explains what information is collected when you use {SITE.name} ({SITE.url}) and how it is used. We have kept it short
        because we collect very little.
      </p>
      <h2>Calculations stay in your browser</h2>
      <p>
        Everything you type into a calculator is processed on your own device. We do not receive or store your inputs. If you use “Copy share
        link”, your inputs are placed in the link itself, so anyone you send it to can see them.
      </p>
      <p>
        The noise generator, tone generator and decibel meter also run entirely in your browser. The decibel meter asks for microphone
        permission; the audio is analysed on your device and is never recorded or uploaded.
      </p>
      <h2>Settings saved on your device</h2>
      <p>
        We use your browser’s local storage to remember your light/dark theme choice and your cookie choice. This information never leaves
        your device.
      </p>
      <h2>Advertising</h2>
      <p>
        We may show ads served by Google AdSense. Google and its partners use cookies to serve ads based on your visits to this and other
        websites. You can opt out of personalised advertising at{' '}
        <a href="https://adssettings.google.com">Google Ads Settings</a>. Learn how Google uses information from sites that use its services at{' '}
        <a href="https://policies.google.com/technologies/partner-sites">policies.google.com/technologies/partner-sites</a>.
      </p>
      <p>
        If you are in the UK, EU, EEA or Switzerland we ask for your consent before personalised ads are used. If you choose “Essential only”,
        any ads shown are non-personalised. You can change your choice at any time by clearing this site’s data in your browser.
      </p>
      <h2>Hosting and logs</h2>
      <p>
        The site is hosted by Vercel, which may process standard technical data such as IP addresses in server logs to deliver and protect the
        service. See <a href="https://vercel.com/legal/privacy-policy">Vercel’s privacy policy</a>.
      </p>
      <h2>Affiliate links</h2>
      <p>
        Some pages link to retailers such as Amazon. If you click a link, that retailer may set its own cookies to track the referral. See our
        affiliate disclosure for details.
      </p>
      <h2>Children</h2>
      <p>This site is not directed at children under 13 and we do not knowingly collect information from them.</p>
      <h2>Contact</h2>
      <p>
        Questions about privacy: <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
      </p>
    </StaticPage>
  );
}
