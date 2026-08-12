# P's Favourites

> A personal music space for songs that deserve a replay.

**P's Favourites** is a minimal, cinematic web-based music player built around a simple idea: keep a personal collection of favourite songs in one beautiful place.

Instead of hard-coding the playlist into the application, the project uses **Google Sheets as a lightweight content source**. This makes it possible to add, remove, or update songs without changing the application code.

The interface combines a visual village-inspired environment with a focused music-player experience powered by YouTube.

---

## Features

- Personal favourite-song collection
- Google Sheets powered playlist
- Automatic playlist refresh
- YouTube video playback
- Play / pause controls
- Previous / next song navigation
- Automatic next-song playback
- Interactive progress bar
- Click-to-seek functionality
- Volume control
- Favourite/like interaction
- Playlist overlay
- Responsive layout for desktop and mobile
- Cinematic background environment
- Custom typography
- Subtle UI animations
- Glassmorphic footer
- No traditional backend required

---

## How It Works

The application follows a simple data flow:

```text
Google Sheets
     │
     ▼
CSV Endpoint
     │
     ▼
React Application
     │
     ▼
Song Data Processing
     │
     ▼
YouTube Player
     │
     ▼
Music Player Interface
