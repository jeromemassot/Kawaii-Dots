/**
 * KawaiiAgent - Custom Web Component for Agentic Architectures
 * 
 * Embeds morphing fluid dots with distinct geometrical shapes (Circle, Square, Triangle, Diamond, Hexagon)
 * and a crisp foreground kawaii face.
 * Supports agent states, persona theming, cursor tracking, and real-time audio lip-sync.
 */

const SVG_FILTER_ID = 'fluid-goo';

const PERSONA_SHAPES = {
  mochi: 'circle',
  byte: 'square',
  sage: 'triangle',
  nova: 'diamond',
  echo: 'hexagon'
};

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
      // If no explicit shape override was set, update the active shape to match the persona
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
    // Scale mouth between 0.8 (closed) and 2.6 (wide open)
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
    const maxRadius = 7; // Max pixels to offset the face/eyes

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
        // Sample voice frequency range
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
   * Simulates speaking state for a given duration or text length.
   */
  say(durationMs = 2500, onComplete) {
    const prevState = this.state;
    this.state = 'speaking';

    const startTime = performance.now();
    const animateMouth = (now) => {
      const elapsed = now - startTime;
      if (elapsed >= durationMs) {
        this.setAudioLevel(0);
        this.state = prevState === 'speaking' ? 'idle' : prevState;
        if (typeof onComplete === 'function') onComplete();
        return;
      }

      // Procedural natural speech syllable simulation
      const wave = (Math.sin(elapsed / 110) + Math.sin(elapsed / 65) + 1.8) / 3.8;
      this.setAudioLevel(wave);
      requestAnimationFrame(animateMouth);
    };

    requestAnimationFrame(animateMouth);
  }
}

// Register the Custom Element
if (!customElements.get('kawaii-agent')) {
  customElements.define('kawaii-agent', KawaiiAgent);
}

// Global helper for framework-free embedding
window.KawaiiAgent = KawaiiAgent;
