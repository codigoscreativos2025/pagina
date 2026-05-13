# Storyboard - Meta Review Video

## Global Settings

```
Format: 1920×1080
Audio: TTS (Kokoro adam) + SFX (clicks, transitions)
VO Direction: English, calm professional, Apple keynote register
Style Basis: DESIGN.md (Pivot.AI dark glassmorphism)
Duration: 45 seconds total
```

## Asset Audit

| Asset | Type | Assign to Beat | Role |
|-------|------|----------------|------|
| Cursor | SVG | All beats | Mouse cursor simulation |
| Facebook icon | SVG | Beat 1, 3 | Platform logo |
| Instagram icon | SVG | Beat 3, 5 | Platform logo |
| WhatsApp icon | SVG | Beat 3, 5 | Platform logo |
| Check icon | SVG | Beat 3, 4 | Success state |
| User avatar | SVG | Beat 2 | Dashboard header |

## Per-Beat Direction

---

### BEAT 1 — FACEBOOK LOGIN (0:00 - 8s)

**VO Cue**: "Log in with Facebook to access your Pivot.AI dashboard"

**Concept**: Cold open - transition from black to login screen. Dark theme, glass card centered.

**Mood**: Professional, invite-to-action. High contrast dark/brand.

**Visual Description**:
- Background: Full screen gradient #0F172A → #1E293B
- Center card: Glass card (bg white/5, backdrop-blur, border white/10)
  - Logo "Pivot.AI" in header (brand-400 + accent cyan)
  - "Iniciar Sesión" title
  - Email input field
  - Password input field
  - Facebook button (brand blue, white text)
  - Google button (white bg, dark text)
- Cursor enters from right, moves to Facebook button
- Click pulse on Facebook button
- Flash/transition to next beat

**Camera**: Static frame, slight fade from black at 0s.

**Animation Choreography**:
- 0.0s: Fade in from black (0.5s)
- 1.0s: Card scales from 0.95 → 1 (0.4s, ease: power3.out)
- 1.5s: Logo Fade in (0.3s)
- 2.0s: Input fields stagger in (0.15s each)
- 3.0s: Buttons fade in (0.15s each)
- 4.5s: Cursor enters from right
- 5.0s: Cursor moves to Facebook button
- 6.0s: Click pulse animation
- 7.0s: Card flashes white, fades to next beat

**Transitions**: 
- IN: Fade from black (0.5s)
- OUT: Card flash white → fade (0.8s, ease: power2.in)

**SFX**: 
- Subtle whoosh on card enter
- Click sound on button

**Subtitles**:
- "Inicia sesión con Facebook"
- "Access your AI marketing platform"

---

### BEAT 2 — DASHBOARD (8s - 17s)

**VO Cue**: "View your AI agents and key metrics at a glance"

**Concept**: Dashboard reveal. Sidebar and main content area.

**Mood**: Data-rich, organized, professional. Multiple elements entering.

**Visual Description**:
- Full Dashboard layout:
  - Sidebar (240px, left): Navigation + logo
  - Main area: Header + cards grid
- Sidebar slides in from left
- Navigation items stagger in (Dashboard, Agents, Integrations, CRM, Settings)
- Header appears with avatar
- 4 Metric cards appear in grid:
  - Card 1: "12" Agents (icon: robot)
  - Card 2: "2,847" Messages (icon: message)
  - Card 3: "156" Conversations (icon: chat)
  - Card 4: "98%" Efficiency (icon: chart)
- Each card: counter animation on numbers (0 → final, 1.5s)

**Camera**: Static frame, no camera movement.

**Animation Choreography**:
- 8.0s: Sidebar slides in from left (0.4s, ease: power3.out)
- 8.5s: Nav items stagger (0.1s each)
- 9.0s: Header fades in (0.3s)
- 9.5s: Cards fade in (0.1s stagger)
- 10.0s: Counter animation starts on each card (1.5s each, offset 0.3s)
- 13.0s: Hold on dashboard
- 15.0s: Fade to next beat

**Transitions**:
- IN: Fade from previous (0.5s)
- OUT: Fade to next beat (0.5s)

**SFX**: 
- Soft swoosh on sidebar
- Subtle tick on counter numbers

**Subtitles**:
- "Dashboard principal"
- "Monitorea tus métricas en tiempo real"

---

### BEAT 3 — INTEGRATIONS (17s - 27s)

**VO Cue**: "Connect your Meta business accounts"

**Concept**: Integration grid with connect flow.

**Mood**: Connection-focused, action-driven. Platform logos prominent.

**Visual Description**:
- Header: "Integraciones" title
- Grid of 4 cards:
  - Facebook Ads (blue)
  - Instagram (gradient pink/orange)
  - WhatsApp (green)
  - Google (blue/red)
- Each card shows: Platform icon, name, status badge
- Cursor moves to Facebook "Connect" button
- Click animation
- Modal fades in (OAuth permission request)
- Modal shows: "Pivot.AI wants to access your Facebook account"
- Click "Accept"
- Success: Green check appears, "Connected" badge

**Camera**: Static, slight zoom on modal.

