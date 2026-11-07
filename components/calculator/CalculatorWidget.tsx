'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { CALCULATOR_LOADERS } from '@/calculators/_loaders.generated';
import { formatOutput } from '@/lib/engine/format';
import { unitLabel } from '@/lib/engine/units';
import {
  bySystem,
  type CalculatorConfig,
  type CalculatorShell,
  type ComputeResult,
  type InputValues,
  type ResultStatus,
  type UnitSystem,
} from '@/lib/engine/types';
import { convertValues, decodeState, defaultValues, encodeState, isVisible, validateValues } from '@/lib/engine/values';

const STATUS_STYLES: Record<ResultStatus, string> = {
  info: 'border-brand/40',
  good: 'border-good',
  caution: 'border-caution',
  warning: 'border-caution',
  danger: 'border-danger',
};

function hasUnitToggle(shell: CalculatorShell): boolean {
  const differs = (v: unknown) => typeof v === 'object' && v !== null;
  return (
    shell.inputs.some((i) => i.type === 'number' && (i.unit || differs(i.unitLabel))) ||
    shell.outputs.some((o) => o.unit || differs(o.unitLabel))
  );
}

function toRaw(values: InputValues): Record<string, string> {
  const raw: Record<string, string> = {};
  for (const [k, v] of Object.entries(values)) if (typeof v === 'number') raw[k] = Number.isFinite(v) ? String(v) : '';
  return raw;
}

