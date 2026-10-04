# 🌸 Kawaii Agent Avatars for Agentic Architectures

Fluid, morphing gooey pastel dots with **distinct geometrical silhouettes** (Circle, Square, Triangle, Diamond, Hexagon) and crisp vector kawaii faces, built natively for web applications to impersonate autonomous AI agents in real-time.

---

## 📐 5 Geometrical Agent Archetypes

Each agent in your orchestration system can possess its own iconic geometrical shape, color palette, and expressive face:

| Shape | Persona | Role | Colors | Geometry & Silhouette |
| :---: | :--- | :--- | :--- | :--- |
| **⚪ Circle** | **Mochi** | Assistant / Host | `#ffb7b2` (Rose), `#ffdac1` (Peach) | Classic round fluid droplet; warm, friendly, and approachable. |
| **🟩 Square** | **Byte** | Code Synthesizer | `#a8e6cf` (Mint), `#bbf2f6` (Aqua) | Squishy gelatin squircle / code block; springy corner jiggles. |
| **🔺 Triangle** | **Sage** | Knowledge Retrieval | `#ffeaa7` (Buttercup), `#fdcb6e` (Honey) | Bouncy rounded pyramid / delta; face sits naturally in the base. |
| **💎 Diamond** | **Nova** | Strategic Planner | `#d8b4e2` (Lavender), `#b5d0ff` (Periwinkle) | Radiant 4-point cosmic rhombus / star gem; sparkling tilt. |
| **⬡ Hexagon** | **Echo** | QA & Critic | `#ffaaa5` (Coral), `#ffd3b6` (Apricot) | Symmetrical 6-facet cyber shield; structured and analytical. |

---

## 💡 Architectural Core: Dual-Layer Separation

To achieve organic, liquid-like morphing between geometric blobs without melting or distorting the facial features (eyes, blush, mouth), the rendering is strictly decoupled into two layers:

```
┌────────────────────────────────────────────────────────┐
│  .kawaii-character[data-shape="triangle"] (Container)  │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Layer 2: .kawaii-face (Z-Index: 10, Unfiltered)  │  │
│  │   • Crisp vector eyes with specular shine        │  │
│  │   • Soft glowing blush cheeks                    │  │
│  │   • Scalable mouth (procedural & audio lip-sync) │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Layer 1: .goo-container (Filter: url(#fluid-goo))│  │
│  │   • Blob 1 (Vertex / Facet 1)                    │  │
│  │   • Blob 2 (Vertex / Facet 2)                    │  │
│  │   • Blob 3 (Vertex / Facet 3)                    │  │
│  │   • Blob 4 (Core / Fill)                         │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

---

## 🔄 Agentic States & Dynamic Expressions

Set `state="idle"`, `state="thinking"`, etc., to reflect your agent's real-time lifecycle:

- **`idle`**: Gentle breathing and periodic cute blinks.
- **`thinking`**: Rapid blob swirls, pondering upward glance, and inquisitive head tilt.
- **`speaking`**: Upbeat face bounce with animated lip-sync and glowing cheeks.
- **`listening`**: Blobs swell, eyes widen, and listening posture engages.
- **`success`**: Celebration bounce with joyful crescent eyes (`^ _ ^`).
- **`error`**: Distress wobble/shiver with wobbly mouth.

---

## 🚀 Embedding in Your Web Application

### Option 1: Web Component (Recommended)

Include the script and stylesheet, then use the `<kawaii-agent>` custom element:

```html
<link rel="stylesheet" href="kawaii-agent.css">
<script src="kawaii-agent.js" defer></script>

<!-- Specify persona, custom shape, and state -->
<kawaii-agent 
  id="planner-agent"
  persona="nova" 
  shape="diamond"
  state="thinking" 
  size="240px" 
  track-mouse="true"
  badge="Planning...">
</kawaii-agent>
```

#### JavaScript Control API:
```javascript
const agent = document.getElementById('planner-agent');

// Switch persona and shape
agent.persona = 'byte';
agent.shape = 'square'; // 'circle' | 'square' | 'triangle' | 'diamond' | 'hexagon'

// Switch state
agent.state = 'speaking';
agent.badge = 'Generating code...';

// Real-time audio lip-sync from microphone
await agent.startMicReactivity();

// Or pass live stream volume factor (0.0 to 1.0)
agent.setAudioLevel(0.85);

// Simulate natural speech for 3 seconds
agent.say(3000, () => {
  agent.state = 'idle';
  agent.badge = 'Ready';
});
```

---

### Option 2: React / Next.js Component

```tsx
import React, { useEffect, useRef } from 'react';
import './kawaii-agent.css';
import './kawaii-agent.js';

interface KawaiiAgentProps {
  persona?: 'mochi' | 'nova' | 'byte' | 'sage' | 'echo';
  shape?: 'circle' | 'square' | 'triangle' | 'diamond' | 'hexagon';
  state?: 'idle' | 'thinking' | 'speaking' | 'listening' | 'success' | 'error';
  size?: string;
  badge?: string;
  trackMouse?: boolean;
}

export const AgentAvatar: React.FC<KawaiiAgentProps> = ({
  persona = 'byte',
  shape = 'square',
  state = 'idle',
  size = '220px',
  badge = '',
  trackMouse = true,
}) => {
  const agentRef = useRef<any>(null);

  useEffect(() => {
    if (agentRef.current) {
      agentRef.current.persona = persona;
      agentRef.current.shape = shape;
      agentRef.current.state = state;
      agentRef.current.badge = badge;
    }
  }, [persona, shape, state, badge]);

  return (
    // @ts-ignore
    <kawaii-agent
      ref={agentRef}
      persona={persona}
      shape={shape}
      state={state}
      size={size}
      track-mouse={trackMouse ? 'true' : 'false'}
    />
  );
};
```

---

### Option 3: Pure HTML & CSS (No JavaScript Frameworks)

```html
<div class="kawaii-character" data-persona="sage" data-shape="triangle" data-state="thinking">
  <!-- Layer 1: Morphing Gooey Background -->
  <div class="goo-container">
    <div class="blob blob-1"></div>
    <div class="blob blob-2"></div>
    <div class="blob blob-3"></div>
    <div class="blob blob-4"></div>
  </div>

  <!-- Layer 2: Unfiltered Kawaii Face -->
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

<!-- Global Filter Definition (place once in body) -->
<svg aria-hidden="true" style="position: absolute; width: 0; height: 0; pointer-events: none;">
  <defs>
    <filter id="fluid-goo" color-interpolation-filters="sRGB">
      <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur" />
      <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="goo" />
    </filter>
  </defs>
</svg>
```

---

## 📂 File Directory

- `kawaii-agent.css`: Production stylesheet with gooey blend filter, 5 geometric shape systems, 5 persona palettes, and 6 agent states.
- `kawaii-agent.js`: Encapsulated Web Component with cursor tracking, Web Audio API microphone lip-sync, and shape switching.
- `index.html`: Interactive studio to test geometric shapes, personas, states, and voice reactivity.
- `README.md`: Complete architecture and integration documentation.
