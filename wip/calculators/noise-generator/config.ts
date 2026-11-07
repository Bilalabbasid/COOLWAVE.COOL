import type { CalculatorConfig } from '@/lib/engine/types';
import { slopePerDecade, slopePerOctave, type NoiseColor } from './noise';

const COLORS: Record<NoiseColor, { label: string; character: string }> = {
  white: { label: 'White noise', character: 'Equal power at every frequency: bright and hissy, like steady static.' },
  pink: { label: 'Pink noise', character: 'Equal power in every octave: softer and fuller, like steady rain.' },
  brown: { label: 'Brown noise', character: 'Power falls steeply with frequency: deep and rumbling, like a distant waterfall.' },
};

const config: CalculatorConfig = {
  slug: 'noise-generator',
  title: 'White Noise Generator',
  h1: 'White Noise Generator (White, Pink and Brown Noise)',
  metaTitle: 'White Noise Generator: Pink & Brown Noise | CoolWave',
  metaDescription:
    'Free white noise generator with pink and brown noise, a volume control and a sleep timer that fades out gently. Runs in your browser, no app or sign-up.',
  category: 'sound-waves',
  shortDescription: 'Play white, pink or brown noise in your browser, with a volume control and a sleep timer that fades out gently.',
  primaryKeyword: 'white noise generator',
  secondaryKeywords: ['white noise maker', 'brown noise', 'pink noise', 'white noise player', 'noise generator'],
  widget: 'noise-generator',
  inputs: [
    {
      id: 'color',
      label: 'Noise colour',
      type: 'select',
      options: (Object.keys(COLORS) as NoiseColor[]).map((c) => ({ value: c, label: COLORS[c].label })),
      default: 'pink',
    },
  ],
  outputs: [
    { id: 'octave', label: 'Power change per octave', unitLabel: 'dB', decimals: 1, primary: true },
    { id: 'decade', label: 'Power change per decade (×10 in frequency)', unitLabel: 'dB', decimals: 0 },
    { id: 'character', label: 'How it sounds', format: 'text' },
  ],
  compute(inputs) {
    const color = String(inputs.color) as NoiseColor;
    if (!(color in COLORS)) return { ok: false, error: 'Choose white, pink or brown noise.' };
    const octave = slopePerOctave(color);
    return {
      ok: true,
      values: { octave: Object.is(octave, -0) ? 0 : octave, decade: slopePerDecade(color) || 0, character: COLORS[color].character },
      status: 'info',
      summary:
        color === 'white'
          ? 'Every frequency band of equal width carries the same power, so the high frequencies dominate what you hear.'
          : `Each time the frequency doubles, the power drops by about ${Math.abs(octave).toFixed(0)} dB.`,
    };
  },
  assumptions: [
    'White noise is made from independent uniform random samples.',
    'Pink noise uses Paul Kellet’s refined pink filter (−3 dB per octave, accurate to ±0.05 dB above 9.2 Hz at a 44.1 kHz sample rate). At 48 kHz the filter’s corner frequencies shift by about 9%, which is inaudible.',
    'Brown noise is leaky-integrated white noise (pole 0.998), giving −6 dB per octave above about 15 Hz.',
    'Each colour is generated once as a six-second stereo loop with a cross-faded seam, then normalised to the same RMS level so switching colour does not jump in loudness.',
    'The sleep timer fades out over the last 60 seconds, scheduled on the audio clock, then stops playback.',
    'The volume slider sets your device’s output level, not a sound level in dB. The actual loudness depends on your speakers or headphones.',
  ],
  sources: [
    { title: '“1/f noise” in music and speech (Nature 258, 317–318, 1975)', publisher: 'R. F. Voss and J. Clarke, Nature', url: 'https://www.nature.com/articles/258317a0' },
    { title: 'Pink noise filter (Paul Kellet’s refined method, with pink.txt)', publisher: 'musicdsp.org', url: 'https://www.musicdsp.org/en/latest/Filters/76-pink-noise-filter.html' },
    { title: 'Noise as a sleep aid: A systematic review (Sleep Med Rev 2021;55:101385)', publisher: 'Riedy, Smith, Rocha and Basner, via PubMed', url: 'https://pubmed.ncbi.nlm.nih.gov/33007706/' },
    { title: 'Infant sleep machines and hazardous sound pressure levels (Pediatrics 2014;133:677–681)', publisher: 'Hugh et al., via PubMed', url: 'https://pubmed.ncbi.nlm.nih.gov/24590753/' },
    { title: 'Noise-Induced Hearing Loss', publisher: 'National Institute on Deafness and Other Communication Disorders (NIDCD)', url: 'https://www.nidcd.nih.gov/health/noise-induced-hearing-loss' },
    { title: 'Web Audio API (AudioBuffer, AudioBufferSourceNode, GainNode)', publisher: 'W3C', url: 'https://www.w3.org/TR/webaudio/' },
  ],
  relatedCalculators: ['tone-generator', 'decibel-meter', 'wavelength-calculator'],
  relatedPosts: [],
  disclaimer:
    'This is a sound player, not a medical device or sleep treatment. Keep the volume low, especially for babies and young children, and place speakers away from the bed or cot. If you have ongoing trouble sleeping or ringing in your ears, talk to a doctor.',
  reviewedAgainst: 'Paul Kellet’s published pink-noise filter coefficients and the 1/f^γ definitions of white, pink and brown noise (Voss & Clarke 1975)',
  updated: '2026-11-08',
  affiliate: ['sound-machine'],
};

export default config;
