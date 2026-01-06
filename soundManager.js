// Sound Manager - handles all audio synthesis and playback

class SoundManager {
  constructor() {
    this.synths = {};
    this.isInitialized = false;
  }

  initialize() {
    // Initialize synthesizers
    this.synths.circle = new p5.Oscillator('sine');
    this.synths.circle.amp(0);
    this.synths.circle.start();

    this.synths.lineH = new p5.Oscillator('triangle');
    this.synths.lineH.amp(0);
    this.synths.lineH.start();

    this.synths.lineV = new p5.Oscillator('triangle');
    this.synths.lineV.amp(0);
    this.synths.lineV.start();

    this.synths.speed = new p5.Oscillator('square');
    this.synths.speed.amp(0);
    this.synths.speed.start();

    this.synths.drop = new p5.Oscillator('sine');
    this.synths.drop.amp(0);
    this.synths.drop.start();

    this.synths.angry = new p5.Oscillator('sawtooth');
    this.synths.angry.amp(0);
    this.synths.angry.start();

    this.isInitialized = true;
  }

  ensureAudioContext() {
    // Resume audio context on first interaction (fixes browser audio policy)
    if (getAudioContext().state !== 'running') {
      getAudioContext().resume();
    }
  }

  playSound(synthName, freq, duration = 0.1, volume = SOUND_VOLUME) {
    if (!this.isInitialized) return;

    const synth = this.synths[synthName];
    if (!synth) return;

    synth.freq(freq);
    synth.amp(volume, SOUND_ATTACK_TIME);
    setTimeout(() => {
      synth.amp(0, SOUND_RELEASE_TIME);
    }, duration * 1000);
  }

  playCircleSound() {
    this.playSound('circle', random(400, 800), 0.15);
  }

  playLineHSound() {
    this.playSound('lineH', random(100, 200), 0.2);
  }

  playLineVSound() {
    this.playSound('lineV', random(200, 400), 0.2);
  }

  playSpeedSound(avgSpeed) {
    // Map average speed to frequency (100-2000 Hz)
    let speedFreq = map(avgSpeed, 0, 50, 100, 2000, true);
    this.playSound('speed', speedFreq, 0.05);
  }

  playDropSound(xPosition) {
    let dropFreq = map(xPosition, 0, width, 100, 300);
    this.playSound('drop', dropFreq, 0.3);
  }

  playErrorSound() {
    let baseFreq = 300; // Mid-range, neutral tone

    // Create a gentle two-note pulse
    this.synths.angry.freq(baseFreq);
    this.synths.angry.amp(0.25, 0.02);

    // Second pulse slightly lower
    setTimeout(() => {
      this.synths.angry.freq(baseFreq * 0.9);
    }, 100);

    // Fade out
    setTimeout(() => {
      this.synths.angry.amp(0, 0.1);
    }, 200);
  }
}