**Animation Choreography**:
- 17.0s: Header fades in (0.3s)
- 17.5s: Integration cards fade in + stagger (0.15s each)
- 20.0s: Cursor enters
- 20.5s: Cursor moves to Connect button
- 21.5s: Click pulse
- 22.0s: Modal scales in from 0.9 → 1 (0.3s, ease: back.out)
- 23.0s: Modal content fades in
- 24.5s: Click Accept
- 25.0s: Modal success animation (checkmark)
- 26.0s: Card updates to "Connected" state

**Transitions**:
- IN: Fade + slight zoom in (0.5s)
- OUT: Fade (0.5s)

**SFX**: 
- Click sound
- Modal whoosh
- Success chime

**Subtitles**:
- "Conecta tus cuentas Meta"
- "Facebook, Instagram, WhatsApp"

---

### BEAT 4 — META ADS (27s - 37s)

**VO Cue**: "Monitor your advertising performance with real-time insights"

**Concept**: Ads dashboard with data visualization.

**Mood**: Data-intensive, analytical, business-focused.

**Visual Description**:
- Header tabs: Overview | Campaigns | Analytics (Ads active)
- 4 Key metric cards (top row):
  - "$12,450" Spend (brand green)
  - "45,200" Impressions
  - "1,240" Clicks
  - "2.74%" CTR
- Simple line chart (right side): Spend over time
- Campaign table (bottom):
  - Columns: Campaign | Status | Spend | Results | CTR
  - 3 rows with data

**Camera**: Static frame.

**Animation Choreography**:
- 27.0s: Tabs fade in
- 27.5s: Metrics cards appear
- 28.5s: Counter animations (1.5s each)
- 31.0s: Chart line draws in (SVG path animation)
- 32.0s: Table rows stagger in (0.1s each)
- 35.0s: Hold on data

**Transitions**:
- IN: Slide up from bottom (0.5s)
- OUT: Fade (0.5s)

**SFX**: 
- Counter tick sounds
- Line draw subtle sound

**Subtitles**:
- "Visualiza métricas de Ads"
- "Datos en tiempo real"

---

### BEAT 5 — MESSAGES (37s - 45s)

**VO Cue**: "Manage Instagram and WhatsApp messages automatically with AI"

**Concept**: Chat interface with AI automation flow.

**Mood**: Conversation, responsive, AI-powered.

**Visual Description**:
- Left panel: Conversation list (5-6 items)
- Right panel: Active chat
  - Header: Contact name + platform icon (Instagram)
  - Bubble incoming: "Hola, tengo una pregunta sobre..."
  - Bubble outgoing: "Claro, con gusto te ayudo..."
  - Typing indicator "AI is typing..."
  - AI response bubble appears (typing effect)
- Bottom: Quick replies suggested buttons
- Auto-reply badge showing "Active"

**Camera**: Static frame.

**Animation Choreography**:
- 37.0s: Left panel slides in (0.3s)
- 37.5s: Conversation items stagger in
- 38.5s: Right panel expands (0.3s)
- 39.0s: Chat bubbles appear
- 40.0s: Typing indicator appears
- 41.0s: AI response types in (character by character)
- 43.0s: Quick reply buttons appear
- 44.0s: Final hold

**Transitions**:
- IN: Fade + slide right (0.5s)
- OUT: Fade to black / end card (0.5s)

**SFX**: 
- Message receive ping
- Typing keyboard sounds
- AI response subtle whoosh

**Subtitles**:
- "Gestiona mensajes automáticamente"
- "Instagram + WhatsApp"

---

### BEAT 6 — END CARD (45s - 47s)

**Fade in**:
- "Pivot.AI" logo
- "Powered by AI" tagline
- Tagline: "Automatiza tu marketing con inteligencia artificial"

---

## Production Architecture

```
meta-review-video/
├── index.html              # root timeline + VO
├── DESIGN.md             # brand reference
├── SCRIPT.md            # narration text
├── STORYBOARD.md         # THIS FILE
├── compositions/
│   ├── beat-1-login.html
│   ├── beat-2-dashboard.html
│   ├── beat-3-integrations.html
│   ├── beat-4-ads.html
│   ├── beat-5-messages.html
│   └── beat-6-endcard.html
├── assets/
│   ├── narration.mp3
│   ├── cursor.svg
│   └── icons/
├── transcripts/
│   └── transcript.json
└── renders/
    └── video.mp4
```

## Techniques by Beat

| Beat | Techniques Used |
|------|--------------|
| Beat 1 | Fade transitions, scale animation, cursor movement |
| Beat 2 | Stagger animations, counter numbers, slide transitions |
| Beat 3 | Modal animations, click pulse, SVG check mark |
| Beat 4 | Counter numbers, SVG line drawing, table stagger |
| Beat 5 | Typing effect, bubble animations, slide transitions |

## Notes

- All animations must be deterministic (no random)
- Use GSAP with `repeat: 0` or calculated repeat count
- Cursor should follow smooth path, not instant teleport
- Counter animation should match easing: power2.out orExpo.out
- Modal transitions use scale + opacity, not just fade
- Keep all text in English for Meta reviewer