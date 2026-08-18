const soundEffects = {

  audioContext: null,
  musicPlaying: false,
  musicNodes: [],
  _kickTimeout: null,
  _arpTimeout: null,

  getContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    return this.audioContext;
  },

  playTone(frequency, duration, type = 'sine', volume = 0.3) {
    try {
      const ctx = this.getContext();
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch (e) { console.log('Sound error:', e); }
  },

  // ─── BACKGROUND MUSIC ──────────────────────────────────────────────
  // Cyber / electronic: 128 BPM, arpeggio melody, punchy kick, bassline

  startBackgroundMusic() {
  if (this.musicPlaying) return;
  try {
    const ctx = this.getContext();
    this.musicPlaying = true;
    this.musicNodes = [];

    const master = ctx.createGain();
    master.gain.setValueAtTime(0, ctx.currentTime);
    master.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 3);
    master.connect(ctx.destination);
    this.musicNodes.push(master);

    // Soft sine pads — A2, E3, A3
    [[110, 0.10], [164.8, 0.06], [220, 0.04]].forEach(([freq, vol]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      osc.connect(gain);
      gain.connect(master);
      osc.start();
      this.musicNodes.push(osc, gain);
    });

    // Slow breath swell on volume
    const breathLFO = ctx.createOscillator();
    const breathGain = ctx.createGain();
    breathLFO.frequency.setValueAtTime(0.04, ctx.currentTime);
    breathGain.gain.setValueAtTime(0.04, ctx.currentTime);
    breathLFO.connect(breathGain);
    breathGain.connect(master.gain);
    breathLFO.start();
    this.musicNodes.push(breathLFO, breathGain);

    this._startArpLoop(ctx, master);
  } catch (e) { console.log('Music start error:', e); }
},

_startKickLoop(ctx, dest) {},

_arpNotes: [329.6, 392, 440, 523.3, 659.3, 783.9],
_arpIndex: 0,

_startArpLoop(ctx, dest) {
  if (!this.musicPlaying) return;
  try {
    const note = this._arpNotes[this._arpIndex % this._arpNotes.length];
    this._arpIndex++;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(note, ctx.currentTime);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 1.6);
  } catch (e) {}
  this._arpTimeout = setTimeout(() => this._startArpLoop(ctx, dest), 1800);
},

  stopBackgroundMusic() {
    if (!this.musicPlaying) return;
    this.musicPlaying = false;
    clearTimeout(this._kickTimeout);
    clearTimeout(this._arpTimeout);

    try {
      const ctx = this.audioContext;
      if (!ctx) return;
      this.musicNodes.forEach(node => {
        try {
          if (node instanceof GainNode) {
            node.gain.cancelScheduledValues(ctx.currentTime);
            node.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
          }
        } catch (e) {}
      });
      setTimeout(() => {
        this.musicNodes.forEach(node => {
          try { node.stop?.(); } catch (e) {}
          try { node.disconnect?.(); } catch (e) {}
        });
        this.musicNodes = [];
      }, 700);
    } catch (e) {}
  },

  pauseBackgroundMusic() {
    try { if (this.audioContext) this.audioContext.suspend(); } catch (e) {}
  },

  resumeBackgroundMusic() {
    try { if (this.audioContext) this.audioContext.resume(); } catch (e) {}
  },

  // ─── SFX ──────────────────────────────────────────────────────────
  playClickSound()    { this.playTone(800,  0.08, 'square',   0.18); },
  playFlashSound()    { this.playTone(1200, 0.05, 'sine',     0.15); },
  playCountdownSound(){ this.playTone(440,  0.1,  'sine',     0.2);  },
  playWrongSound()    { this.playTone(180,  0.28, 'sawtooth', 0.22); },

  playCorrectSound() {
    setTimeout(() => this.playTone(700,  0.08, 'sine', 0.22), 0);
    setTimeout(() => this.playTone(1050, 0.12, 'sine', 0.22), 90);
  },

  playRoundWinSound() {
    setTimeout(() => this.playTone(523,  0.1, 'sine', 0.28), 0);
    setTimeout(() => this.playTone(659,  0.1, 'sine', 0.28), 110);
    setTimeout(() => this.playTone(784,  0.2, 'sine', 0.32), 220);
  },

  playRoundLoseSound() {
    setTimeout(() => this.playTone(330,  0.15, 'sawtooth', 0.2), 0);
    setTimeout(() => this.playTone(260,  0.2,  'sawtooth', 0.2), 160);
  },

  playWinSound() {
    setTimeout(() => this.playTone(523,  0.15, 'sine', 0.3),  0);
    setTimeout(() => this.playTone(659,  0.15, 'sine', 0.3),  150);
    setTimeout(() => this.playTone(784,  0.15, 'sine', 0.3),  300);
    setTimeout(() => this.playTone(1047, 0.3,  'sine', 0.4),  450);
  },

  playLoseSound() {
    setTimeout(() => this.playTone(400, 0.2, 'sawtooth', 0.3), 0);
    setTimeout(() => this.playTone(300, 0.2, 'sawtooth', 0.3), 200);
    setTimeout(() => this.playTone(200, 0.4, 'sawtooth', 0.3), 400);
  },

  playCustomLoseSound() {
    const audio = new Audio('/sounds/lose.mp3');
    audio.volume = 0.8;
    audio.play().catch(e => console.log('Audio error:', e));
  },
};

export default soundEffects;