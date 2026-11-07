'use client';

import Link from 'next/link';
import { useSyncExternalStore } from 'react';
import { onConsentChange, readConsent, writeConsent } from './consent';

export function CookieConsent() {
  const state = useSyncExternalStore(onConsentChange, readConsent, () => 'not-required' as const);
  if (state !== 'unset') return null;
  return (
    <div role="region" aria-label="Cookie consent" className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.12)] sm:py-4">
      <div className="mx-auto flex max-w-5xl flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <p className="text-[0.8125rem] leading-snug text-text sm:text-sm">
          We use cookies for advertising and to remember your settings. You can accept them or continue with essential cookies only.{' '}
          <Link href="/privacy-policy" className="text-brand underline">
            Privacy policy
          </Link>
        </p>
        <div className="flex shrink-0 gap-2 *:flex-1 sm:*:flex-none">
          <button type="button" onClick={() => writeConsent('rejected')} className="min-h-11 rounded-lg border border-field-border px-4 text-sm font-semibold hover:border-brand">
            Essential only
          </button>
          <button type="button" onClick={() => writeConsent('accepted')} className="min-h-11 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-strong dark:text-bg">
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
