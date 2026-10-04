/**
 * KawaiiAgent - Custom Web Component for Agentic Architectures
 * 
 * Embeds morphing fluid dots with distinct geometrical shapes (Circle, Square, Triangle, Diamond, Hexagon)
 * and a crisp foreground kawaii face.
 * Supports agent states, persona theming, cursor tracking, and real-time audio lip-sync with AUDIBLE SOUND.
 */

const SVG_FILTER_ID = 'fluid-goo';

const PERSONA_SHAPES = {
  mochi: 'circle',
  byte: 'square',
  sage: 'triangle',
  nova: 'diamond',
  echo: 'hexagon'
};

const PERSONA_PHRASES = {
  mochi: "Hello! I am Mochi, your assistant. I am ready to help!",
  byte: "Hello world! Byte here, ready to generate and test code!",
  sage: "Greetings! I am Sage. Querying documents and retrieving insights!",
  nova: "Strategy ready! I am Nova, coordinating our architecture.",
  echo: "Quality audit passed! Echo checking all test suites."
};

const PERSONA_VOICE_PROFILES = {
  mochi: { baseFreq: 580, range: [540, 620, 700, 780], type: 'triangle', speechPitch: 1.45 },
  byte:  { baseFreq: 440, range: [400, 480, 560, 640], type: 'sawtooth', speechPitch: 1.35 },
  sage:  { baseFreq: 340, range: [300, 360, 420, 480], type: 'triangle', speechPitch: 1.25 },
  nova:  { baseFreq: 640, range: [600, 680, 760, 840], type: 'sine',     speechPitch: 1.50 },
  echo:  { baseFreq: 480, range: [440, 520, 600, 680], type: 'triangle', speechPitch: 1.30 }
};

/**
 * Web Audio Sound Synthesizer for Kawaii Agents
 */
class KawaiiAudio {
  static getContext() {
    if (!this._ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this._ctx = new AudioCtx();
      }
    }
    if (this._ctx && this._ctx.state === 'suspended') {
      this._ctx.resume().catch(() => {});
    }
    return this._ctx;
  }

  /**
   * Plays a sweet, expressive vocal syllable tone
   */
  static playChirp(freq = 560, duration = 0.08, type = 'triangle', volume = 0.16) {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      // Expressive upward pitch inflection
      osc.frequency.exponentialRampToValueAtTime(freq * 1.14, ctx.currentTime + duration * 0.7);

      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  }

  /**
   * Plays a sparkling ascending celebration fanfare (C5, E5, G5, C6)
   */
  static playFanfare() {
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playChirp(freq, 0.24, 'sine', 0.18);
      }, idx * 80);
    });
  }
}

/**
 * Ensures the SVG gooey blend filter is present in the DOM.
 */
function ensureGooFilter() {
  if (document.getElementById(SVG_FILTER_ID)) return;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.id = 'kawaii-filter-container';
  svg.setAttribute('aria-hidden', 'true');
  svg.style.position = 'absolute';
  svg.style.width = '0';
  svg.style.height = '0';
  svg.style.overflow = 'hidden';
  svg.style.pointerEvents = 'none';

  svg.innerHTML = `
    <defs>
      <filter id="${SVG_FILTER_ID}" color-interpolation-filters="sRGB">
        <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur" />
        <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="goo" />
      </filter>
    </defs>
  `;

  document.body ? document.body.appendChild(svg) : document.addEventListener('DOMContentLoaded', () => document.body.appendChild(svg));
}

class KawaiiAgent extends HTMLElement {
  static get observedAttributes() {
    return ['persona', 'state', 'shape', 'size', 'track-mouse', 'badge'];
  }

  constructor() {
    super();
    this._state = 'idle';
    this._persona = 'mochi';
    this._shape = null; // null = derive from persona
    this._size = 240;
    this._badge = '';
    this._trackMouse = false;
    this._audioContext = null;
    this._analyser = null;
    this._micStream = null;
    this._animFrameId = null;

    this._onMouseMove = this._onMouseMove.bind(this);
  }

