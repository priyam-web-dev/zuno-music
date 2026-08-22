# ZUNO

> **A personal corner for songs, scenes, and the moments attached to them.**

ZUNO is a personalized music experience built around one simple idea:

**your music space should feel like yours.**

Instead of turning the homepage into a dashboard full of widgets, ZUNO keeps the interface intentionally quiet: an immersive visual scene, a personal greeting, and a compact music console that stays out of the way until you need it.

---

## ✦ What is ZUNO?

ZUNO is a personal favourites / music web app where each signed-in user gets their own:

- profile
- display name
- selected visual background
- playlists
- saved playlist songs
- playback controls

The homepage is designed as an **immersive, cinematic scene**, not a conventional music-dashboard layout.

The visual language is intentionally:

**premium · cinematic · Indian · artistic · minimal**

The current design uses full-screen illustrated Indian environments, a personalized time-based greeting, a floating pill-shaped music player, and translucent controls that sit naturally over the scene.

---

## ✦ The Experience

### 01 — Arrive

The user lands inside a full-screen visual scene.

No separate loading page is used before the main experience. Stored account information is restored immediately so the interface can appear without an unnecessary loading wall.

### 02 — See your moment

The hero greeting is personalized from the logged-in profile.

The first line uses the user's first name.

The second line changes with the time of day:

```text
Priyam
की सुबह
```

```text
Priyam
की दोपहर
```

```text
Priyam
की शाम
```

```text
Priyam
की रात
```

The phrase updates automatically as the time changes.

### 03 — Listen

The bottom music console provides the core playback experience:

- current song title
- favourite / like action
- progress seeking
- elapsed time
- total duration
- previous track
- play / pause
- next track
- volume
- queue access
- animated music visualizer

The actual YouTube player remains hidden visually while continuing to provide playback.

### 04 — Make it yours

The profile panel lets the user change:

- display name
- visual background

The playlist panel lets the user:

- create playlists
- select playlists
- add the currently selected song
- add a song from a YouTube / YouTube Music URL
- import a YouTube playlist
- remove songs
- delete playlists
- play a selected playlist

---

# ✦ Core Features

## Authentication

ZUNO uses Supabase Authentication with a username-first interface.

The user does not have to think about email-style credentials in the UI. Internally, the application converts the username into a synthetic authentication email using:

```text
username@pfavourites.local
```

Example:

```text
priyam
↓
priyam@pfavourites.local
```

The application supports:

- Login
- Account creation
- Session restoration
- Logout
- Stored access / refresh tokens
- Profile restoration after authentication

---

## Personal Profiles

Every account has a profile containing:

```text
id
username
display_name
background_id
```

The display name powers the personalized hero greeting and the account control in the navbar.

---

## Personal Backgrounds

ZUNO currently provides a collection of locally stored illustrated scenes.

Available background themes include:

- शाम की गली
- सूरज ढलना
- सूर्यनगर स्टेशन
- पहाड़ी घाटी
- गाँव
- रंगीन बाज़ार
- पुरानी हवेली
- शहर की शाम
- देसी गली
- सुनहरी शाम

The selected background is stored with the user's profile and restored for that account.

---

## Music Playback

Playback is handled through the **YouTube IFrame Player API**.

The visible video player has intentionally been removed from the main visual experience. The YouTube player is mounted as a hidden playback host while ZUNO presents its own custom music controls.

The custom player tracks:

```text
current track
playing state
progress
elapsed time
duration
volume
queue
liked state
```

When a track ends, ZUNO automatically advances to the next available track.

---

## Playlists

Playlist data is stored per user in Supabase.

The current playlist system supports:

```text
Create playlist
        ↓
Select playlist
        ↓
Load its songs
        ↓
Add songs
        ↓
Play playlist
        ↓
Remove songs / delete playlists
```

A playlist can receive:

- the current ZUNO song
- a single YouTube / YouTube Music URL
- a public YouTube playlist import

