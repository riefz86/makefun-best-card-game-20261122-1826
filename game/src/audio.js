// Ember Pact — sounds, synthesized with WebAudio and nothing else: no audio
// files to ship, no network, and a mute toggle that remembers itself.

let context = null;
let muted = false;

try {
  muted = window.localStorage.getItem('ember-pact-muted') === '1';
} catch {
  muted = false;
}

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  try {
    window.localStorage.setItem('ember-pact-muted', muted ? '1' : '0');
  } catch {
    // A hosted page may refuse storage; the toggle still works in memory.
  }
  return muted;
}

function audioContext() {
  if (!context) {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return null;
    context = new Audio();
  }
  if (context.state === 'suspended') void context.resume();
  return context;
}

function tone(frequency, startAt, length, type, volume) {
  const ctx = audioContext();
  if (!ctx || muted) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime + startAt);
  gain.gain.setValueAtTime(0.0001, ctx.currentTime + startAt);
  gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + startAt + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + startAt + length);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime + startAt);
  osc.stop(ctx.currentTime + startAt + length + 0.05);
}

export function playSound(name) {
  if (muted) return;
  switch (name) {
    case 'click':
      tone(660, 0, 0.07, 'triangle', 0.12);
      break;
    case 'play':
      tone(520, 0, 0.09, 'triangle', 0.15);
      tone(780, 0.06, 0.1, 'triangle', 0.12);
      break;
    case 'damage':
      tone(160, 0, 0.16, 'sawtooth', 0.16);
      tone(110, 0.05, 0.18, 'sawtooth', 0.14);
      break;
    case 'block':
      tone(300, 0, 0.1, 'square', 0.08);
      break;
    case 'heal':
      tone(523, 0, 0.1, 'sine', 0.14);
      tone(659, 0.08, 0.1, 'sine', 0.14);
      tone(784, 0.16, 0.14, 'sine', 0.14);
      break;
    case 'draw':
      tone(880, 0, 0.06, 'sine', 0.08);
      break;
    case 'win':
      [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.13, 0.22, 'triangle', 0.16));
      break;
    case 'lose':
      [392, 330, 262, 196].forEach((f, i) => tone(f, i * 0.16, 0.24, 'sine', 0.14));
      break;
    default:
      break;
  }
}
