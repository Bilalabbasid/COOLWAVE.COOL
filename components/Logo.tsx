/** CoolWave wave mark: two stacked waves in blue and teal inside a rounded tile. */
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <rect width="32" height="32" rx="8" fill="#0b6e99" />
      <path d="M5 13.5c2.6-3 5.2-3 7.8 0s5.2 3 7.8 0 4.4-2.9 6.4-.4" fill="none" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M5 20.5c2.6-3 5.2-3 7.8 0s5.2 3 7.8 0 4.4-2.9 6.4-.4" fill="none" stroke="#7fe3d8" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="inline-flex items-center gap-2 font-bold text-lg tracking-tight text-text">
      <LogoMark />
      <span>
        Cool<span className="text-accent">Wave</span>
      </span>
    </span>
  );
}
