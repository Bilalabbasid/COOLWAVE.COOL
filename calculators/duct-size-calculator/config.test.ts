import { describe, expect, it } from 'vitest';
import config, {
  MANUAL_D_VELOCITIES,
  MAX_RESIDENTIAL_FPM,
  roundDiameterIn,
  velocityInRound,
} from './config';
import { CFM_TO_M3H, FPM_TO_MS } from '@/lib/engine/units';

describe('roundDiameterIn & velocityInRound physics', () => {
  it('computes exact diameter from CFM and FPM: D = sqrt(4 * Area / pi) * 12', () => {
    // 400 CFM at 700 FPM: Area = 400 / 700 = 0.571428 ft^2
    // D = sqrt(4 * 0.571428 / pi) * 12 = sqrt(0.727565) * 12 = 0.85297 * 12 = 10.2357 inches
    const d = roundDiameterIn(400, 700);
    expect(d).toBeCloseTo(10.2357, 3);
  });

  it('inverts roundDiameterIn with velocityInRound', () => {
    const cfm = 500;
    const fpm = 600;
    const d = roundDiameterIn(cfm, fpm);
    const v = velocityInRound(cfm, d);
    expect(v).toBeCloseTo(fpm, 8);
  });

  it('100 CFM at 600 FPM gives ~5.53 inches', () => {
    const d = roundDiameterIn(100, 600);
    expect(d).toBeCloseTo(5.53, 2);
  });
});

describe('ACCA Manual D Table 3-1 velocities', () => {
  it('reproduces recommended velocities for all 8 residential duct types', () => {
    expect(MANUAL_D_VELOCITIES['supply-trunk-rigid'].rec).toBe(700);
    expect(MANUAL_D_VELOCITIES['supply-trunk-flex'].rec).toBe(600);
    expect(MANUAL_D_VELOCITIES['supply-branch-rigid'].rec).toBe(600);
    expect(MANUAL_D_VELOCITIES['supply-branch-flex'].rec).toBe(600);
    expect(MANUAL_D_VELOCITIES['return-trunk-rigid'].rec).toBe(600);
    expect(MANUAL_D_VELOCITIES['return-trunk-flex'].rec).toBe(600);
    expect(MANUAL_D_VELOCITIES['return-branch-rigid'].rec).toBe(400);
    expect(MANUAL_D_VELOCITIES['return-branch-flex'].rec).toBe(400);
  });

  it('reproduces maximum velocities for all 8 residential duct types', () => {
    expect(MANUAL_D_VELOCITIES['supply-trunk-rigid'].max).toBe(900);
    expect(MANUAL_D_VELOCITIES['supply-trunk-flex'].max).toBe(700);
    expect(MANUAL_D_VELOCITIES['supply-branch-rigid'].max).toBe(900);
    expect(MANUAL_D_VELOCITIES['supply-branch-flex'].max).toBe(700);
    expect(MANUAL_D_VELOCITIES['return-trunk-rigid'].max).toBe(700);
    expect(MANUAL_D_VELOCITIES['return-trunk-flex'].max).toBe(700);
    expect(MANUAL_D_VELOCITIES['return-branch-rigid'].max).toBe(700);
    expect(MANUAL_D_VELOCITIES['return-branch-flex'].max).toBe(700);
  });

  it('MAX_RESIDENTIAL_FPM is 900 ft/min', () => {
    expect(MAX_RESIDENTIAL_FPM).toBe(900);
  });
});

describe('compute(), units and rounding', () => {
  it('worked example: 400 CFM supply trunk rigid metal -> 10.2 in, rounded to 11 in', () => {
    const res = config.compute(
      { airflow: 400, ductType: 'supply-trunk-rigid', rectDepth: 8 },
      'imperial'
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    expect(Number((res.values.diameter as number).toFixed(1))).toBe(10.2);
    expect(res.values.rounded).toBe(11);
    expect(Math.round(res.values.velocityRounded as number)).toBe(606);
    expect(Number((res.values.minDiameter as number).toFixed(1))).toBe(9.0);
    expect(Number((res.values.area as number).toFixed(1))).toBe(82.3);
    expect(Number((res.values.rectWidth as number).toFixed(1))).toBe(10.3);
    expect(res.status).toBe('good');
  });

  it('metric and imperial agree physically', () => {
    const cfm = 400;
    const m3h = cfm * CFM_TO_M3H;
    const imp = config.compute(
      { airflow: cfm, ductType: 'custom', velocity: 700, rectDepth: 8 },
      'imperial'
    );
    const met = config.compute(
      { airflow: m3h, ductType: 'custom', velocity: 700 * FPM_TO_MS, rectDepth: 8 * 25.4 },
      'metric'
    );
    expect(imp.ok).toBe(true);
    expect(met.ok).toBe(true);
    if (!imp.ok || !met.ok) return;

    // diameter: mm = in * 25.4
    expect(met.values.diameter as number).toBeCloseTo((imp.values.diameter as number) * 25.4, 1);
    // area: cm2 = in2 * 6.4516
    expect(met.values.area as number).toBeCloseTo((imp.values.area as number) * 6.4516, 1);
  });

  it('warns when custom velocity exceeds 900 FPM', () => {
    const res = config.compute(
      { airflow: 400, ductType: 'custom', velocity: 1200, rectDepth: 8 },
      'imperial'
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.status).toBe('warning');
    expect(res.notes?.some((n) => n.includes('highest residential duct velocity'))).toBe(true);
  });

  it('cautions when custom velocity is below 300 FPM', () => {
    const res = config.compute(
      { airflow: 400, ductType: 'custom', velocity: 250, rectDepth: 8 },
      'imperial'
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.status).toBe('caution');
  });

  it('rejects non-positive airflow or velocity', () => {
    const r1 = config.compute(
      { airflow: 0, ductType: 'custom', velocity: 700, rectDepth: 8 },
      'imperial'
    );
    expect(r1.ok).toBe(false);

    const r2 = config.compute(
      { airflow: 400, ductType: 'custom', velocity: 0, rectDepth: 8 },
      'imperial'
    );
    expect(r2.ok).toBe(false);
  });

  it('rejects unknown duct type', () => {
    const res = config.compute(
      { airflow: 400, ductType: 'invalid-type', rectDepth: 8 },
      'imperial'
    );
    expect(res.ok).toBe(false);
  });

  it('defaults compute in imperial and metric', () => {
    const rImp = config.compute(
      { airflow: 400, ductType: 'supply-trunk-rigid', velocity: 700, rectDepth: 8 },
      'imperial'
    );
    expect(rImp.ok).toBe(true);

    const rMet = config.compute(
      { airflow: 680, ductType: 'supply-trunk-rigid', velocity: 3.5, rectDepth: 200 },
      'metric'
    );
    expect(rMet.ok).toBe(true);
  });
});
