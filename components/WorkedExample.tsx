import { CALCULATOR_LOADERS } from '@/calculators/_loaders.generated';
import { formatOutput } from '@/lib/engine/format';
import { unitLabel } from '@/lib/engine/units';
import { bySystem, type InputValues, type UnitSystem } from '@/lib/engine/types';
import { defaultValues } from '@/lib/engine/values';

/**
 * Renders a worked example by running the calculator's own compute() at build time,
 * so the numbers on the page always match what the tool shows.
 */
export async function WorkedExample({
  slug,
  inputs,
  system = 'imperial',
  title = 'Worked example',
}: {
  slug: string;
  inputs: InputValues;
  system?: UnitSystem;
  title?: string;
}) {
  const loader = CALCULATOR_LOADERS[slug];
  if (!loader) throw new Error(`WorkedExample: unknown calculator "${slug}"`);
  const config = (await loader()).default;
  const values = { ...defaultValues(config, system), ...inputs };
  const result = config.compute(values, system);
  if (!result.ok) throw new Error(`WorkedExample for ${slug} produced an error: ${result.error}`);

  const shownInputs = config.inputs.filter((i) => i.id in inputs);
  return (
    <figure className="not-prose my-6 overflow-hidden rounded-xl border border-border bg-surface">
      <figcaption className="border-b border-border bg-surface-2 px-4 py-2 text-sm font-semibold">{title}</figcaption>
      <div className="grid gap-0 sm:grid-cols-2">
        <dl className="space-y-1 p-4 text-sm">
          <dt className="mb-1 font-semibold text-muted">Inputs</dt>
          {shownInputs.map((i) => {
            const v = values[i.id];
            let text = String(v);
            if (i.type === 'select') text = i.options.find((o) => o.value === v)?.label ?? text;
            if (i.type === 'toggle') text = v ? 'Yes' : 'No';
            if (i.type === 'number') {
              const u = i.unit ? unitLabel(i.unit, system) : i.unitLabel ? bySystem(i.unitLabel, system) : '';
              text = `${Number(v).toLocaleString('en-US')}${u ? ` ${u}` : ''}`;
            }
            return (
              <dd key={i.id} className="flex justify-between gap-4">
                <span className="text-muted">{i.label}</span>
                <span className="text-right font-medium">{text}</span>
              </dd>
            );
          })}
        </dl>
        <dl className="space-y-1 border-t border-border p-4 text-sm sm:border-l sm:border-t-0">
          <dt className="mb-1 font-semibold text-muted">Result</dt>
          {config.outputs.map((o) => {
            const f = formatOutput(o, result.values[o.id], system, values);
            if (f.value === '—') return null;
            return (
              <dd key={o.id} className="flex justify-between gap-4">
                <span className="text-muted">{o.label}</span>
                <span className={`text-right ${o.primary ? 'font-bold text-brand' : 'font-medium'}`}>
                  {f.value}
                  {f.unit ? ` ${f.unit}` : ''}
                </span>
              </dd>
            );
          })}
        </dl>
      </div>
    </figure>
  );
}
