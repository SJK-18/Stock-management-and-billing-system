// Web Audio API beep sound for realistic barcode scanner response
class AudioFeedback {
  private ctx: AudioContext | null = null;

  playBeep(frequency = 1800, duration = 0.08, type: OscillatorType = "sine") {
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (!this.ctx) return;
      if (this.ctx.state === "suspended") {
        this.ctx.resume();
      }

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // Audio context might be restricted before user gesture, fail silently
    }
  }

  playError() {
    this.playBeep(300, 0.2, "sawtooth");
  }

  playSuccess() {
    this.playBeep(1950, 0.09, "sine");
  }
}

export const soundManager = new AudioFeedback();

/**
 * Generate a deterministic pseudo Code-128 pattern for an SVG barcode.
 * Generates alternating black and white bars with standard guard patterns.
 */
export function generateBarcodeBars(code: string): { width: number; isBlack: boolean }[] {
  const bars: { width: number; isBlack: boolean }[] = [];
  
  // Start guard
  bars.push({ width: 2, isBlack: true });
  bars.push({ width: 1, isBlack: false });
  bars.push({ width: 2, isBlack: true });
  bars.push({ width: 1, isBlack: false });

  // Generate bars based on ASCII char codes
  for (let i = 0; i < code.length; i++) {
    const charCode = code.charCodeAt(i);
    const bits = [
      (charCode >> 0) & 1,
      (charCode >> 1) & 1,
      (charCode >> 2) & 1,
      (charCode >> 3) & 1,
      (charCode >> 4) & 1,
      (charCode >> 5) & 1,
    ];

    for (let b = 0; b < bits.length; b++) {
      const isBlack = (i + b) % 2 === 0;
      const width = bits[b] ? 2.5 : 1.2;
      bars.push({ width, isBlack });
    }
  }

  // End guard
  bars.push({ width: 2, isBlack: true });
  bars.push({ width: 1, isBlack: false });
  bars.push({ width: 3, isBlack: true });

  return bars;
}

/**
 * Helper to generate a new random standard EAN/UPC-style 12-digit barcode
 */
export function generateRandomBarcode(prefix = "890"): string {
  let result = prefix;
  while (result.length < 12) {
    result += Math.floor(Math.random() * 10).toString();
  }
  return result;
}
