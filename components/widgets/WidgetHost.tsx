'use client';

import dynamic from 'next/dynamic';
import type { CalculatorShell, WidgetKind } from '@/lib/engine/types';

const Loading = () => <div className="h-72 animate-pulse rounded-2xl border border-border bg-surface" />;

// Each widget is its own chunk, so a page only downloads the widget it uses.
const WIDGETS: Record<WidgetKind, React.ComponentType<{ shell: CalculatorShell }>> = {
  'noise-generator': dynamic(() => import('./NoiseGenerator'), { loading: Loading }),
  'tone-generator': dynamic(() => import('./ToneGenerator'), { loading: Loading }),
  'decibel-meter': dynamic(() => import('./DecibelMeter'), { loading: Loading }),
  'snow-day': dynamic(() => import('./SnowDay'), { loading: Loading }),
};

export function WidgetHost({ kind, shell }: { kind: WidgetKind; shell: CalculatorShell }) {
  const W = WIDGETS[kind];
  return <W shell={shell} />;
}
