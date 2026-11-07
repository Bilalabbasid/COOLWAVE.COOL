'use client';

import type { CalculatorShell } from '@/lib/engine/types';

// Placeholder until Phase 3 builds this widget.
export default function SnowDay({ shell }: { shell: CalculatorShell }) {
  return <p className="rounded-2xl border border-border bg-surface p-4">{shell.title} is loading.</p>;
}
