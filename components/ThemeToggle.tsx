'use client';

import { useSyncExternalStore } from 'react';

function subscribe(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => obs.disconnect();
}
const getTheme = () => document.documentElement.dataset.theme ?? 'light';

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => 'light');
  const next = theme === 'dark' ? 'light' : 'dark';
  return (
    <button
      type="button"
      onClick={() => {
        document.documentElement.dataset.theme = next;
        try {
          localStorage.setItem('cw-theme', next);
        } catch {}
      }}
      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface text-text hover:border-brand"
      aria-label={`Switch to ${next} mode`}
    >
      <span aria-hidden="true">{theme === 'dark' ? '☀' : '☾'}</span>
    </button>
  );
}

/** Inline, render-blocking script: applies the saved or system theme before first paint. */
export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('cw-theme');if(!t){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.dataset.theme=t}catch(e){}})();`;
