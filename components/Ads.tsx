'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import { onConsentChange, readConsent } from './consent';

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? '';

declare global {
  interface Window {
    adsbygoogle?: unknown[] & { requestNonPersonalizedAds?: number };
  }
}

/** Loads the AdSense script once, after the page is idle, only if a publisher ID is set. */
export function AdsenseLoader() {
  const consent = useSyncExternalStore(onConsentChange, readConsent, () => 'unset' as const);
  useEffect(() => {
    if (!CLIENT || consent === 'unset') return;
    if (document.getElementById('adsbygoogle-js')) return;
    const ads = (window.adsbygoogle = window.adsbygoogle || []);
    if (consent === 'rejected') ads.requestNonPersonalizedAds = 1;
    const load = () => {
      const s = document.createElement('script');
      s.id = 'adsbygoogle-js';
      s.async = true;
      s.crossOrigin = 'anonymous';
      s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CLIENT}`;
      document.head.appendChild(s);
    };
    if ('requestIdleCallback' in window) window.requestIdleCallback(load, { timeout: 4000 });
    else setTimeout(load, 2500);
  }, [consent]);
  return null;
}

/**
 * One ad unit. Renders nothing until NEXT_PUBLIC_ADSENSE_CLIENT is set.
 * When enabled, the box reserves its height so the page does not jump when the ad loads.
 */
export function AdSlot({ slot, label = 'Advertisement', minHeight = 280 }: { slot?: string; label?: string; minHeight?: number }) {
  const ref = useRef<HTMLModElement>(null);
  useEffect(() => {
    if (!CLIENT || !ref.current || ref.current.dataset.loaded) return;
    ref.current.dataset.loaded = '1';
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {}
  }, []);
  if (!CLIENT) return null;
  return (
    <div className="my-8" style={{ minHeight }} aria-label={label}>
      <p className="mb-1 text-center text-[0.7rem] uppercase tracking-wide text-muted">{label}</p>
      <ins
        ref={ref}
        className="adsbygoogle block"
        style={{ display: 'block', minHeight: minHeight - 20 }}
        data-ad-client={CLIENT}
        {...(slot ? { 'data-ad-slot': slot } : {})}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