Imported tracks are saved as playlist songs and remain playable through ZUNO's existing YouTube-based player.

---

## Queue

The queue provides a simple view of the user's available tracks.

The active song is highlighted, and selecting any queue item immediately changes playback.

The queue is intentionally compact so it does not compete with the main cinematic scene.

---

# ✦ Keyboard & Interaction Layer

ZUNO provides practical keyboard controls so the interface can be used without constantly reaching for the mouse.

| Key / Gesture | Action |
|---|---|
| `Space` | Play / pause |
| `←` | Previous song |
| `→` | Next song |
| `M` | Mute / restore volume |
| `↑` | Increase volume |
| `↓` | Decrease volume |
| `0` | Restart current song |
| `Shift + ←` | Seek backward 10 seconds |
| `Shift + →` | Seek forward 10 seconds |
| `F` | Open playlists |
| `P` | Open queue |
| `Enter` | Play selected queue item |
| `Esc` | Close open panels |
| Double-click player | Play / pause |

Keyboard shortcuts intentionally avoid interfering with:

- inputs
- textareas
- selects
- contenteditable elements

---

# ✦ Playback Persistence

ZUNO remembers useful playback preferences so returning to the site feels continuous rather than reset-heavy.

Current persistence and continuity include:

- last known account session
- volume preference
- current track context where available
- playback position / resume context where supported by the player state
- preserving the currently playing song when playlist data refreshes

The playlist refresh logic intentionally avoids jumping back to the first track when the current song is still present.

---

# ✦ Visual Design System

ZUNO follows a deliberately restrained visual system.

### The scene

The background is the primary visual canvas.

The UI does not try to overpower it.

### The hero

Large, personalized typography sits inside the scene rather than inside a conventional card.

### The navbar

The current navbar uses:

- ZUNO branding
- playlist access
- profile access
- favourites count

Controls use subtle translucency and blur so the background remains visible.

### The player

The music player is a **wide pill-shaped floating console**.

It is intentionally compact, rounded, translucent, and centered near the bottom of the viewport.

### Motion

Motion is used as seasoning, not decoration.

Current visual motion includes:

- cinematic scene reveal
- slow ambient glows
- floating particles
- music visualizer motion while playing
- subtle background mouse parallax
- reduced-motion handling
- small interaction transitions

The design intentionally avoids turning every element into an animation.

---

# ✦ Typography

The current website font system uses three primary typefaces:

| Font | Role |
|---|---|
| **Tiro Devanagari Hindi** | Main typography and Hindi-facing visual language |
| **DM Sans** | UI, controls, buttons, labels |
| **Playfair Display** | Branding / logo treatment |

The combination gives ZUNO:

**Indian editorial character + modern interface clarity + premium branding.**

---

# ✦ Responsive Behaviour

ZUNO is designed to remain usable across desktop and mobile layouts.

On smaller screens:

- navigation compresses
- secondary navbar information can collapse
- the music player becomes tighter
- player controls reduce proportionally
- ambient effects are reduced
- pointer parallax is avoided where it is not appropriate

The visual hierarchy remains the same:

```text
BACKGROUND
     ↓
PERSONAL GREETING
     ↓
MUSIC
     ↓
CONTROLS
```

---

# ✦ Technical Architecture

At a high level:

```text
                    ┌────────────────────┐
                    │       ZUNO UI      │
                    │      React App     │
                    └─────────┬──────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
   Supabase Auth        Supabase Data      YouTube IFrame
          │                   │                   │
          ▼                   ▼                   ▼
     User session      Profiles / Playlists    Playback
                              │
                              ▼
                         Player State
                              │
                              ▼
                       ZUNO Music UI
```

---

# ✦ Current Tech Stack

Only the technologies currently used by the project are listed here.

