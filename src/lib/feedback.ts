// Haptics + signature kalimba sound. No external assets.

let audioCtx: AudioContext | null = null;
function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (audioCtx) return audioCtx;
  const Ctor = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
  if (!Ctor) return null;
  audioCtx = new Ctor();
  return audioCtx;
}

const SOUND_KEY = "naighborly:sound-enabled";
export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(SOUND_KEY) !== "off";
}
export function setSoundEnabled(on: boolean) {
  localStorage.setItem(SOUND_KEY, on ? "on" : "off");
}

export function haptic(pattern: number | number[] = 18) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try { navigator.vibrate(pattern); } catch { /* noop */ }
  }
}

/** Synthesize a soft kalimba pluck at a given frequency. */
function pluck(ctx: AudioContext, when: number, freq: number, dur = 0.9, gain = 0.18) {
  // Tine: sine + subtle 2nd harmonic, with quick attack + exp decay.
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  osc1.type = "sine";
  osc2.type = "sine";
  osc1.frequency.setValueAtTime(freq, when);
  osc2.frequency.setValueAtTime(freq * 2.01, when);

  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, when);
  g.gain.exponentialRampToValueAtTime(gain, when + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, when + dur);

  const g2 = ctx.createGain();
  g2.gain.setValueAtTime(0.0001, when);
  g2.gain.exponentialRampToValueAtTime(gain * 0.35, when + 0.004);
  g2.gain.exponentialRampToValueAtTime(0.0001, when + dur * 0.6);

  // Mild lowpass for warmth
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 2400;

  osc1.connect(g).connect(lp);
  osc2.connect(g2).connect(lp);
  lp.connect(ctx.destination);

  osc1.start(when);
  osc2.start(when);
  osc1.stop(when + dur + 0.05);
  osc2.stop(when + dur + 0.05);
}

export function playKalimba(variant: "asante" | "resolved" = "asante") {
  if (!isSoundEnabled()) return;
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  const now = ctx.currentTime + 0.01;
  // Pentatonic: C5, E5, G5 — warm + resolved feel. Resolved adds a higher final note.
  const notes = variant === "resolved" ? [523.25, 659.25, 783.99, 1046.5] : [523.25, 783.99, 659.25];
  notes.forEach((f, i) => pluck(ctx, now + i * 0.11, f));
}

export function celebrateAsante() {
  haptic([12, 40, 18]);
  playKalimba("asante");
}

export function celebrateResolved() {
  haptic([20, 50, 20, 50, 30]);
  playKalimba("resolved");
}