  connectedCallback() {
    ensureGooFilter();
    this.render();
    this.applyAttributes();

    if (this.hasAttribute('track-mouse')) {
      this.enableMouseTracking(true);
    }
  }

  disconnectedCallback() {
    this.enableMouseTracking(false);
    this.stopAudioReactivity();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    if (name === 'persona') {
      this.persona = newValue;
    } else if (name === 'shape') {
      this.shape = newValue;
    } else if (name === 'state') {
      this.state = newValue;
    } else if (name === 'size') {
      this.size = newValue;
    } else if (name === 'badge') {
      this.badge = newValue;
    } else if (name === 'track-mouse') {
      this.enableMouseTracking(this.hasAttribute('track-mouse') && newValue !== 'false');
    }
  }

  get state() { return this._state; }
  set state(val) {
    this._state = val || 'idle';
    const container = this.querySelector('.kawaii-character');
    if (container) {
      container.setAttribute('data-state', this._state);
    }
  }

  get persona() { return this._persona; }
  set persona(val) {
    this._persona = val || 'mochi';
    const container = this.querySelector('.kawaii-character');
    if (container) {
      container.setAttribute('data-persona', this._persona);
      if (!this._shape) {
        container.setAttribute('data-shape', this.effectiveShape);
      }
    }
  }

  get effectiveShape() {
    return this._shape || PERSONA_SHAPES[this._persona] || 'circle';
  }

  get shape() { return this.effectiveShape; }
  set shape(val) {
    this._shape = val || null;
    const container = this.querySelector('.kawaii-character');
    if (container) {
      container.setAttribute('data-shape', this.effectiveShape);
    }
  }

  get size() { return this._size; }
  set size(val) {
    this._size = typeof val === 'number' ? `${val}px` : val;
    this.style.setProperty('--kawaii-size', this._size);
  }

  get badge() { return this._badge; }
  set badge(val) {
    this._badge = val;
    const badgeEl = this.querySelector('.kawaii-badge');
    const container = this.querySelector('.kawaii-character');
    if (badgeEl && container) {
      badgeEl.textContent = val || '';
      container.setAttribute('data-show-badge', val ? 'true' : 'false');
    }
  }

  applyAttributes() {
    this.persona = this.getAttribute('persona') || 'mochi';
    if (this.hasAttribute('shape')) {
      this.shape = this.getAttribute('shape');
    }
    this.state = this.getAttribute('state') || 'idle';
    this.size = this.getAttribute('size') || '240px';
    this.badge = this.getAttribute('badge') || '';
  }

  render() {
    const shape = this.effectiveShape;
    this.innerHTML = `
      <div class="kawaii-character" data-state="${this._state}" data-persona="${this._persona}" data-shape="${shape}" data-show-badge="${this._badge ? 'true' : 'false'}">
        <!-- Optional status badge -->
        <div class="kawaii-badge">${this._badge}</div>

        <!-- Layer 1: The Morphing Gooey Geometrical Background -->
        <div class="goo-container">
          <div class="blob blob-1"></div>
          <div class="blob blob-2"></div>
          <div class="blob blob-3"></div>
          <div class="blob blob-4"></div>
        </div>

        <!-- Layer 2: The Kawaii Face (Sits safely on top, untouched by the filter) -->
        <div class="kawaii-face">
          <div class="eyes">
            <div class="eye left"></div>
            <div class="eye right"></div>
          </div>
          <div class="blush">
            <div class="cheek left-cheek"></div>
            <div class="cheek right-cheek"></div>
          </div>
          <div class="mouth"></div>
        </div>
      </div>
    `;
  }

  /**
   * Sets mouth open/scale directly from an audio volume factor (0.0 to 1.0).
   */
  setAudioLevel(volume) {
    const clamped = Math.max(0, Math.min(1, volume));
    const scale = 0.8 + clamped * 1.8;
    this.style.setProperty('--kawaii-mouth-scale', scale.toFixed(2));
  }