| Technology | Purpose |
|---|---|
| **React** | UI and application architecture |
| **Vite** | Development / build tooling |
| **JavaScript / JSX** | Application logic |
| **CSS** | Custom visual system, animations and responsive design |
| **Supabase** | Authentication and persistent user / playlist data |
| **YouTube IFrame Player API** | Actual music playback |
| **GitHub** | Source control |
| **Vercel** | Deployment |

### Browser / platform APIs used

The application also uses standard browser capabilities for:

- `localStorage`
- keyboard events
- pointer events
- `requestAnimationFrame`
- `requestIdleCallback` where available
- media/player integration through the YouTube API

These are implementation APIs rather than separate framework dependencies.

---

# ✦ Project Structure

The core application currently revolves around a small number of focused files:

```text
ZUNO/
│
├── public/
│   └── assets/
│       ├── bg1.png
│       ├── bg2.png
│       ├── ...
│       └── bg10.png
│
├── src/
│   ├── main.jsx
│   └── styles.css
│
├── package.json
├── index.html
└── README.md
```

### `src/main.jsx`

Contains the application logic for:

- authentication
- profile loading and saving
- background selection
- playlist operations
- song loading
- YouTube player setup
- playback state
- player controls
- keyboard controls
- queue
- profile panel
- playlist panel
- background motion
- personalized time greeting

### `src/styles.css`

Contains the visual system for:

- full-screen scene layout
- typography
- navbar
- hero positioning
- music player
- responsive behaviour
- panels
- controls
- visual effects
- animations

---

# ✦ Data Model

The application currently works around these core concepts:

```text
User
 │
 ├── Profile
 │    ├── username
 │    ├── display_name
 │    └── background_id
 │
 └── Playlists
      │
      ├── Playlist
      │    ├── id
      │    ├── name
      │    └── created_at
      │
      └── Playlist Songs
           ├── youtube_id
           ├── song_name
           ├── artist
           └── position
```

The player converts stored playlist-song data into the internal track representation used by the React player state.

---

# ✦ Local Development

Clone the repository:

```bash
git clone <your-repository-url>
cd ZUNO
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Vite will provide the local development URL.

---

# ✦ Deployment

The current deployment workflow is intentionally simple:

```text
Code
  ↓
GitHub
  ↓
Vercel
  ↓
Production
```

Push changes to the connected GitHub repository and Vercel handles the production deployment.

Current production site:

**https://zuuno.vercel.app**

---

# ✦ Configuration & Security Notes

The project integrates Supabase directly from the application and uses the YouTube IFrame Player API.

For production hygiene:

- use environment variables for configuration
- keep private secrets off the client
- use Supabase Row Level Security for user-owned data
- never expose service-role keys or database credentials in frontend code
- keep authentication tokens out of committed source files

The current repository should treat the public Supabase publishable key as client configuration and never expose privileged Supabase credentials.

---

# ✦ Design Principles

ZUNO is intentionally built around a few rules.

### **1. The background is the artwork.**
The interface should sit inside the scene, not fight it.

### **2. Personalization beats complexity.**
A user's name, time of day, playlists and chosen background matter more than an overloaded dashboard.

### **3. Motion should have a reason.**
Playback state, interaction feedback and scene depth are useful. Animation for animation's sake is not.

### **4. Compact controls are better than permanent panels.**
The player, queue and profile tools stay available without consuming the whole screen.

### **5. Don't overbuild the quiet parts.**
ZUNO is deliberately not trying to become a full streaming platform.

---

# ✦ Current Feature Boundary

The current project is best understood as:

> **A personalized music space, not a streaming service clone.**

It focuses on:

- personal playlists
- personal backgrounds
- personal greetings
- YouTube-based playback
- lightweight account persistence
- a custom cinematic interface

That boundary is part of the product.

More features are not automatically better features.

---

# ✦ Status

**ZUNO is in its polished personal-product phase.**

The core experience is intentionally considered complete enough to stop adding interface noise and start letting the design breathe.

```text
A scene.
A name.
A time.
A song.
Your space.
```

---

## Built with attention to the details that should stay quiet.

**ZUNO**
