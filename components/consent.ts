export type ConsentState = 'accepted' | 'rejected' | 'unset' | 'not-required';
const KEY = 'cw-consent';
const EVENT = 'cw-consent-change';

/** UK/EU/EEA/Swiss visitors (by time zone) see the banner; others are not asked. */
export function consentRequired(): boolean {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
    return tz.startsWith('Europe/') || tz === 'Atlantic/Reykjavik' || tz === 'Atlantic/Canary' || tz === 'Atlantic/Madeira' || tz === 'Atlantic/Azores';
  } catch {
    return true;
  }
}

export function readConsent(): ConsentState {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'accepted' || v === 'rejected') return v;
  } catch {}
  return consentRequired() ? 'unset' : 'not-required';
}

export function writeConsent(v: 'accepted' | 'rejected') {
  try {
    localStorage.setItem(KEY, v);
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

export function onConsentChange(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener('storage', cb);
  };
}