  /**
   * Directs the eyes and face toward specific client coordinate points.
   */
  lookAt(clientX, clientY) {
    const faceEl = this.querySelector('.kawaii-face');
    if (!faceEl) return;

    const rect = faceEl.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    const distance = Math.hypot(deltaX, deltaY);
    const maxRadius = 7;

    const factor = Math.min(maxRadius, distance / 25);
    const angle = Math.atan2(deltaY, deltaX);

    const lookX = (Math.cos(angle) * factor).toFixed(2);
    const lookY = (Math.sin(angle) * factor).toFixed(2);

    this.style.setProperty('--kawaii-look-x', `${lookX}px`);
    this.style.setProperty('--kawaii-look-y', `${lookY}px`);
  }

  _onMouseMove(event) {
    this.lookAt(event.clientX, event.clientY);
  }

  /**
   * Enables or disables mouse cursor tracking.
   */
  enableMouseTracking(enable) {
    this._trackMouse = enable;
    if (enable) {
      window.addEventListener('mousemove', this._onMouseMove, { passive: true });
    } else {
      window.removeEventListener('mousemove', this._onMouseMove);
      this.style.setProperty('--kawaii-look-x', '0px');
      this.style.setProperty('--kawaii-look-y', '0px');
    }
  }

  /**
   * Connects to user's microphone for real-time sound reactivity.
   */
  async startMicReactivity() {
    try {
      this.stopAudioReactivity();
      this._audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this._micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      
      const source = this._audioContext.createMediaStreamSource(this._micStream);
      this._analyser = this._audioContext.createAnalyser();
      this._analyser.fftSize = 256;
      this._analyser.smoothingTimeConstant = 0.5;
      source.connect(this._analyser);

      const bufferLength = this._analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const processAudio = () => {
        if (!this._analyser) return;
        this._analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        const voiceBins = Math.min(bufferLength, 32);
        for (let i = 2; i < voiceBins; i++) {
          sum += dataArray[i];
        }
        const avg = sum / (voiceBins - 2);
        const normalized = Math.min(1, avg / 110);

        if (normalized > 0.12) {
          this.state = 'speaking';
          this.setAudioLevel(normalized);
        } else {
          if (this.state === 'speaking') {
            this.state = 'listening';
            this.setAudioLevel(0.1);
          }
        }

        this._animFrameId = requestAnimationFrame(processAudio);
      };

      processAudio();
      return true;
    } catch (err) {
      console.warn('Microphone access not available or denied:', err);
      return false;
    }
  }

  /**
   * Stops real-time audio reactivity.
   */
  stopAudioReactivity() {
    if (this._animFrameId) {
      cancelAnimationFrame(this._animFrameId);
      this._animFrameId = null;
    }
    if (this._micStream) {
      this._micStream.getTracks().forEach(t => t.stop());
      this._micStream = null;
    }
    if (this._audioContext && this._audioContext.state !== 'closed') {
      this._audioContext.close();
      this._audioContext = null;
    }
    this.setAudioLevel(0);
  }

  /**
   * Speaks audible sound with synchronized kawaii mouth lip-sync.
   * Uses Web Speech API (with cute pitch) + Web Audio procedural vocal syllable chirps.
   * 
   * @param {string} [text] - Text to speak. If omitted, uses persona signature phrase.
   * @param {Function} [onComplete] - Callback executed when speech finishes.
   */
  speak(text, onComplete) {
    const utteranceText = text || PERSONA_PHRASES[this._persona] || "Hello! Ready to assist you!";
    const voiceProfile = PERSONA_VOICE_PROFILES[this._persona] || PERSONA_VOICE_PROFILES.mochi;

    const prevState = this.state;
    this.state = 'speaking';

    KawaiiAudio.getContext();

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      this.setAudioLevel(0);
      this.state = prevState === 'speaking' ? 'idle' : prevState;
      if (typeof onComplete === 'function') onComplete();
    };

