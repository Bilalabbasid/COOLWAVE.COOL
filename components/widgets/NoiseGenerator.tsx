'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CalculatorShell } from '@/lib/engine/types';
import {
  formatCountdown,
  generateLoop,
  type NoiseColor,
  SLEEP_TIMER_MINUTES,
  sleepTimerPlan,
  sliderToGain,
  slopePerOctave,
} from '@/calculators/noise-generator/noise';

const COLORS: { id: NoiseColor; name: string; subtitle: string; desc: string }[] = [
  { id: 'white', name: 'White', subtitle: 'Bright static', desc: 'Equal power at every frequency, like a steady radio hiss or fan.' },
  { id: 'pink', name: 'Pink', subtitle: 'Steady rain', desc: 'Equal energy per octave (−3 dB/octave). Softer and more natural, like rainfall.' },
  { id: 'brown', name: 'Brown', subtitle: 'Deep rumble', desc: 'Steep low-frequency emphasis (−6 dB/octave), like a waterfall or distant thunder.' },
];

export default function NoiseGenerator({ shell }: { shell: CalculatorShell }) {
  const [playing, setPlaying] = useState(false);
  const [color, setColor] = useState<NoiseColor>('pink');
  const [volume, setVolume] = useState(50);
  const [timerMinutes, setTimerMinutes] = useState<number>(0);
  const [remainingSec, setRemainingSec] = useState<number | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const endWallTimeRef = useRef<number | null>(null);

  const stopAudio = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (sourceRef.current) {
      try {
        sourceRef.current.onended = null;
        sourceRef.current.stop();
        sourceRef.current.disconnect();
      } catch {
        // already stopped
      }
      sourceRef.current = null;
    }
    if (gainRef.current) {
      gainRef.current.disconnect();
      gainRef.current = null;
    }
    setPlaying(false);
    setRemainingSec(null);
    endWallTimeRef.current = null;
  }, []);

  const startAudio = useCallback(
    async (selectedColor: NoiseColor, vol: number, timerMins: number) => {
      stopAudio();

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) {
        alert('Web Audio API is not supported in this browser.');
        return;
      }

      let ctx = audioCtxRef.current;
      if (!ctx || ctx.state === 'closed') {
        ctx = new AudioCtx();
        audioCtxRef.current = ctx;
      }
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      // Generate 5 seconds of seamless loopable stereo noise at the context's sample rate
      const sampleRate = ctx.sampleRate;
      const length = sampleRate * 5;
      const left = generateLoop(selectedColor, length, Math.random);
      const right = generateLoop(selectedColor, length, Math.random);

      const buffer = ctx.createBuffer(2, length, sampleRate);
      buffer.getChannelData(0).set(left);
      buffer.getChannelData(1).set(right);

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const gain = ctx.createGain();
      const currentGain = sliderToGain(vol);
      gain.gain.setValueAtTime(currentGain, ctx.currentTime);

      source.connect(gain);
      gain.connect(ctx.destination);

      sourceRef.current = source;
      gainRef.current = gain;

      // Handle sleep timer if enabled
      if (timerMins > 0) {
        const plan = sleepTimerPlan(ctx.currentTime, timerMins);
        if (plan) {
          gain.gain.setValueAtTime(currentGain, plan.fadeStart);
          gain.gain.linearRampToValueAtTime(0.0001, plan.end);
          source.stop(plan.end);

          endWallTimeRef.current = Date.now() + timerMins * 60 * 1000;
          setRemainingSec(timerMins * 60);

          intervalRef.current = setInterval(() => {
            if (endWallTimeRef.current) {
              const diff = Math.max(0, Math.round((endWallTimeRef.current - Date.now()) / 1000));
              setRemainingSec(diff);
              if (diff <= 0) {
                stopAudio();
              }
            }
          }, 1000);
        }
      }

      source.onended = () => {
        stopAudio();
      };

      source.start();
      setPlaying(true);
    },
    [stopAudio]
  );

  const togglePlay = () => {
    if (playing) {
      stopAudio();
    } else {
      void startAudio(color, volume, timerMinutes);
    }
  };

  const handleColorChange = (newColor: NoiseColor) => {
    setColor(newColor);
    if (playing) {
      void startAudio(newColor, volume, timerMinutes);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (gainRef.current && audioCtxRef.current) {
      const g = sliderToGain(newVol);
      gainRef.current.gain.cancelScheduledValues(audioCtxRef.current.currentTime);
      gainRef.current.gain.setValueAtTime(g, audioCtxRef.current.currentTime);
    }
  };

  const handleTimerChange = (mins: number) => {
    setTimerMinutes(mins);
    if (playing) {
      void startAudio(color, volume, mins);
    }
  };

  useEffect(() => {
    return () => {
      stopAudio();
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        void audioCtxRef.current.close();
      }
    };
  }, [stopAudio]);

  const activeColorInfo = COLORS.find((c) => c.id === color) ?? COLORS[1];
  const octaveSlope = slopePerOctave(color);

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 sm:p-7 shadow-sm">
      <div className="flex flex-col gap-6">
        {/* Header / Current sound indicator */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <span className="text-xs font-semibold tracking-wider text-muted uppercase">Active sound</span>
            <h2 className="text-xl font-bold text-text">{activeColorInfo.name} Noise</h2>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-block h-3 w-3 rounded-full ${
                playing ? 'bg-good animate-pulse' : 'bg-muted/40'
              }`}
              aria-hidden="true"
            />
            <span className="text-sm font-medium text-muted">
              {playing ? (remainingSec !== null ? `Playing (ends in ${formatCountdown(remainingSec)})` : 'Playing') : 'Stopped'}
            </span>
          </div>
        </div>

        {/* Color picker tabs */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-text">Choose sound type</label>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {COLORS.map((c) => {
              const selected = color === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleColorChange(c.id)}
                  className={`flex flex-col items-start rounded-xl border p-3.5 text-left transition-all ${
                    selected
                      ? 'border-brand bg-brand/10 text-brand ring-2 ring-brand/20'
                      : 'border-border bg-surface hover:border-brand/40 text-text'
                  }`}
                >
                  <span className="text-base font-bold">{c.name} Noise</span>
                  <span className="text-xs text-muted mt-0.5">{c.subtitle}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-muted">{activeColorInfo.desc}</p>
        </div>

        {/* Big Play / Stop Button */}
        <div className="flex flex-col items-center justify-center py-2 sm:py-4">
          <button
            type="button"
            onClick={togglePlay}
            className={`group relative flex h-20 w-full sm:w-64 items-center justify-center gap-3 rounded-2xl text-lg font-bold shadow-md transition-all active:scale-98 ${
              playing
                ? 'bg-danger text-white hover:bg-danger/90'
                : 'bg-brand text-white hover:bg-brand/90'
            }`}
          >
            {playing ? (
              <>
                <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
                <span>Stop Noise</span>
              </>
            ) : (
              <>
                <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span>Play {activeColorInfo.name} Noise</span>
              </>
            )}
          </button>
        </div>

        {/* Volume slider */}
        <div className="rounded-xl border border-border bg-surface-2 p-4">
          <div className="flex items-center justify-between text-sm font-semibold text-text mb-2">
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                />
              </svg>
              Volume
            </span>
            <span className="tabular-nums font-mono text-muted">{volume}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={volume}
            onChange={(e) => handleVolumeChange(Number(e.target.value))}
            className="w-full accent-brand cursor-pointer"
            aria-label="Volume slider"
          />
        </div>

        {/* Sleep timer pills */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-text">Sleep Timer (fades out gently)</label>
            {remainingSec !== null && (
              <span className="text-xs font-mono font-medium text-brand">
                {formatCountdown(remainingSec)} left
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {SLEEP_TIMER_MINUTES.map((mins) => {
              const active = timerMinutes === mins;
              return (
                <button
                  key={mins}
                  type="button"
                  onClick={() => handleTimerChange(mins)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? 'border-brand bg-brand text-white'
                      : 'border-border bg-surface text-text hover:border-brand/40'
                  }`}
                >
                  {mins === 0 ? 'No timer' : `${mins} min`}
                </button>
              );
            })}
          </div>
        </div>

        {/* Acoustic slope data card */}
        <div className="grid grid-cols-2 gap-3 pt-2 text-xs text-muted border-t border-border">
          <div>
            <span className="font-semibold text-text">Spectral slope:</span>{' '}
            {octaveSlope === 0 ? 'Flat (0 dB/octave)' : `${octaveSlope.toFixed(1)} dB per octave`}
          </div>
          <div>
            <span className="font-semibold text-text">Audio engine:</span> Pure Web Audio API (stereo loop)
          </div>
        </div>
      </div>
    </div>
  );
}
