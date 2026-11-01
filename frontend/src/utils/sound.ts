// Web Audio API emergency siren and alert sound simulator

class SoundPlayer {
  private ctx: AudioContext | null = null;
  private isSirenPlaying = false;
  private sirenInterval: any = null;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playAlertBeep() {
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, this.ctx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(1760, this.ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch (e) {
      console.warn('Audio not supported or blocked:', e);
    }
  }

  playUrgentDispatchSound() {
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      // High double beep
      [0, 0.18].forEach(delay => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1046.5, now + delay); // C6

        gain.gain.setValueAtTime(0.25, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + delay);
        osc.stop(now + delay + 0.14);
      });
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  toggleSiren(onStateChange?: (playing: boolean) => void) {
    if (this.isSirenPlaying) {
      this.stopSiren();
      if (onStateChange) onStateChange(false);
    } else {
      this.startSiren();
      if (onStateChange) onStateChange(true);
    }
  }

  startSiren() {
    if (this.isSirenPlaying) return;
    this.initCtx();
    if (!this.ctx) return;

    this.isSirenPlaying = true;
    let high = true;

    const playTone = () => {
      if (!this.isSirenPlaying || !this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      const freq = high ? 920 : 720;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.18, this.ctx.currentTime + 0.35);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.38);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.4);
      high = !high;
    };

    playTone();
    this.sirenInterval = setInterval(playTone, 420);
  }

  stopSiren() {
    this.isSirenPlaying = false;
    if (this.sirenInterval) {
      clearInterval(this.sirenInterval);
      this.sirenInterval = null;
    }
  }

  isPlaying() {
    return this.isSirenPlaying;
  }
}

export const soundManager = new SoundPlayer();