    let mouthInterval = null;

    // Check for Web Speech API
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(utteranceText);
        utterance.pitch = voiceProfile.speechPitch;
        utterance.rate = 1.1;

        // Try to pick natural high/female voice for kawaii sound
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          const match = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Zira') || v.name.includes('Samantha') || v.name.includes('Google US English')));
          if (match) utterance.voice = match;
        }

        utterance.onboundary = () => {
          // Play synchronized vocal chime on word boundary
          const f = voiceProfile.range[Math.floor(Math.random() * voiceProfile.range.length)];
          KawaiiAudio.playChirp(f, 0.08, voiceProfile.type, 0.14);
          this.setAudioLevel(0.65 + Math.random() * 0.35);
          setTimeout(() => this.setAudioLevel(0.2), 110);
        };

        utterance.onstart = () => {
          // Continuous lip-sync animation
          mouthInterval = setInterval(() => {
            const f = voiceProfile.range[Math.floor(Math.random() * voiceProfile.range.length)];
            KawaiiAudio.playChirp(f, 0.06, voiceProfile.type, 0.08);
            this.setAudioLevel(0.3 + Math.random() * 0.7);
          }, 140);
        };

        utterance.onend = () => {
          clearInterval(mouthInterval);
          finish();
        };

        utterance.onerror = () => {
          clearInterval(mouthInterval);
          this._proceduralBabble(2600, voiceProfile, finish);
        };

        window.speechSynthesis.speak(utterance);

        // Fallback timeout in case speech synthesis stalls
        setTimeout(() => {
          if (!window.speechSynthesis.speaking && !finished) {
            clearInterval(mouthInterval);
            this._proceduralBabble(2600, voiceProfile, finish);
          }
        }, 400);

        return;
      } catch (err) {
        console.warn('SpeechSynthesis unavailable, using procedural synth:', err);
      }
    }

    // Procedural voice fallback
    this._proceduralBabble(2600, voiceProfile, finish);
  }

  /**
   * Procedural vocal babble (Animal Crossing / Tamagotchi melodic syllables)
   */
  _proceduralBabble(durationMs, profile, onEnd) {
    const startTime = performance.now();
    let lastChirpTime = 0;

    const loop = (now) => {
      const elapsed = now - startTime;
      if (elapsed >= durationMs) {
        if (typeof onEnd === 'function') onEnd();
        return;
      }

      // Play vocal chirp every ~130ms
      if (now - lastChirpTime > 130 + Math.random() * 50) {
        const f = profile.range[Math.floor(Math.random() * profile.range.length)];
        KawaiiAudio.playChirp(f, 0.07, profile.type, 0.16);
        lastChirpTime = now;
      }

      const wave = (Math.sin(elapsed / 110) + Math.sin(elapsed / 65) + 1.8) / 3.8;
      this.setAudioLevel(wave);
      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }

  /**
   * Legacy say method; now produces REAL audible voice!
   */
  say(durationOrText = 2600, onComplete) {
    if (typeof durationOrText === 'string') {
      this.speak(durationOrText, onComplete);
    } else {
      this.speak(null, onComplete);
    }
  }

  /**
   * Plays victory celebration fanfare and switches state to success
   */
  celebrate(durationMs = 3000, onComplete) {
    this.state = 'success';
    this.badge = 'TASK COMPLETE! 🌟';
    KawaiiAudio.playFanfare();

    setTimeout(() => {
      this.state = 'idle';
      this.badge = 'READY';
      if (typeof onComplete === 'function') onComplete();
    }, durationMs);
  }
}

// Register the Custom Element
if (!customElements.get('kawaii-agent')) {
  customElements.define('kawaii-agent', KawaiiAgent);
}

// Global helpers for framework-free embedding
window.KawaiiAgent = KawaiiAgent;
window.KawaiiAudio = KawaiiAudio;