export function CalculatorWidget({ shell, initialResult }: { shell: CalculatorShell; initialResult: ComputeResult }) {
  const uid = useId();
  const startSystem: UnitSystem = shell.defaultUnitSystem ?? 'imperial';
  const [system, setSystem] = useState<UnitSystem>(startSystem);
  const [values, setValues] = useState<InputValues>(() => defaultValues(shell, startSystem));
  const [raw, setRaw] = useState<Record<string, string>>(() => toRaw(defaultValues(shell, startSystem)));
  const [config, setConfig] = useState<CalculatorConfig | null>(null);
  const [touched, setTouched] = useState(false);
  const [copied, setCopied] = useState<'' | 'result' | 'link'>('');
  const urlTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToggle = hasUnitToggle(shell);

  // Load the compute function (small per-calculator chunk) and restore any shared state from the URL.
  useEffect(() => {
    let alive = true;
    CALCULATOR_LOADERS[shell.slug]?.().then((m) => alive && setConfig(m.default));
    const decoded = decodeState(shell, window.location.search, startSystem);
    if (decoded) {
      setSystem(decoded.system);
      setValues(decoded.values);
      setRaw(toRaw(decoded.values));
      setTouched(true);
    }
    return () => {
      alive = false;
    };
  }, [shell, startSystem]);

  const errors = useMemo(() => validateValues(config ?? shell, values, system), [config, shell, values, system]);
  const hasErrors = Object.keys(errors).length > 0;

  const result: ComputeResult | null = useMemo(() => {
    if (hasErrors) return null;
    if (config) {
      try {
        return config.compute(values, system);
      } catch {
        return { ok: false, error: 'Something went wrong with these inputs. Please check them and try again.' };
      }
    }
    return touched ? null : initialResult;
  }, [config, values, system, hasErrors, touched, initialResult]);

  // Keep the address bar shareable once the user has changed something.
  useEffect(() => {
    if (!touched) return;
    if (urlTimer.current) clearTimeout(urlTimer.current);
    urlTimer.current = setTimeout(() => {
      const qs = encodeState(shell, values, system);
      window.history.replaceState(null, '', `${window.location.pathname}?${qs}`);
    }, 400);
  }, [touched, shell, values, system]);

  const update = useCallback((id: string, v: number | string | boolean) => {
    setTouched(true);
    setValues((prev) => ({ ...prev, [id]: v }));
  }, []);

  const switchSystem = (to: UnitSystem) => {
    if (to === system) return;
    const next = convertValues(shell, values, system, to);
    setSystem(to);
    setValues(next);
    setRaw(toRaw(next));
    setTouched(true);
  };

  const primary = shell.outputs.find((o) => o.primary) ?? shell.outputs[0];

  const resultText = () => {
    if (!result?.ok) return '';
    const lines = shell.outputs
      .map((o) => {
        const f = formatOutput(o, result.values[o.id], system, values);
        return f.value === '—' ? null : `${o.label}: ${f.value}${f.unit ? ` ${f.unit}` : ''}`;
      })
      .filter(Boolean);
    return `${shell.title} (CoolWave)\n${lines.join('\n')}\n${window.location.origin}${window.location.pathname}?${encodeState(shell, values, system)}`;
  };

  const copy = async (what: 'result' | 'link') => {
    const text = what === 'result' ? resultText() : `${window.location.origin}${window.location.pathname}?${encodeState(shell, values, system)}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(''), 2000);
    } catch {
      window.prompt('Copy this:', text);
    }
  };

  return (
    <section aria-label={`${shell.title} tool`} className="rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5">
      {showToggle && (
        <div className="mb-3 flex items-center justify-between gap-3">
          <span id={`${uid}-units`} className="text-sm font-semibold text-muted">
            Units
          </span>
          <div role="group" aria-labelledby={`${uid}-units`} className="inline-flex rounded-lg border border-border bg-surface-2 p-0.5 text-sm">
            {(['imperial', 'metric'] as const).map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={system === s}
                onClick={() => switchSystem(s)}
                className={`rounded-md px-3 py-1.5 font-semibold transition ${system === s ? 'bg-brand text-white dark:text-bg' : 'text-muted hover:text-text'}`}
              >
                {s === 'imperial' ? 'Imperial' : 'Metric'}
              </button>
            ))}
          </div>
        </div>
      )}

      <form className="grid grid-cols-2 gap-x-3 gap-y-3" onSubmit={(e) => e.preventDefault()} noValidate>
        {shell.inputs.map((input) => {
          if (!isVisible(input, values)) return null;
          const id = `${uid}-${input.id}`;
          const err = errors[input.id];
          const helpId = input.help ? `${id}-help` : undefined;
          const errId = err ? `${id}-err` : undefined;
          const describedBy = [errId, helpId].filter(Boolean).join(' ') || undefined;
          const wide = input.type === 'select' || input.type === 'toggle' || input.label.length > 26;

          if (input.type === 'toggle') {
            return (
              <div key={input.id} className="col-span-2 flex items-start gap-2">
                <input
                  id={id}
                  type="checkbox"
                  checked={Boolean(values[input.id])}
                  onChange={(e) => update(input.id, e.target.checked)}
                  aria-describedby={describedBy}
                  className="mt-1 h-5 w-5 accent-[var(--brand)]"
                />
                <label htmlFor={id} className="text-sm">
                  <span className="font-semibold">{input.label}</span>
                  {input.help && (
                    <span id={helpId} className="block text-muted">
                      {input.help}
                    </span>
                  )}
                </label>
              </div>
            );
          }

          const unit =
            input.type === 'number' ? (input.unit ? unitLabel(input.unit, system) : input.unitLabel ? bySystem(input.unitLabel, system) : '') : '';

          return (
            <div key={input.id} className={wide ? 'col-span-2' : 'col-span-2 min-[380px]:col-span-1'}>
              <label htmlFor={id} className="mb-1 block text-sm font-semibold">
                {input.label}
              </label>
              {input.type === 'select' ? (
                <select
                  id={id}
                  value={String(values[input.id])}
                  onChange={(e) => update(input.id, e.target.value)}
                  aria-describedby={describedBy}
                  className="h-11 w-full rounded-lg border border-border bg-bg px-3 text-base"
                >
                  {input.options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : (
                <div className={`flex h-11 items-center rounded-lg border bg-bg focus-within:border-brand ${err ? 'border-danger' : 'border-border'}`}>
                  <input
                    id={id}
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={raw[input.id] ?? ''}
                    onChange={(e) => {
                      const text = e.target.value.replace(',', '.');
                      setRaw((r) => ({ ...r, [input.id]: e.target.value }));
                      const n = text.trim() === '' || text === '-' || text === '.' ? NaN : Number(text);
                      update(input.id, n);
                    }}
                    aria-invalid={Boolean(err)}
                    aria-describedby={describedBy}
                    className="h-full w-full min-w-0 rounded-lg bg-transparent px-3 text-base outline-none"
                  />
                  {unit && <span className="pr-3 text-sm whitespace-nowrap text-muted">{unit}</span>}
                </div>
              )}
              {err && (
                <p id={errId} role="alert" className="mt-1 text-sm text-danger">
                  {err}
                </p>
              )}
              {input.help && !err && (
                <p id={helpId} className="mt-1 text-xs text-muted">
                  {input.help}
                </p>
              )}
            </div>
          );
        })}
      </form>

      <div aria-live="polite" className="mt-4">
        {hasErrors ? (
          <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted">Fix the highlighted field to see your result.</p>
        ) : !result ? (
          <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted">Calculating…</p>
        ) : !result.ok ? (
          <div className="rounded-xl border-2 border-caution bg-surface-2 p-4" role="status">
            <p className="font-semibold">No result for these inputs</p>
            <p className="mt-1 text-sm">{result.error}</p>
          </div>
        ) : (
          <div className={`rounded-xl border-2 bg-surface-2 p-4 ${STATUS_STYLES[result.status ?? 'info']}`}>
            {shell.estimate && (
              <span className="mb-2 inline-block rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-text">Estimate</span>
            )}
            {primary && (() => {
              const f = formatOutput(primary, result.values[primary.id], system, values);
              return (
                <div>
                  <p className="text-sm font-semibold text-muted">{primary.label}</p>
                  <p className="text-3xl font-extrabold tracking-tight text-brand">
                    {f.value}
                    {f.unit && <span className="ml-1.5 text-lg font-bold text-text">{f.unit}</span>}
                  </p>
                </div>
              );
            })()}
            {result.summary && <p className="mt-2 text-sm">{result.summary}</p>}
            {shell.outputs.length > 1 && (
              <dl className="mt-3 grid gap-x-4 gap-y-2 border-t border-border pt-3 text-sm sm:grid-cols-2">
                {shell.outputs
                  .filter((o) => o !== primary)
                  .map((o) => {
                    const f = formatOutput(o, result.values[o.id], system, values);
                    if (f.value === '—') return null;
                    return (
                      <div key={o.id}>
                        <dt className="text-muted">{o.label}</dt>
                        <dd className="font-semibold">
                          {f.value}
                          {f.unit ? ` ${f.unit}` : ''}
                        </dd>
                        {result.interpretations?.[o.id] && <dd className="text-xs text-muted">{result.interpretations[o.id]}</dd>}
                      </div>
                    );
                  })}
              </dl>
            )}
            {result.notes && result.notes.length > 0 && (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-muted">
                {result.notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => copy('result')} className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold hover:border-brand">
                {copied === 'result' ? 'Copied ✓' : 'Copy result'}
              </button>
              <button type="button" onClick={() => copy('link')} className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold hover:border-brand">
                {copied === 'link' ? 'Link copied ✓' : 'Copy share link'}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
