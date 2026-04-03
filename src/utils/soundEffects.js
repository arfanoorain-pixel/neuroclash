const soundEffects = {

  audioContext: null,

  getContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this.audioContext;
  },

  playTone(frequency, duration, type = 'sine', volume = 0.3) {
    try {
      const ctx = this.getContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (e) {
      console.log('Sound error:', e);
    }
  },

  playClickSound() {
    this.playTone(800, 0.1, 'square', 0.2);
  },

  playWinSound() {
    setTimeout(() => this.playTone(523, 0.15, 'sine', 0.3), 0);
    setTimeout(() => this.playTone(659, 0.15, 'sine', 0.3), 150);
    setTimeout(() => this.playTone(784, 0.15, 'sine', 0.3), 300);
    setTimeout(() => this.playTone(1047, 0.3, 'sine', 0.4), 450);
  },

  playLoseSound() {
    setTimeout(() => this.playTone(400, 0.2, 'sawtooth', 0.3), 0);
    setTimeout(() => this.playTone(300, 0.2, 'sawtooth', 0.3), 200);
    setTimeout(() => this.playTone(200, 0.4, 'sawtooth', 0.3), 400);
  },

  playCountdownSound() {
    this.playTone(440, 0.1, 'sine', 0.2);
  },

  playRoundWinSound() {
    setTimeout(() => this.playTone(600, 0.1, 'sine', 0.3), 0);
    setTimeout(() => this.playTone(800, 0.2, 'sine', 0.3), 100);
  },

  playRoundLoseSound() {
    setTimeout(() => this.playTone(300, 0.15, 'sawtooth', 0.2), 0);
    setTimeout(() => this.playTone(250, 0.2, 'sawtooth', 0.2), 150);
  },

  playFlashSound() {
    this.playTone(1000, 0.05, 'sine', 0.15);
  },

  playCorrectSound() {
    setTimeout(() => this.playTone(700, 0.1, 'sine', 0.25), 0);
    setTimeout(() => this.playTone(900, 0.15, 'sine', 0.25), 100);
  },

  playWrongSound() {
    this.playTone(200, 0.3, 'sawtooth', 0.25);
  },

};

export default soundEffects;