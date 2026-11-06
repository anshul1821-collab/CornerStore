/**
 * Kirana Shop Ambience & Sound Effects Engine
 * Pure Web Audio API: Zero external network latency, zero download failures, 100% reliable.
 * - Soft kirana shop room tone
 * - Welcoming brass door chime when customer arrives
 * - Gentle coin / cash transaction chimes
 */

class AmbienceEngine {
  private ctx: AudioContext | null = null;
  private ambienceGain: GainNode | null = null;
  private isAmbiencePlaying: boolean = false;
  private isMuted: boolean = false;
  private masterAmbienceVolume: number = 0.035; // Very quiet background presence

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    try {
      this.ctx ??= new (
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      )();
      if (this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (muted) {
      this.stopAmbience();
    }
  }

  /**
   * Play a pleasant brass door chime when a customer enters the shop
   */
  public playDoorChime(): void {
    if (this.isMuted) return;
    const ac = this.getContext();
    if (!ac) return;

    try {
      const now = ac.currentTime;
      // High-pitched brass shop bell dual harmonic (E6 = ~1318Hz, A6 = ~1760Hz)
      const freqs = [1318.5, 1760.0];

      freqs.forEach((f, i) => {
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        const delay = i * 0.08;

        osc.type = "sine";
        osc.frequency.setValueAtTime(f, now + delay);

        // Exponential decay of a resonant bell
        gain.gain.setValueAtTime(0.0001, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.12, now + delay + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.85);

        osc.connect(gain);
        gain.connect(ac.destination);

        osc.start(now + delay);
        osc.stop(now + delay + 0.9);
      });
    } catch {
      // Audio unavailable
    }
  }

  /**
   * Play a subtle metallic coin clink on money drop / transaction
   */
  public playCoinChime(): void {
    if (this.isMuted) return;
    const ac = this.getContext();
    if (!ac) return;

    try {
      const now = ac.currentTime;
      const osc = ac.createOscillator();
      const gain = ac.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(2489, now); // D#7
      osc.frequency.exponentialRampToValueAtTime(1864, now + 0.12);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.1, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

      osc.connect(gain);
      gain.connect(ac.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch {
      // Ignored: audio context interrupted
    }
  }

  /**
   * Start very soft, subtle shop room tone
   */
  public startAmbience(): void {
    if (this.isMuted || this.isAmbiencePlaying) return;
    const ac = this.getContext();
    if (!ac) return;

    try {
      // Create subtle brown-noise room atmosphere
      const bufferSize = ac.sampleRate * 2;
      const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0.0;

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i]!;
        data[i]! *= 3.5;
      }

      const noise = ac.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      // Filter to warm gentle low-mids (like a quiet indoor room)
      const filter = ac.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 380;

      const gain = ac.createGain();
      gain.gain.setValueAtTime(0.0001, ac.currentTime);
      gain.gain.linearRampToValueAtTime(this.masterAmbienceVolume, ac.currentTime + 1.5);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ac.destination);

      noise.start();
      this.ambienceGain = gain;
      this.isAmbiencePlaying = true;
    } catch {
      this.isAmbiencePlaying = false;
    }
  }

  public stopAmbience(): void {
    if (!this.isAmbiencePlaying || !this.ambienceGain || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      this.ambienceGain.gain.setValueAtTime(this.ambienceGain.gain.value, now);
      this.ambienceGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
      setTimeout(() => {
        this.ambienceGain?.disconnect();
        this.ambienceGain = null;
        this.isAmbiencePlaying = false;
      }, 700);
    } catch {
      this.isAmbiencePlaying = false;
    }
  }

  public setAmbienceVolume(vol: number): void {
    this.masterAmbienceVolume = Math.max(0, Math.min(0.2, vol));
    if (this.ambienceGain && this.ctx) {
      this.ambienceGain.gain.setValueAtTime(this.masterAmbienceVolume, this.ctx.currentTime);
    }
  }
}

export const ambienceEngine = new AmbienceEngine();
