import { ImageResponse } from 'next/og';

export const OG_SIZE = { width: 1200, height: 630 };

/** Branded Open Graph card: wave background, title and a small label. Rendered at build time. */
export function ogCard({ title, label }: { title: string; label: string }) {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
          background: 'linear-gradient(135deg, #075074 0%, #0b6e99 55%, #0e8f88 100%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 36, fontWeight: 700 }}>
          <svg width="56" height="56" viewBox="0 0 32 32">
            <rect width="32" height="32" rx="8" fill="#ffffff" fillOpacity="0.16" />
            <path d="M5 13.5c2.6-3 5.2-3 7.8 0s5.2 3 7.8 0 4.4-2.9 6.4-.4" fill="none" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" />
            <path d="M5 20.5c2.6-3 5.2-3 7.8 0s5.2 3 7.8 0 4.4-2.9 6.4-.4" fill="none" stroke="#7fe3d8" strokeWidth="2.6" strokeLinecap="round" />
          </svg>
          CoolWave
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ fontSize: 28, color: '#bdeef0', textTransform: 'uppercase', letterSpacing: 2 }}>{label}</div>
          <div style={{ fontSize: title.length > 48 ? 60 : 72, fontWeight: 800, lineHeight: 1.08, maxWidth: 1000 }}>{title}</div>
        </div>
        <svg width="1056" height="60" viewBox="0 0 1056 60" style={{ opacity: 0.35 }}>
          <path d="M0 30 C 88 0, 176 0, 264 30 S 440 60, 528 30 S 704 0, 792 30 S 968 60, 1056 30" fill="none" stroke="#ffffff" strokeWidth="6" />
        </svg>
      </div>
    ),
    OG_SIZE,
  );
}
