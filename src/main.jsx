import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

/* =========================================================
   SUPABASE
   ========================================================= */

const SUPABASE_URL =
  "https://hcmphgulivafampfywgv.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_5tw3YhpSxWSBMntXGWQLAw_5kknL3mu";

/*
  Username based login ke liye hum internally
  ek synthetic email banayenge.

  Example:
  priyam
  ↓
  priyam@pfavourites.local

  Password Supabase Auth handle karega.
*/

const AUTH_EMAIL_DOMAIN =
  "pfavourites.local";


/* =========================================================
   BACKGROUNDS
   ========================================================= */

const BACKGROUNDS = [
  {
    id: 1,
    name: "शाम की गली",
    value: "/assets/bg1.png",
  },
  {
    id: 2,
    name: "सूरज ढलना",
    value: "/assets/bg2.png",
  },
  {
    id: 3,
    name: "सूर्यनगर स्टेशन",
    value: "/assets/bg3.png",
  },
  {
    id: 4,
    name: "पहाड़ी घाटी",
    value: "/assets/bg4.png",
  },
  {
    id: 5,
    name: "गाँव",
    value: "/assets/bg5.png",
  },
  {
    id: 6,
    name: "रंगीन बाज़ार",
    value: "/assets/bg6.png",
  },
  {
    id: 7,
    name: "पुरानी हवेली",
    value: "/assets/bg7.png",
  },
  {
    id: 8,
    name: "शहर की शाम",
    value: "/assets/bg8.png",
  },
  {
    id: 9,
    name: "देसी गली",
    value: "/assets/bg9.png",
  },
  {
    id: 10,
    name: "सुनहरी शाम",
    value: "/assets/bg10.png",
  },
];

/* =========================================================
   ZUNO — RECOMMENDED PLAYLISTS
   Public curated playlists shown to every user.
   YouTube links will be added after the UI is approved.
   ========================================================= */
const RECOMMENDED_PLAYLISTS = [
  {
    id: "late-night",
    title: "Late Night",
    subtitle: "For quiet roads & 2 AM thoughts",
    mood: "रात वाली vibe",
    background: "/assets/bg8.png",
  },
  {
    id: "punjabi-vibes",
    title: "Punjabi Vibes",
    subtitle: "Bass, beats & full desi energy",
    mood: "दिल से loud",
    background: "/assets/bg6.png",
  },
  {
    id: "soft-hours",
    title: "Soft Hours",
    subtitle: "Slow songs for slower moments",
    mood: "थोड़ा ठहरो",
    background: "/assets/bg4.png",
  },
  {
    id: "bollywood-mood",
    title: "Bollywood Mood",
    subtitle: "Songs that already know the story",
    mood: "एक scene और",
    background: "/assets/bg10.png",
  },
  {
    id: "desi-chill",
    title: "Desi Chill",
    subtitle: "Easy listening, Indian soul",
    mood: "बस चलने दो",
    background: "/assets/bg5.png",
  },
];



/* =========================================================
   YOUTUBE API
   ========================================================= */

function loadYouTubeAPI() {
  return new Promise(
    (resolve) => {
      if (window.YT?.Player) {
        resolve(window.YT);
        return;
      }

      const previousCallback =
        window.onYouTubeIframeAPIReady;

      window.onYouTubeIframeAPIReady =
        () => {
          previousCallback?.();
          resolve(window.YT);
        };

      if (
        !document.querySelector(
          'script[src="https://www.youtube.com/iframe_api"]'
        )
      ) {
        const script =
          document.createElement(
            "script"
          );

        script.src =
          "https://www.youtube.com/iframe_api";

        document.head.appendChild(
          script
        );
      }
    }
  );
}


/* =========================================================
   SUPABASE HELPERS
   ========================================================= */

function authEmail(username) {
  const clean =
    String(username)
      .trim()
      .toLowerCase()
      .replace(
        /[^a-z0-9._-]/g,
        ""
      );

  return `${
    clean || "user"
  }@${AUTH_EMAIL_DOMAIN}`;
}


async function supabaseRequest(
  path,
  options = {},
  token = null
) {
  const response =
    await fetch(
      `${SUPABASE_URL}${path}`,
      {
        ...options,

        headers: {
          apikey:
            SUPABASE_KEY,

          Authorization:
            `Bearer ${
              token ||
              SUPABASE_KEY
            }`,

          "Content-Type":
            "application/json",

          ...(options.headers || {}),
        },
      }
    );

  const text =
    await response.text();

  let data = null;

  try {
    data =
      text
        ? JSON.parse(text)
        : null;
  }

  catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(
      data?.msg ||
      data?.message ||
      data?.error_description ||
      data?.error ||
      "Supabase request failed"
    );
  }

  return data;
}


/* =========================================================
   AUTH
   ========================================================= */

async function loginUser(
  username,
  password
) {
  return supabaseRequest(
    "/auth/v1/token?grant_type=password",
    {
      method: "POST",

      body: JSON.stringify({
        email:
          authEmail(username),

        password,
      }),
    }
  );
}


async function signupUser(
  username,
  password,
  displayName
) {
  return supabaseRequest(
    "/auth/v1/signup",
    {
      method: "POST",

      body: JSON.stringify({
        email:
          authEmail(username),

        password,

        data: {
          username,
          display_name:
            displayName,
        },
      }),
    }
  );
}


/* =========================================================
   PROFILE
   ========================================================= */

async function getProfile(
  userId,
  token
) {
  const rows =
    await supabaseRequest(
      `/rest/v1/profiles?id=eq.${encodeURIComponent(
        userId
      )}&select=id,username,display_name,background_id`,
      {
        method: "GET",
      },
      token
    );

  return rows?.[0] || null;
}


async function saveProfile(
  profile,
  token
) {
  return supabaseRequest(
    "/rest/v1/profiles?on_conflict=id",
    {
      method: "POST",

      headers: {
        Prefer:
          "resolution=merge-duplicates,return=representation",
      },

      body:
        JSON.stringify(
          profile
        ),
    },
    token
  );
}


/* =========================================================
   PLAYLISTS
   ========================================================= */

async function getPlaylists(
  userId,
  token
) {
  return supabaseRequest(
    `/rest/v1/playlists?user_id=eq.${encodeURIComponent(
      userId
    )}&select=id,user_id,name,created_at&order=created_at.desc`,
    {
      method: "GET",
    },
    token
  );
}


async function createPlaylist(
  userId,
  name,
  token
) {
  return supabaseRequest(
    "/rest/v1/playlists",
    {
      method: "POST",

      headers: {
        Prefer:
          "return=representation",
      },

      body:
        JSON.stringify({
          user_id:
            userId,

          name,
        }),
    },
    token
  );
}


async function getPlaylistSongs(
  playlistId,
  token
) {
  return supabaseRequest(
    `/rest/v1/playlist_songs?playlist_id=eq.${encodeURIComponent(
      playlistId
    )}&select=id,playlist_id,youtube_id,song_name,artist,position&order=position.asc`,
    {
      method: "GET",
    },
    token
  );
}


async function addSongToPlaylist(
  playlistId,
  track,
  position,
  token
) {
  return supabaseRequest(
    "/rest/v1/playlist_songs",
    {
      method: "POST",

      headers: {
        Prefer:
          "return=representation",
      },

      body:
        JSON.stringify({
          playlist_id:
            playlistId,

          youtube_id:
            track.id,

          song_name:
            track.title,

          artist:
            track.artist,

          position,
        }),
    },
    token
  );
}


/* =========================================================
   AUTH SCREEN
   ========================================================= */

function AuthScreen({
  onAuthenticated,
}) {
  const [mode, setMode] =
    useState("login");

  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [displayName, setDisplayName] =
    useState("");

  const [busy, setBusy] =
    useState(false);

  const [message, setMessage] =
    useState("");


  const submit =
    async (event) => {
      event.preventDefault();

      setMessage("");

      if (
        !username.trim() ||
        password.length < 6 ||
        (
          mode === "signup" &&
          !displayName.trim()
        )
      ) {
        setMessage(
          mode === "signup"
            ? "नाम, username और कम-से-कम 6 characters का password भरो।"
            : "Username और कम-से-कम 6 characters का password भरो।"
        );

        return;
      }

      setBusy(true);

      try {
        const result =
          mode === "login"
            ? await loginUser(
                username,
                password
              )
            : await signupUser(
                username,
                password,
                displayName.trim()
              );

        if (
          !result?.access_token
        ) {
          if (
            mode === "signup"
          ) {
            throw new Error(
              "Account बना है, लेकिन Supabase email confirmation मांग रहा है। Supabase Authentication → Providers → Email में Confirm email OFF करो।"
            );
          }

          throw new Error(
            "Login token नहीं मिला।"
          );
        }

        localStorage.setItem(
          "pf_access_token",
          result.access_token
        );

        if (
          result.refresh_token
        ) {
          localStorage.setItem(
            "pf_refresh_token",
            result.refresh_token
          );
        }

        localStorage.setItem(
          "pf_user",
          JSON.stringify(
            result.user
          )
        );

        onAuthenticated(
          result.user,
          result.access_token
        );
      }

      catch (error) {
        setMessage(
          error.message ||
            "कुछ गलत हो गया।"
        );
      }

      finally {
        setBusy(false);
      }
    };


  return (
    <div style={authStyles.page}>

      <div style={authStyles.card}>

        <div style={authStyles.mark}>
          ♫
        </div>

        <div style={authStyles.eyebrow}>
          P's favourites
        </div>

        <h1 style={authStyles.title}>
          {
            mode === "login"
              ? "Welcome back."
              : "Make it yours."
          }
        </h1>

        <p style={authStyles.sub}>
          {
            mode === "login"
              ? "अपनी music world में वापस आओ।"
              : "अपना नाम, username और personal space बनाओ।"
          }
        </p>


        <div style={authStyles.tabs}>

          <button
            type="button"
            onClick={() => {
              setMode("login");
              setMessage("");
            }}
            style={{
              ...authStyles.tab,
              ...(mode === "login"
                ? authStyles.activeTab
                : {}),
            }}
          >
            Login
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setMessage("");
            }}
            style={{
              ...authStyles.tab,
              ...(mode === "signup"
                ? authStyles.activeTab
                : {}),
            }}
          >
            Create account
          </button>

        </div>


        <form
          onSubmit={submit}
          style={authStyles.form}
        >

          {mode === "signup" && (
            <input
              style={authStyles.input}
              placeholder="Your name"
              value={displayName}
              onChange={(e) =>
                setDisplayName(
                  e.target.value
                )
              }
              autoComplete="name"
            />
          )}


          <input
            style={authStyles.input}
            placeholder="Username"
            value={username}
            onChange={(e) =>
              setUsername(
                e.target.value
              )
            }
            autoComplete="username"
          />


          <input
            style={authStyles.input}
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) =>
              setPassword(
                e.target.value
              )
            }
            autoComplete={
              mode === "login"
                ? "current-password"
                : "new-password"
            }
          />


          {message && (
            <div
              style={
                authStyles.message
              }
            >
              {message}
            </div>
          )}


          <button
            disabled={busy}
            type="submit"
            style={
              authStyles.submit
            }
          >
            {
              busy
                ? "Please wait…"
                : mode === "login"
                ? "Enter my favourites"
                : "Create my space"
            }
          </button>

        </form>


        <div
          style={authStyles.hint}
        >
          Free setup • Supabase Auth • No paid service required
        </div>

      </div>

    </div>
  );
}


/* =========================================================
   PROFILE PANEL
   ========================================================= */

function ProfilePanel({
  profile,
  onSave,
  onLogout,
  onClose,
}) {
  const [name, setName] =
    useState(
      profile?.display_name ||
        ""
    );

  const [
    backgroundId,
    setBackgroundId,
  ] = useState(
    Number(
      profile?.background_id
    ) || 5
  );

  const [busy, setBusy] =
    useState(false);

  const [message, setMessage] =
    useState("");


  const save =
    async () => {
      setBusy(true);
      setMessage("");

      try {
        await onSave({
          display_name:
            name.trim() ||
            profile.username,

          background_id:
            backgroundId,
        });

        onClose();
      }

      catch (e) {
        setMessage(
          e.message ||
            "Save failed"
        );
      }

      finally {
        setBusy(false);
      }
    };


  return (
    <div
      style={
        panelStyles.backdrop
      }
      onClick={onClose}
    >

      <div
        style={
          panelStyles.card
        }
        onClick={(e) =>
          e.stopPropagation()
        }
      >

        <div
          style={
            panelStyles.head
          }
        >

          <div>

            <div
              style={
                panelStyles.eyebrow
              }
            >
              PROFILE
            </div>

            <h2
              style={
                panelStyles.title
              }
            >
              Make it yours
            </h2>

          </div>


          <button
            type="button"
            onClick={onClose}
            style={
              panelStyles.close
            }
          >
            ×
          </button>

        </div>


        <label
          style={
            panelStyles.label
          }
        >
          Username
        </label>

        <div
          style={
            panelStyles.readonly
          }
        >
          @{profile.username}
        </div>


        <label
          style={
            panelStyles.label
          }
        >
          Name shown on website
        </label>

        <input
          style={
            panelStyles.input
          }
          value={name}
          onChange={(e) =>
            setName(
              e.target.value
            )
          }
          placeholder="Your name"
        />


        <label
          style={
            panelStyles.label
          }
        >
          Choose your background
        </label>


        <div
          style={
            panelStyles.bgGrid
          }
        >

          {BACKGROUNDS.map(
            (bg) => (
              <button
                key={bg.id}
                type="button"
                onClick={() =>
                  setBackgroundId(
                    bg.id
                  )
                }
                style={{
                  ...panelStyles.bg,

                  ...(backgroundId ===
                  bg.id
                    ? panelStyles.bgActive
                    : {}),

                  backgroundImage:
                    `linear-gradient(rgba(0,0,0,.18),rgba(0,0,0,.18)),url(${bg.value})`,
                }}
              >
                <span>
                  {bg.name}
                </span>
              </button>
            )
          )}

        </div>


        {message && (
          <div
            style={
              panelStyles.error
            }
          >
            {message}
          </div>
        )}


        <div
          style={
            panelStyles.actions
          }
        >

          <button
            type="button"
            onClick={onLogout}
            style={
              panelStyles.logout
            }
          >
            Log out
          </button>


          <button
            type="button"
            disabled={busy}
            onClick={save}
            style={
              panelStyles.save
            }
          >
            {
              busy
                ? "Saving…"
                : "Save changes"
            }
          </button>

        </div>

      </div>

    </div>
  );
}


/* =========================================================
   LOAD SONGS FROM THE LOGGED-IN USER'S PLAYLISTS
   ========================================================= */

async function loadUserSongs(
  userId,
  token
) {
  const playlists =
    await getPlaylists(
      userId,
      token
    );

  if (!Array.isArray(playlists) || !playlists.length) {
    return [];
  }

  const results =
    await Promise.all(
      playlists.map(async (playlist) => {
        const songs =
          await getPlaylistSongs(
            playlist.id,
            token
          );

        return Array.isArray(songs)
          ? songs
          : [];
      })
    );

  const seen = new Set();
  const tracks = [];

  for (const songs of results) {
    for (const song of songs) {
      const id =
        String(song?.youtube_id || "").trim();

      if (!id || seen.has(id)) {
        continue;
      }

      seen.add(id);

      tracks.push({
        id,
        title:
          song?.song_name ||
          "Unknown song",
        artist:
          song?.artist ||
          "Unknown artist",
      });
    }
  }

  return tracks;
}


/* =========================================================
   PLAYLIST PANEL
   ========================================================= */

function PlaylistPanel({
  user,
  token,
  currentTrack,
  onPlayPlaylist,
  onLibraryChanged,
  onClose,
}) {
  const [playlists, setPlaylists] = useState([]);
  const [newName, setNewName] = useState("");
  const [selected, setSelected] = useState(null);
  const [songs, setSongs] = useState([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [onlineUrl, setOnlineUrl] = useState("");
  const [onlineMode, setOnlineMode] = useState("");

  const refresh = async () => {
    try {
      const data = await getPlaylists(user.id, token);
      setPlaylists(data || []);
    } catch (e) {
      setMessage(e.message || "Playlists load नहीं हुईं।");
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const create = async () => {
    if (!newName.trim()) return;

    setBusy(true);
    setMessage("");

    try {
      await createPlaylist(user.id, newName.trim(), token);
      setNewName("");
      await refresh();
    } catch (e) {
      setMessage(e.message || "Playlist create नहीं हुई।");
    } finally {
      setBusy(false);
    }
  };

  const openPlaylist = async (playlist) => {
    setSelected(playlist);
    setMessage("");

    try {
      const data = await getPlaylistSongs(playlist.id, token);
      setSongs(data || []);
    } catch (e) {
      setMessage(e.message || "Songs load नहीं हुए।");
    }
  };

  const addCurrentSong = async () => {
    if (!selected) {
      setMessage("Pehle playlist select karo.");
      return;
    }

    if (!currentTrack) {
      setMessage("Abhi koi song selected नहीं है।");
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      await addSongToPlaylist(
        selected.id,
        currentTrack,
        songs.length,
        token
      );

      const updated = await getPlaylistSongs(
        selected.id,
        token
      );

      setSongs(updated || []);
      await onLibraryChanged?.();
    } catch (e) {
      setMessage(e.message || "Song add नहीं हुआ।");
    } finally {
      setBusy(false);
    }
  };

  const addOnlineSong = async () => {
    if (!onlineUrl.trim()) {
      setMessage("YouTube URL paste karo.");
      return;
    }

    if (!selected) {
      setMessage("Pehle playlist select karo.");
      return;
    }

    setBusy(true);
    setOnlineMode("song");
    setMessage("");

    try {
      const response = await fetch("/api/youtube", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: onlineUrl.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Song resolve नहीं हुआ।"
        );
      }

      const song = data?.songs?.[0];

      if (!song?.id) {
        throw new Error(
          "Valid YouTube song नहीं मिला।"
        );
      }

      await addSongToPlaylist(
        selected.id,
        {
          id: song.id,
          title: song.title || "Unknown song",
          artist: song.artist || "Unknown artist",
        },
        songs.length,
        token
      );

      const updated = await getPlaylistSongs(
        selected.id,
        token
      );

      setSongs(updated || []);
      setOnlineUrl("");
      await onLibraryChanged?.();
      setMessage(`"${song.title}" added.`);
    } catch (e) {
      setMessage(e.message || "Song add नहीं हुआ।");
    } finally {
      setBusy(false);
      setOnlineMode("");
    }
  };

  const importOnlinePlaylist = async () => {
    if (!onlineUrl.trim()) {
      setMessage("YouTube playlist URL paste karo.");
      return;
    }

    setBusy(true);
    setOnlineMode("playlist");
    setMessage("");

    try {
      const response = await fetch("/api/youtube", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: onlineUrl.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Playlist import नहीं हुई।"
        );
      }

      if (
        data?.type !== "playlist" ||
        !Array.isArray(data?.songs) ||
        !data.songs.length
      ) {
        throw new Error(
          "Ye valid public YouTube playlist नहीं है।"
        );
      }

      let target = selected;

      if (!target) {
        const created = await createPlaylist(
          user.id,
          data.title || "Imported Playlist",
          token
        );

        target = created?.[0];

        await refresh();
      }

      if (!target?.id) {
        throw new Error(
          "Target playlist create नहीं हो सकी।"
        );
      }

      const existingSongs = await getPlaylistSongs(
        target.id,
        token
      );

      let position = existingSongs?.length || 0;

      for (const song of data.songs) {
        if (!song?.id) continue;

        await addSongToPlaylist(
          target.id,
          {
            id: song.id,
            title: song.title || "Unknown song",
            artist: song.artist || "Unknown artist",
          },
          position,
          token
        );

        position += 1;
      }

      setSelected(target);

      const updated = await getPlaylistSongs(
        target.id,
        token
      );

      setSongs(updated || []);
      setOnlineUrl("");
      await onLibraryChanged?.();

      setMessage(
        `${data.songs.length} songs imported successfully.`
      );

      await refresh();
    } catch (e) {
      setMessage(
        e.message || "Playlist import नहीं हुई।"
      );
    } finally {
      setBusy(false);
      setOnlineMode("");
    }
  };

  const removeSong = async (song) => {
    if (!song?.id || !selected) return;

    const confirmed = window.confirm(
      `Remove "${song.song_name}" from this playlist?`
    );

    if (!confirmed) return;

    setBusy(true);
    setMessage("");

    try {
      const response = await supabaseRequest(
        `/rest/v1/playlist_songs?id=eq.${encodeURIComponent(
          song.id
        )}`,
        {
          method: "DELETE",
        },
        token
      );

      void response;

      const updated = await getPlaylistSongs(
        selected.id,
        token
      );

      setSongs(updated || []);
      await onLibraryChanged?.();
    } catch (e) {
      setMessage(
        e.message || "Song delete नहीं हुआ।"
      );
    } finally {
      setBusy(false);
    }
  };

  const removePlaylist = async (playlist) => {
    const confirmed = window.confirm(
      `Delete playlist "${playlist.name}"?`
    );

    if (!confirmed) return;

    setBusy(true);
    setMessage("");

    try {
      const playlistSongs = await getPlaylistSongs(
        playlist.id,
        token
      );

      for (const song of playlistSongs || []) {
        await supabaseRequest(
          `/rest/v1/playlist_songs?id=eq.${encodeURIComponent(
            song.id
          )}`,
          {
            method: "DELETE",
          },
          token
        );
      }

      await supabaseRequest(
        `/rest/v1/playlists?id=eq.${encodeURIComponent(
          playlist.id
        )}`,
        {
          method: "DELETE",
        },
        token
      );

      if (selected?.id === playlist.id) {
        setSelected(null);
        setSongs([]);
      }

      await refresh();
      await onLibraryChanged?.();
    } catch (e) {
      setMessage(
        e.message || "Playlist delete नहीं हुई।"
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={panelStyles.backdrop}
      onClick={onClose}
    >
      <div
        style={{
          ...panelStyles.card,
          maxWidth: 820,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={panelStyles.head}>
          <div>
            <div style={panelStyles.eyebrow}>
              YOUR MUSIC
            </div>

            <h2 style={panelStyles.title}>
              Playlists
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={panelStyles.close}
          >
            ×
          </button>
        </div>

        <div style={panelStyles.createRow}>
          <input
            style={{
              ...panelStyles.input,
              margin: 0,
            }}
            placeholder="New playlist name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                create();
              }
            }}
          />

          <button
            type="button"
            onClick={create}
            disabled={busy}
            style={panelStyles.save}
          >
            Create
          </button>
        </div>

        <div
          style={{
            marginTop: 14,
            padding: 14,
            borderRadius: 16,
            background: "rgba(255,255,255,.34)",
            border: "1px solid rgba(30,25,20,.12)",
          }}
        >
          <div
            style={{
              fontSize: 10,
              letterSpacing: 1.6,
              fontWeight: 800,
              opacity: 0.55,
              marginBottom: 7,
            }}
          >
            QUICK ADD
          </div>

          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              marginBottom: 10,
            }}
          >
            Add a song or import a YouTube playlist
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <input
              style={{
                ...panelStyles.input,
                flex: "1 1 280px",
                margin: 0,
              }}
              placeholder="Paste YouTube / YouTube Music URL"
              value={onlineUrl}
              onChange={(e) => setOnlineUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  addOnlineSong();
                }
              }}
            />

            <button
              type="button"
              onClick={addOnlineSong}
              disabled={busy}
              style={panelStyles.addSong}
            >
              {onlineMode === "song"
                ? "Adding…"
                : "+ Add song"}
            </button>

            <button
              type="button"
              onClick={importOnlinePlaylist}
              disabled={busy}
              style={panelStyles.playPlaylist}
            >
              {onlineMode === "playlist"
                ? "Importing…"
                : "Import playlist"}
            </button>
          </div>

          <div
            style={{
              marginTop: 8,
              fontSize: 11,
              opacity: 0.55,
            }}
          >
            Single video → Add song · Playlist link → Import playlist.
          </div>
        </div>

        <div
          style={{
            ...panelStyles.playlistGrid,
            marginTop: 18,
          }}
        >
          <div>
            <div style={panelStyles.sectionTitle}>
              Your playlists
            </div>

            {playlists.length === 0 ? (
              <div style={panelStyles.empty}>
                Abhi koi playlist nahi hai.
              </div>
            ) : (
              playlists.map((playlist) => (
                <div
                  key={playlist.id}
                  style={{
                    display: "flex",
                    gap: 6,
                    alignItems: "stretch",
                    marginBottom: 7,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => openPlaylist(playlist)}
                    style={{
                      ...panelStyles.playlistItem,
                      flex: 1,
                      ...(selected?.id === playlist.id
                        ? panelStyles.playlistActive
                        : {}),
                    }}
                  >
                    <span>♫</span>
                    <span>{playlist.name}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => removePlaylist(playlist)}
                    disabled={busy}
                    title="Delete playlist"
                    style={{
                      border:
                        "1px solid rgba(30,25,20,.14)",
                      borderRadius: 10,
                      background:
                        "rgba(255,255,255,.35)",
                      color: "#6b2b24",
                      width: 40,
                      cursor: "pointer",
                    }}
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>

          <div>
            <div style={panelStyles.sectionTitle}>
              {selected
                ? selected.name
                : "Select a playlist"}
            </div>

            {selected ? (
              <>
                <button
                  type="button"
                  onClick={addCurrentSong}
                  disabled={busy || !currentTrack}
                  style={{
                    ...panelStyles.addSong,
                    opacity: busy ? 0.6 : 1,
                  }}
                >
                  + Add current song
                </button>

                {songs.length ? (
                  songs.map((song) => (
                    <div
                      key={song.id}
                      style={{
                        ...panelStyles.songItem,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <div>
                        <strong>
                          {song.song_name}
                        </strong>

                        <small
                          style={{
                            display: "block",
                            opacity: 0.55,
                            marginTop: 3,
                          }}
                        >
                          {song.artist}
                        </small>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeSong(song)}
                        disabled={busy}
                        title="Remove song"
                        style={{
                          border:
                            "1px solid rgba(30,25,20,.14)",
                          borderRadius: 9,
                          background:
                            "rgba(255,255,255,.35)",
                          color: "#6b2b24",
                          width: 34,
                          height: 34,
                          cursor: "pointer",
                          flexShrink: 0,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))
                ) : (
                  <div style={panelStyles.empty}>
                    Playlist empty hai.
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => onPlayPlaylist(songs)}
                  disabled={!songs.length}
                  style={panelStyles.playPlaylist}
                >
                  ▶ Play this playlist
                </button>
              </>
            ) : (
              <div style={panelStyles.empty}>
                Left side se playlist choose karo.
              </div>
            )}
          </div>
        </div>

        {message && (
          <div style={panelStyles.error}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}


/* =========================================================
   TIME-BASED HERO TEXT
   ========================================================= */

function getTimePhrase() {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return "की सुबह";
  }

  if (hour >= 12 && hour < 17) {
    return "की दोपहर";
  }

  if (hour >= 17 && hour < 21) {
    return "की शाम";
  }

  return "की रात";
}

function getFirstName(profile) {
  const value =
    profile?.display_name ||
    profile?.username ||
    "Priyam";

  return String(value).trim().split(/\s+/)[0] || "Priyam";
}

/* =========================================================
   MAIN APP
   ========================================================= */

function getStoredNumber(key, fallback) {
  try {
    const value = Number(localStorage.getItem(key));
    return Number.isFinite(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

function getStoredPlayback() {
  try {
    const raw = localStorage.getItem("pf_playback_state");
    const parsed = raw ? JSON.parse(raw) : null;

    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    return {
      trackId: String(parsed.trackId || ""),
      position: Math.max(0, Number(parsed.position) || 0),
    };
  } catch {
    return null;
  }
}

function App() {

  const [timePhrase, setTimePhrase] =
    useState(getTimePhrase);

  const playerRef =
    useRef(null);

  const sceneRef =
    useRef(null);

  const indexRef =
    useRef(0);

  const tracksRef =
    useRef([]);


  const [tracks, setTracks] =
    useState([]);

  const [index, setIndex] =
    useState(0);

  const [ready, setReady] =
    useState(false);

  const [playing, setPlaying] =
    useState(false);

  const [progress, setProgress] =
    useState(0);

  const [elapsed, setElapsed] =
    useState("0:00");

  const [duration, setDuration] =
    useState("0:00");

  const [volume, setVolume] =
    useState(() =>
      Math.min(
        100,
        Math.max(
          0,
          getStoredNumber("pf_volume", 80)
        )
      )
    );

  const previousVolumeRef =
    useRef(80);

  const [queueOpen, setQueueOpen] =
    useState(false);

  const [liked, setLiked] =
    useState(false);

  const [error, setError] =
    useState("");

  const [queueFocusIndex, setQueueFocusIndex] =
    useState(0);

  const playbackRestoreRef =
    useRef(getStoredPlayback());

  const lastPlaybackSaveRef =
    useRef(0);


  /* =======================================================
     BACKGROUND MOTION
     - Very slow cinematic zoom
     - Subtle mouse parallax on desktop
     - No layout movement
     ======================================================= */

  useEffect(() => {
    const scene = sceneRef.current;

    if (!scene) {
      return;
    }

    const reducedMotion =
      window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      );

    const finePointer =
      window.matchMedia(
        "(hover: hover) and (pointer: fine)"
      );

    if (
      reducedMotion.matches ||
      !finePointer.matches
    ) {
      scene.style.setProperty(
        "--parallax-x",
        "0px"
      );

      scene.style.setProperty(
        "--parallax-y",
        "0px"
      );

      return;
    }

    let frame = null;

    const handlePointerMove = (event) => {
      const x =
        ((event.clientX / window.innerWidth) - 0.5) * 10;

      const y =
        ((event.clientY / window.innerHeight) - 0.5) * 7;

      if (frame) {
        cancelAnimationFrame(frame);
      }

      frame = requestAnimationFrame(() => {
        scene.style.setProperty(
          "--parallax-x",
          `${x.toFixed(2)}px`
        );

        scene.style.setProperty(
          "--parallax-y",
          `${y.toFixed(2)}px`
        );
      });
    };

    const resetPointer = () => {
      if (frame) {
        cancelAnimationFrame(frame);
      }

      frame = requestAnimationFrame(() => {
        scene.style.setProperty(
          "--parallax-x",
          "0px"
        );

        scene.style.setProperty(
          "--parallax-y",
          "0px"
        );
      });
    };

    window.addEventListener(
      "pointermove",
      handlePointerMove,
      { passive: true }
    );

    window.addEventListener(
      "blur",
      resetPointer
    );

    return () => {
      if (frame) {
        cancelAnimationFrame(frame);
      }

      window.removeEventListener(
        "pointermove",
        handlePointerMove
      );

      window.removeEventListener(
        "blur",
        resetPointer
      );
    };
  }, []);


  /* AUTH */

  // Restore the last known account immediately so the main UI
  // can render without showing a separate loading screen.
  const getStoredUser = () => {
    try {
      return JSON.parse(
        localStorage.getItem("pf_user") || "null"
      );
    } catch {
      return null;
    }
  };

  const storedUser = getStoredUser();

  const storedToken =
    localStorage.getItem("pf_access_token") || "";

  const initialProfile = storedUser
    ? {
        id: storedUser.id,
        username:
          storedUser.user_metadata?.username ||
          storedUser.email?.split("@")[0] ||
          "user",
        display_name:
          storedUser.user_metadata?.display_name ||
          storedUser.user_metadata?.username ||
          "Priyam",
        background_id: 5,
      }
    : null;

  const [user, setUser] =
    useState(storedUser);

  const [token, setToken] =
    useState(storedToken);

  const [profile, setProfile] =
    useState(initialProfile);


  /* PANELS */

  const [
    profileOpen,
    setProfileOpen,
  ] = useState(false);

  const [
    playlistOpen,
    setPlaylistOpen,
  ] = useState(false);

  const [
    playlistHubOpen,
    setPlaylistHubOpen,
  ] = useState(false);


  useEffect(() => {
    const updateTimePhrase = () => {
      setTimePhrase(getTimePhrase());
    };

    updateTimePhrase();

    const timer = setInterval(
      updateTimePhrase,
      60000
    );

    return () => clearInterval(timer);
  }, []);


  /* =======================================================
     FORMAT TIME
     ======================================================= */

  const formatTime =
    (seconds) => {
      const s =
        Math.max(
          0,
          Math.floor(
            Number(seconds) ||
              0
          )
        );

      return `${
        Math.floor(s / 60)
      }:${
        String(
          s % 60
        ).padStart(2, "0")
      }`;
    };


  /* =======================================================
     ACCOUNT
     ======================================================= */

  const loadAccount =
    async (
      accountUser,
      accessToken
    ) => {

      try {

        let existing =
          await getProfile(
            accountUser.id,
            accessToken
          );


        if (!existing) {

          const created =
            await saveProfile(
              {
                id:
                  accountUser.id,

                username:
                  accountUser
                    .user_metadata
                    ?.username ||
                  accountUser.email
                    ?.split("@")[0] ||
                  "user",

                display_name:
                  accountUser
                    .user_metadata
                    ?.display_name ||
                  accountUser
                    .user_metadata
                    ?.username ||
                  "Priyam",

                background_id:
                  5,
              },
              accessToken
            );

          existing =
            created?.[0];
        }



        // Old background IDs belonged to the removed background set.
        // Keep the new village (bg5) as the safe primary background.
        if (
          existing &&
          Number(existing.background_id) >= 1 &&
          Number(existing.background_id) <= 4
        ) {
          try {
            const migrated = await saveProfile(
              {
                id: accountUser.id,
                username: existing.username,
                display_name: existing.display_name,
                background_id: 5,
              },
              accessToken
            );

            existing = migrated?.[0] || {
              ...existing,
              background_id: 5,
            };
          } catch (migrationError) {
            console.warn(
              "Background migration failed:",
              migrationError
            );
            existing = {
              ...existing,
              background_id: 5,
            };
          }
        }

        setProfile(
          existing || {
            id:
              accountUser.id,

            username:
              accountUser
                .user_metadata
                ?.username ||
              "user",

            display_name:
              accountUser
                .user_metadata
                ?.display_name ||
              "Priyam",

            background_id:
              5,
          }
        );

      }

      catch (e) {

        console.error(e);

        setProfile({
          id:
            accountUser.id,

          username:
            accountUser
              .user_metadata
              ?.username ||
            "user",

          display_name:
            accountUser
              .user_metadata
              ?.display_name ||
            "Priyam",

          background_id:
            5,
        });
      }
    };


  /* =======================================================
     RESTORE LOGIN
     ======================================================= */

  useEffect(() => {

    const boot =
      async () => {

        const storedRefresh =
          localStorage.getItem(
            "pf_refresh_token"
          );

        const storedAccess =
          localStorage.getItem(
            "pf_access_token"
          );


        try {

          let session =
            null;


          if (
            storedRefresh
          ) {

            session =
              await supabaseRequest(
                "/auth/v1/token?grant_type=refresh_token",
                {
                  method: "POST",

                  body:
                    JSON.stringify({
                      refresh_token:
                        storedRefresh,
                    }),
                }
              );

          }

          else if (
            storedAccess
          ) {

            const storedUser =
              JSON.parse(
                localStorage.getItem(
                  "pf_user"
                ) || "null"
              );


            if (storedUser) {

              session = {
                access_token:
                  storedAccess,

                user:
                  storedUser,
              };

            }

          }


          if (
            session?.access_token &&
            session?.user
          ) {

            localStorage.setItem(
              "pf_access_token",
              session.access_token
            );


            if (
              session.refresh_token
            ) {

              localStorage.setItem(
                "pf_refresh_token",
                session.refresh_token
              );

            }


            localStorage.setItem(
              "pf_user",
              JSON.stringify(
                session.user
              )
            );


            setToken(
              session.access_token
            );

            setUser(
              session.user
            );


            await loadAccount(
              session.user,
              session.access_token
            );

          }

        }

        catch {

          localStorage.removeItem(
            "pf_access_token"
          );

          localStorage.removeItem(
            "pf_refresh_token"
          );

          localStorage.removeItem(
            "pf_user"
          );

        }
};


    boot();

  }, []);


  /* =======================================================
     LOGOUT
     ======================================================= */

  const logout =
    () => {

      localStorage.removeItem(
        "pf_access_token"
      );

      localStorage.removeItem(
        "pf_refresh_token"
      );

      localStorage.removeItem(
        "pf_user"
      );


      setUser(null);
      setToken("");
      setProfile(null);

      setProfileOpen(false);
      setPlaylistOpen(false);
      setPlaylistHubOpen(false);
    };


  /* =======================================================
     SAVE PROFILE
     ======================================================= */

  const saveProfileChanges =
    async (
      changes
    ) => {

      const result =
        await saveProfile(
          {
            id:
              user.id,

            username:
              profile.username,

            ...changes,
          },
          token
        );


      setProfile(
        result?.[0] || {
          ...profile,
          ...changes,
        }
      );
    };


  /* =======================================================
     LOAD SONGS FROM THIS USER'S PLAYLISTS
     ======================================================= */

  const refreshSongs =
    async () => {

      if (!user || !token) {
        return;
      }

      try {
        const songs =
          await loadUserSongs(
            user.id,
            token
          );

        /* Preserve the song that is currently playing when the
           playlist is refreshed. The old code always forced index 0,
           which made the player jump back to the first song after a
           refresh even though another song was still playing. */
        const currentSongId =
          tracksRef.current?.[indexRef.current]?.id ||
          null;

        const preservedIndex =
          currentSongId
            ? songs.findIndex(
                (song) => song.id === currentSongId
              )
            : -1;

        const storedPlayback =
          playbackRestoreRef.current ||
          getStoredPlayback();

        const restoredIndex =
          storedPlayback?.trackId
            ? songs.findIndex(
                (song) => song.id === storedPlayback.trackId
              )
            : -1;

        const safeIndex =
          preservedIndex >= 0
            ? preservedIndex
            : restoredIndex >= 0
              ? restoredIndex
              : 0;

        const hadCurrentSong =
          Boolean(currentSongId) &&
          preservedIndex >= 0;

        tracksRef.current =
          songs;

        indexRef.current =
          safeIndex;

        setTracks(
          songs
        );

        setIndex(
          safeIndex
        );

        setQueueFocusIndex(safeIndex);

        /* If the currently playing song still exists, do NOT reload
           YouTube. This keeps playback and the visible song title in
           sync. Only load a song when the old one disappeared. */
        if (
          !hadCurrentSong &&
          songs.length &&
          playerRef.current
        ) {
          playerRef.current.loadVideoById({
            videoId: songs[safeIndex].id,
            startSeconds:
              restoredIndex === safeIndex && storedPlayback
                ? storedPlayback.position
                : 0,
          });
        }

        if (!songs.length) {
          // An empty playlist is a normal state for a new account.
          // Keep the complete website UI visible and show the instruction
          // only inside the video player area.
          setError("");
          playerRef.current?.stopVideo?.();
        } else {
          setError("");
        }
} catch (err) {
        console.error(err);

        setError(
          err?.message ||
          "Tumhari playlists se songs load nahi ho sake."
        );
}
    };


  useEffect(() => {

    if (!user || !token)
      return;


    /* Let the first ZUNO UI paint before fetching playlist data. */
    const runInitialSongLoad =
      () => {
        refreshSongs();
      };


    let cleanupInitialLoad;


    if (
      "requestIdleCallback" in window
    ) {

      const idleId =
        window.requestIdleCallback(
          runInitialSongLoad,
          {
            timeout: 1200,
          }
        );


      cleanupInitialLoad =
        () =>
          window.cancelIdleCallback(
            idleId
          );

    }

    else {

      const frameId =
        window.requestAnimationFrame(
          runInitialSongLoad
        );


      cleanupInitialLoad =
        () =>
          window.cancelAnimationFrame(
            frameId
          );

    }


    const interval =
      setInterval(
        refreshSongs,
        60000
      );


    return () => {

      cleanupInitialLoad?.();

      clearInterval(
        interval
      );

    };

  }, [user, token]);


  /* =======================================================
     ESCAPE / BODY LOCK
     ======================================================= */

  useEffect(() => {

    const handleEscape =
      (event) => {

        if (
          event.key === "Escape"
        ) {

          setQueueOpen(false);
          setProfileOpen(false);
          setPlaylistOpen(false);
          setPlaylistHubOpen(false);

        }
      };


    document.addEventListener(
      "keydown",
      handleEscape
    );


    return () =>
      document.removeEventListener(
        "keydown",
        handleEscape
      );

  }, []);


  useEffect(() => {

    document.body.style.overflow =
      queueOpen ||
      profileOpen ||
      playlistOpen ||
      playlistHubOpen ||
      !user
        ? "hidden"
        : "";


    return () => {
      document.body.style.overflow =
        "";
    };

  }, [
    queueOpen,
    profileOpen,
    playlistOpen,
    playlistHubOpen,
    user,
  ]);


  /* =======================================================
     CHANGE TRACK
     ======================================================= */

  const changeTrack =
    (
      nextIndex,
      autoplay = true
    ) => {

      const songs =
        tracksRef.current;


      if (!songs.length)
        return;


      const safeIndex =
        (
          nextIndex +
          songs.length
        ) %
        songs.length;


      indexRef.current =
        safeIndex;

      setIndex(
        safeIndex
      );

      setQueueFocusIndex(safeIndex);

      try {
        localStorage.setItem(
          "pf_playback_state",
          JSON.stringify({
            trackId: songs[safeIndex].id,
            position: 0,
          })
        );
      } catch {
        // Ignore storage failures. Playback should continue normally.
      }

      playbackRestoreRef.current = null;
      setLiked(false);

      setProgress(0);
      setElapsed("0:00");
      setDuration("0:00");


      const player =
        playerRef.current;


      if (!player)
        return;


      player.loadVideoById({
        videoId:
          songs[
            safeIndex
          ].id,

        startSeconds: 0,
      });


      if (!autoplay) {
        player.pauseVideo();
      }


      setQueueOpen(false);
    };


  /* =======================================================
     YOUTUBE PLAYER
     ======================================================= */

  useEffect(() => {

    if (
      !tracks.length ||
      !user
    ) {
      return;
    }


    let cancelled =
      false;


    const interval =
      setInterval(
        () => {

          const player =
            playerRef.current;


          if (
            !player?.getDuration
          ) {
            return;
          }


          const total =
            player.getDuration() ||
            0;

          const current =
            player.getCurrentTime() ||
            0;


          setProgress(
            total
              ? (
                  current /
                  total
                ) *
                100
              : 0
          );


          setElapsed(
            formatTime(
              current
            )
          );


          setDuration(
            formatTime(
              total
            )
          );

          // Persist the current song and position without hammering storage.
          const now = Date.now();
          if (now - lastPlaybackSaveRef.current >= 2000) {
            const activeTrack =
              tracksRef.current[indexRef.current];

            if (activeTrack?.id) {
              try {
                localStorage.setItem(
                  "pf_playback_state",
                  JSON.stringify({
                    trackId: activeTrack.id,
                    position: current,
                  })
                );
                lastPlaybackSaveRef.current = now;
              } catch {
                // Ignore storage failures.
              }
            }
          }

        },
        500
      );


    loadYouTubeAPI()
      .then((YT) => {

        if (
          cancelled ||
          playerRef.current
        ) {
          return;
        }


        playerRef.current =
          new YT.Player(
            "youtube-player",
            {

              videoId:
                tracks[indexRef.current]?.id || tracks[0].id,

              playerVars: {
                playsinline: 1,
                controls: 1,
                rel: 0,
                iv_load_policy: 3,
                modestbranding: 1,

                origin:
                  window.location
                    .origin,
              },


              events: {

                onReady:
                  (event) => {

                    setReady(true);

                    event.target.setVolume(
                      volume
                    );

                    const restored =
                      playbackRestoreRef.current;
                    const activeTrack =
                      tracksRef.current[indexRef.current];

                    if (
                      restored?.trackId &&
                      restored.trackId === activeTrack?.id &&
                      restored.position > 0
                    ) {
                      event.target.seekTo(
                        restored.position,
                        true
                      );
                    }

                    playbackRestoreRef.current = null;
                  },


                onStateChange:
                  (event) => {

                    setPlaying(
                      event.data ===
                        YT.PlayerState
                          .PLAYING
                    );


                    if (
                      event.data ===
                        YT.PlayerState
                          .ENDED &&
                      tracksRef.current
                        .length
                    ) {

                      changeTrack(
                        (
                          indexRef.current +
                          1
                        ) %
                          tracksRef.current
                            .length,

                        true
                      );
                    }

                  },

              },

            }
          );

      });


    return () => {

      cancelled = true;

      clearInterval(
        interval
      );

    };

  }, [
    tracks.length,
    user,
  ]);


  /* =======================================================
     PLAYER CONTROLS
     ======================================================= */

  const togglePlay =
    () => {

      if (
        !ready ||
        !playerRef.current
      ) {
        return;
      }


      if (playing) {

        playerRef.current
          .pauseVideo();

      }

      else {

        playerRef.current
          .playVideo();

      }
    };


  /* =======================================================
     KEYBOARD CONTROLS
     Space = play / pause
     Left / Right = previous / next song
     Shift + Left / Right = seek 10 seconds
     Up / Down = volume
     M = mute / restore volume
     0 = restart current song
     F = open/focus playlists
     P = open the queue
     Queue open: Up / Down = select, Enter = play
     Esc = already handled above for closing panels
     ======================================================= */
  useEffect(() => {
    const handleKeyboard = (event) => {
      const target = event.target;
      const tagName = target?.tagName?.toLowerCase();

      // Never hijack typing inside inputs, textareas, selects,
      // or contenteditable elements.
      if (
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select" ||
        target?.isContentEditable
      ) {
        return;
      }

      const key = event.key.toLowerCase();

      if (event.key === " ") {
        event.preventDefault();
        togglePlay();
        return;
      }

      // When the queue is open, arrow keys navigate the queue instead
      // of changing the song immediately. Enter plays the highlighted one.
      if (queueOpen) {
        if (event.key === "ArrowUp" || event.key === "ArrowDown") {
          event.preventDefault();

          if (!tracksRef.current.length) return;

          const direction = event.key === "ArrowDown" ? 1 : -1;
          const next =
            (queueFocusIndex + direction + tracksRef.current.length) %
            tracksRef.current.length;

          setQueueFocusIndex(next);
          return;
        }

        if (event.key === "Enter") {
          event.preventDefault();
          if (tracksRef.current[queueFocusIndex]) {
            changeTrack(queueFocusIndex, true);
          }
          return;
        }
      }

      if (event.key === "ArrowLeft" && event.shiftKey) {
        event.preventDefault();
        if (ready && playerRef.current?.getCurrentTime) {
          const current = playerRef.current.getCurrentTime() || 0;
          playerRef.current.seekTo(Math.max(0, current - 10), true);
        }
        return;
      }

      if (event.key === "ArrowRight" && event.shiftKey) {
        event.preventDefault();
        if (ready && playerRef.current?.getCurrentTime) {
          const current = playerRef.current.getCurrentTime() || 0;
          const total = playerRef.current.getDuration() || 0;
          playerRef.current.seekTo(
            Math.min(total || Infinity, current + 10),
            true
          );
        }
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        changeTrack(indexRef.current - 1);
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        changeTrack(indexRef.current + 1);
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        const nextVolume = Math.min(100, volume + 5);
        setVolume(nextVolume);
        playerRef.current?.setVolume(nextVolume);
        if (nextVolume > 0) {
          previousVolumeRef.current = nextVolume;
        }
        try {
          localStorage.setItem("pf_volume", String(nextVolume));
        } catch {
          // Ignore storage failures.
        }
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        const nextVolume = Math.max(0, volume - 5);
        setVolume(nextVolume);
        playerRef.current?.setVolume(nextVolume);
        if (nextVolume > 0) {
          previousVolumeRef.current = nextVolume;
        }
        try {
          localStorage.setItem("pf_volume", String(nextVolume));
        } catch {
          // Ignore storage failures.
        }
        return;
      }

      if (key === "m") {
        event.preventDefault();

        if (volume > 0) {
          previousVolumeRef.current = volume;
          setVolume(0);
          playerRef.current?.setVolume(0);
          try {
            localStorage.setItem("pf_volume", "0");
          } catch {
            // Ignore storage failures.
          }
        } else {
          const restoredVolume =
            previousVolumeRef.current > 0
              ? previousVolumeRef.current
              : 80;

          setVolume(restoredVolume);
          playerRef.current?.setVolume(restoredVolume);
          try {
            localStorage.setItem("pf_volume", String(restoredVolume));
          } catch {
            // Ignore storage failures.
          }
        }
        return;
      }

      if (key === "0") {
        event.preventDefault();
        if (ready && playerRef.current?.seekTo) {
          playerRef.current.seekTo(0, true);
        }
        return;
      }

      if (key === "f") {
        event.preventDefault();
        setPlaylistHubOpen(true);
        return;
      }

      if (key === "p") {
        event.preventDefault();
        setQueueFocusIndex(indexRef.current);
        setQueueOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyboard);

    return () => {
      window.removeEventListener("keydown", handleKeyboard);
    };
  }, [
    playing,
    ready,
    volume,
    queueOpen,
    queueFocusIndex,
    tracks.length,
  ]);

  const seek =
    (event) => {

      if (
        !ready ||
        !playerRef.current
      ) {
        return;
      }


      const rect =
        event.currentTarget
          .getBoundingClientRect();


      const ratio =
        Math.min(
          1,
          Math.max(
            0,
            (
              event.clientX -
              rect.left
            ) /
              rect.width
          )
        );


      const total =
        playerRef.current
          .getDuration() || 0;


      playerRef.current.seekTo(
        total * ratio,
        true
      );
    };


  /* =======================================================
     PLAYLIST PLAYER
     ======================================================= */

  const playPlaylist =
    (songs) => {

      if (
        !songs?.length
      ) {
        return;
      }


      const mapped =
        songs.map(
          (song) => ({
            id:
              song.youtube_id,

            title:
              song.song_name,

            artist:
              song.artist,
          })
        );


      tracksRef.current =
        mapped;

      setTracks(
        mapped
      );

      indexRef.current =
        0;

      setIndex(0);
      setQueueFocusIndex(0);
      playbackRestoreRef.current = null;

      try {
        localStorage.setItem(
          "pf_playback_state",
          JSON.stringify({
            trackId: mapped[0].id,
            position: 0,
          })
        );
      } catch {
        // Ignore storage failures.
      }

      setPlaylistOpen(
        false
      );

      setPlaylistHubOpen(
        false
      );

      setQueueOpen(
        false
      );


      setTimeout(
        () => {

          if (
            playerRef.current
          ) {

            playerRef.current
              .loadVideoById(
                mapped[0].id
              );

          }

        },
        100
      );
    };


  /* =======================================================
     SAVE PLAYBACK STATE ON PAGE EXIT
     ======================================================= */
  useEffect(() => {
    const savePlaybackState = () => {
      const activeTrack = tracksRef.current[indexRef.current];
      const player = playerRef.current;

      if (!activeTrack?.id) return;

      const position =
        player?.getCurrentTime?.() ||
        getStoredPlayback()?.position ||
        0;

      try {
        localStorage.setItem(
          "pf_playback_state",
          JSON.stringify({
            trackId: activeTrack.id,
            position,
          })
        );
      } catch {
        // Ignore storage failures.
      }
    };

    window.addEventListener("pagehide", savePlaybackState);
    window.addEventListener("beforeunload", savePlaybackState);

    return () => {
      window.removeEventListener("pagehide", savePlaybackState);
      window.removeEventListener("beforeunload", savePlaybackState);
    };
  }, []);


  /* =======================================================
     MEDIA SESSION
     Lets Chromebook / headset media keys control ZUNO.
     ======================================================= */
  useEffect(() => {
    if (!("mediaSession" in navigator)) {
      return;
    }

    const mediaSession = navigator.mediaSession;

    try {
      const activeTrack = tracksRef.current[indexRef.current];

      if (activeTrack) {
        mediaSession.metadata = new MediaMetadata({
          title: activeTrack.title || "ZUNO",
          artist: activeTrack.artist || "ZUNO",
          album: "P's favourites",
        });
      }

      mediaSession.playbackState = playing ? "playing" : "paused";

      mediaSession.setActionHandler("play", () => {
        playerRef.current?.playVideo?.();
      });

      mediaSession.setActionHandler("pause", () => {
        playerRef.current?.pauseVideo?.();
      });

      mediaSession.setActionHandler("previoustrack", () => {
        changeTrack(indexRef.current - 1);
      });

      mediaSession.setActionHandler("nexttrack", () => {
        changeTrack(indexRef.current + 1);
      });

      mediaSession.setActionHandler("seekbackward", (details) => {
        const current = playerRef.current?.getCurrentTime?.() || 0;
        const offset = details.seekOffset || 10;
        playerRef.current?.seekTo?.(
          Math.max(0, current - offset),
          true
        );
      });

      mediaSession.setActionHandler("seekforward", (details) => {
        const current = playerRef.current?.getCurrentTime?.() || 0;
        const total = playerRef.current?.getDuration?.() || 0;
        const offset = details.seekOffset || 10;
        playerRef.current?.seekTo?.(
          Math.min(total || Infinity, current + offset),
          true
        );
      });
    } catch {
      // Some browsers expose Media Session but not every action handler.
    }
  }, [playing, tracks.length, index]);


  /* =======================================================
     LOGIN
     ======================================================= */

  if (
    !user ||
    !profile
  ) {

    return (
      <AuthScreen
        onAuthenticated={
          async (
            accountUser,
            accessToken
          ) => {

            setToken(
              accessToken
            );

            setUser(
              accountUser
            );

            await loadAccount(
              accountUser,
              accessToken
            );

          }
        }
      />
    );
  }


  /* =======================================================
     BACKGROUND
     ======================================================= */

  const bg =
    BACKGROUNDS[
      (
        Number(
          profile.background_id
        ) || 5
      ) - 1
    ] ||
    BACKGROUNDS[4];


  /* =======================================================
     ERROR
     ======================================================= */

  if (error) {

    return (
      <div
        className="scene"
        ref={sceneRef}
        style={{
          "--scene-background":
            `linear-gradient(90deg,rgba(5,10,9,.22),rgba(5,8,8,.02) 48%,rgba(5,8,8,.14)),url(${bg.value})`,
        }}
      >

        <div
          style={{
            minHeight:
              "100vh",

            display:
              "flex",

            alignItems:
              "center",

            justifyContent:
              "center",

            color:
              "#f5dfb7",

            fontSize:
              18,
          }}
        >
          {error}
        </div>

      </div>
    );
  }


  const currentTrack =
    tracks[index];


  /* =======================================================
     MAIN UI
     ======================================================= */

  return (

    <div className="site">


        {/* ANIMATION STYLES */}
        <style>{`
          .ambient-effects{
            position:absolute;
            inset:0;
            z-index:0;
            pointer-events:none;
            overflow:hidden;
          }

          .ambient-glow{
            position:absolute;
            width:42vw;
            height:42vw;
            min-width:320px;
            min-height:320px;
            border-radius:50%;
            filter:blur(70px);
            opacity:.16;
            mix-blend-mode:screen;
            will-change:transform;
          }

          .ambient-glow-one{
            top:-18%;
            left:-12%;
            background:radial-gradient(circle,rgba(255,196,116,.72) 0%,rgba(255,196,116,0) 68%);
            animation:pfAmbientGlowOne 20s ease-in-out infinite alternate;
          }

          .ambient-glow-two{
            right:-16%;
            bottom:-20%;
            background:radial-gradient(circle,rgba(132,183,255,.48) 0%,rgba(132,183,255,0) 68%);
            animation:pfAmbientGlowTwo 24s ease-in-out infinite alternate;
          }

          .ambient-vignette{
            position:absolute;
            inset:0;
            background:radial-gradient(circle at 50% 48%,transparent 34%,rgba(4,7,7,.18) 100%);
          }

          .ambient-particles{
            position:absolute;
            inset:0;
          }

          .ambient-particle{
            position:absolute;
            left:var(--particle-x);
            top:var(--particle-y);
            width:var(--particle-size);
            height:var(--particle-size);
            border-radius:50%;
            background:rgba(255,235,196,.72);
            box-shadow:0 0 10px rgba(255,220,164,.32);
            opacity:0;
            animation:pfParticleFloat var(--particle-duration) ease-in-out var(--particle-delay) infinite;
          }

          .music-visualizer{
            display:flex;
            align-items:center;
            justify-content:center;
            gap:3px;
            width:58px;
            height:30px;
            margin:0 2px;
            opacity:.48;
            transition:opacity .35s ease,transform .35s ease;
            flex-shrink:0;
          }

          .music-visualizer.is-playing{
            opacity:.95;
            transform:translateY(-1px);
          }

          .music-visualizer.is-idle{
            opacity:.24;
          }

          .visualizer-bar{
            display:block;
            width:3px;
            height:var(--bar-height);
            max-height:24px;
            border-radius:999px;
            background:currentColor;
            transform:scaleY(.22);
            transform-origin:center;
            transition:transform .35s ease;
          }

          .music-visualizer.is-playing .visualizer-bar{
            animation:pfVisualizer .72s ease-in-out var(--bar-delay) infinite alternate;
          }

          @keyframes pfAmbientGlowOne{
            0%{transform:translate3d(-3%,0,0) scale(.96);}
            50%{transform:translate3d(12%,9%,0) scale(1.08);}
            100%{transform:translate3d(4%,18%,0) scale(1);}
          }

          @keyframes pfAmbientGlowTwo{
            0%{transform:translate3d(4%,5%,0) scale(1);}
            50%{transform:translate3d(-10%,-8%,0) scale(1.08);}
            100%{transform:translate3d(-3%,-16%,0) scale(.96);}
          }

          @keyframes pfParticleFloat{
            0%{
              opacity:0;
              transform:translate3d(0,12px,0) scale(.72);
            }
            18%{opacity:.28;}
            50%{
              opacity:.55;
              transform:translate3d(12px,-24px,0) scale(1);
            }
            82%{opacity:.2;}
            100%{
              opacity:0;
              transform:translate3d(-8px,-52px,0) scale(.65);
            }
          }

          @keyframes pfVisualizer{
            0%{transform:scaleY(.18);}
            25%{transform:scaleY(.58);}
            50%{transform:scaleY(1);}
            75%{transform:scaleY(.42);}
            100%{transform:scaleY(.82);}
          }


          .site .scene > *:not(.ambient-effects){
            position:relative;
            z-index:1;
          }

          @media (max-width:700px){
            .ambient-glow{
              filter:blur(55px);
              opacity:.12;
            }

            .music-visualizer{
              width:44px;
              gap:2px;
            }

            .visualizer-bar{
              width:2.5px;
              max-height:20px;
            }

            .ambient-particle:nth-child(n+13){
              display:none;
            }
          }

          @media (prefers-reduced-motion:reduce){
            .ambient-glow-one,
            .ambient-glow-two,
            .ambient-particle,
            .music-visualizer.is-playing .visualizer-bar{
              animation:none !important;
            }

            .ambient-particle{
              opacity:.12;
              transform:none;
            }
          }
        `}</style>

      <div
        className="scene"
        ref={sceneRef}
        style={{
          "--scene-background":
            `linear-gradient(90deg,rgba(5,10,9,.22),rgba(5,8,8,.02) 48%,rgba(5,8,8,.14)),url(${bg.value})`,
        }}
      >

        {/* AMBIENT BACKGROUND ANIMATION */}
        <div className="ambient-effects" aria-hidden="true">
          <div className="ambient-glow ambient-glow-one" />
          <div className="ambient-glow ambient-glow-two" />
          <div className="ambient-vignette" />
          <div className="ambient-particles">
            {Array.from({ length: 18 }).map((_, particleIndex) => (
              <span
                key={particleIndex}
                className="ambient-particle"
                style={{
                  "--particle-x": `${6 + ((particleIndex * 37) % 88)}%`,
                  "--particle-y": `${12 + ((particleIndex * 19) % 76)}%`,
                  "--particle-delay": `${(particleIndex * 0.73) % 8}s`,
                  "--particle-duration": `${8 + ((particleIndex * 1.7) % 7)}s`,
                  "--particle-size": `${2 + (particleIndex % 3)}px`,
                }}
              />
            ))}
          </div>
        </div>

        {/* NAV */}

        <style>{`
          .zuno-nav{
            position:relative !important;
            z-index:20 !important;
            display:flex !important;
            align-items:center !important;
            justify-content:space-between !important;
            gap:24px !important;
            width:100% !important;
            box-sizing:border-box !important;
            padding:18px 42px !important;
          }

          .zuno-nav::after{
            content:"";
            position:absolute;
            left:42px;
            right:42px;
            bottom:0;
            height:1px;
            background:linear-gradient(90deg,transparent,rgba(255,255,255,.18),transparent);
            opacity:.7;
            pointer-events:none;
          }

          .zuno-nav-brand{
            position:relative;
            display:inline-flex;
            align-items:center;
            color:#fff;
            text-decoration:none;
            letter-spacing:3px;
            font-size:20px;
            font-weight:900;
            text-shadow:0 2px 18px rgba(0,0,0,.45);
            transition:transform .35s ease,letter-spacing .35s ease,opacity .35s ease;
          }

          .zuno-nav-brand::after{
            content:"";
            position:absolute;
            left:0;
            bottom:-7px;
            width:0;
            height:2px;
            border-radius:999px;
            background:#fff;
            box-shadow:0 0 12px rgba(255,255,255,.55);
            transition:width .35s ease;
          }

          .zuno-nav-brand:hover{
            transform:translateY(-1px);
            letter-spacing:5px;
          }

          .zuno-nav-brand:hover::after{
            width:100%;
          }

          .zuno-nav-actions{
            display:flex;
            align-items:center;
            justify-content:flex-end;
            gap:8px;
            padding:5px;
            border:1px solid rgba(255,255,255,.16);
            border-radius:999px;
            background:rgba(8,8,8,.18);
            box-shadow:0 12px 35px rgba(0,0,0,.16),inset 0 1px 0 rgba(255,255,255,.08);
            backdrop-filter:blur(14px) saturate(125%);
            -webkit-backdrop-filter:blur(14px) saturate(125%);
            transition:background .35s ease,border-color .35s ease,transform .35s ease;
          }

          .zuno-nav-actions:hover{
            background:rgba(8,8,8,.28);
            border-color:rgba(255,255,255,.24);
            transform:translateY(-1px);
          }

          .zuno-nav-action{
            position:relative;
            display:inline-flex;
            align-items:center;
            justify-content:center;
            min-height:36px;
            padding:0 14px;
            border:1px solid transparent;
            border-radius:999px;
            background:transparent;
            color:rgba(255,255,255,.9);
            cursor:pointer;
            font-size:12px;
            font-weight:800;
            letter-spacing:.1px;
            text-shadow:0 1px 10px rgba(0,0,0,.35);
            transition:background .28s ease,border-color .28s ease,color .28s ease,transform .28s ease;
          }

          .zuno-nav-action:hover{
            background:rgba(255,255,255,.11);
            border-color:rgba(255,255,255,.18);
            color:#fff;
            transform:translateY(-1px);
          }

          .zuno-nav-action:active{
            transform:translateY(0) scale(.97);
          }

          .zuno-playlist-trigger{
            gap:7px;
            border-color:rgba(255,255,255,.14);
            background:rgba(255,255,255,.07);
            box-shadow:0 0 0 1px rgba(255,255,255,.025),0 0 18px rgba(255,220,185,.08);
          }

          .zuno-playlist-trigger-dot{
            width:6px;
            height:6px;
            border-radius:50%;
            background:#fff;
            box-shadow:0 0 7px rgba(255,244,225,.95),0 0 15px rgba(255,207,158,.55);
            animation:zunoPlaylistDot 2.4s ease-in-out infinite;
          }

          .zuno-playlist-trigger:hover{
            background:rgba(255,255,255,.13);
            border-color:rgba(255,255,255,.25);
            box-shadow:0 0 0 1px rgba(255,255,255,.035),0 0 24px rgba(255,220,185,.14);
          }

          @keyframes zunoPlaylistDot{
            0%,100%{opacity:.62;transform:scale(.82)}
            50%{opacity:1;transform:scale(1.16)}
          }

          .zuno-nav-count{
            display:inline-flex;
            align-items:center;
            min-height:36px;
            padding:0 15px;
            border-left:1px solid rgba(255,255,255,.14);
            border-radius:999px;
            color:#fff;
            font-size:12px;
            font-weight:800;
            white-space:nowrap;
            text-shadow:0 1px 10px rgba(0,0,0,.4);
          }

          @media (max-width:700px){
            .zuno-nav{
              padding:14px 16px !important;
            }

            .zuno-nav::after{
              left:16px;
              right:16px;
            }

            .zuno-nav-actions{
              gap:3px;
              padding:4px;
            }

            .zuno-nav-action{
              min-height:34px;
              padding:0 9px;
              font-size:11px;
            }

            .zuno-nav-count{
              min-height:34px;
              padding:0 9px;
              font-size:11px;
            }

            .zuno-nav-brand{
              font-size:17px;
              letter-spacing:2.5px;
            }
          }

          @media (max-width:470px){
            .zuno-nav{
              gap:8px !important;
            }

            .zuno-nav-count{
              display:none;
            }

            .zuno-nav-actions{
              margin-left:auto;
            }
          }
        `}</style>

        <style>{`
          .zuno-playlist-hub-overlay{
            position:fixed; inset:0; z-index:90;
            display:flex; align-items:center; justify-content:center;
            padding:28px;
            background:rgba(4,4,4,.58);
            backdrop-filter:blur(18px) saturate(115%);
            -webkit-backdrop-filter:blur(18px) saturate(115%);
            animation:zunoHubFade .24s ease both;
          }

          .zuno-playlist-hub{
            position:relative;
            width:min(1080px,94vw);
            max-height:min(760px,88vh);
            overflow:auto;
            padding:28px;
            border:1px solid rgba(255,255,255,.18);
            border-radius:28px;
            background:linear-gradient(145deg,rgba(24,20,17,.90),rgba(9,9,9,.80));
            box-shadow:0 30px 100px rgba(0,0,0,.48),inset 0 1px 0 rgba(255,255,255,.08);
            color:#fff;
            animation:zunoHubEnter .34s cubic-bezier(.2,.75,.2,1) both;
          }

          .zuno-playlist-hub::before{
            content:""; position:absolute; inset:-1px; border-radius:inherit;
            pointer-events:none;
            background:linear-gradient(120deg,rgba(255,255,255,.08),transparent 30%,transparent 70%,rgba(255,220,185,.08));
          }

          .zuno-playlist-hub-head{
            position:relative; display:flex; align-items:flex-start;
            justify-content:space-between; gap:20px; margin-bottom:24px;
          }

          .zuno-playlist-hub-kicker{
            margin:0 0 7px; color:rgba(255,255,255,.5); font-size:10px;
            font-weight:800; letter-spacing:2.4px; text-transform:uppercase;
          }

          .zuno-playlist-hub-title{
            margin:0; font-family:"DM Sans",sans-serif;
            font-size:clamp(28px,4vw,42px); line-height:.98;
            letter-spacing:-1.4px; font-weight:800;
            text-shadow:0 4px 25px rgba(0,0,0,.32);
          }

          .zuno-playlist-hub-sub{
            margin:9px 0 0; max-width:560px; color:rgba(255,255,255,.58);
            font-size:12px; line-height:1.55;
          }

          .zuno-playlist-hub-close{
            position:relative; flex:0 0 auto; width:42px; height:42px;
            border:1px solid rgba(255,255,255,.14); border-radius:50%;
            background:rgba(255,255,255,.06); color:#fff; font-size:23px;
            line-height:1; cursor:pointer;
            transition:background .25s ease,border-color .25s ease,transform .25s ease;
          }

          .zuno-playlist-hub-close:hover{
            background:rgba(255,255,255,.12); border-color:rgba(255,255,255,.25);
            transform:rotate(4deg);
          }

          .zuno-playlist-options{
            position:relative; display:grid; grid-template-columns:1fr 1fr;
            gap:12px; margin-bottom:24px;
          }

          .zuno-playlist-option{
            position:relative; min-height:112px; padding:18px;
            border:1px solid rgba(255,255,255,.12); border-radius:18px;
            background:rgba(255,255,255,.045); color:#fff; text-align:left;
            cursor:pointer; overflow:hidden;
            transition:transform .28s ease,background .28s ease,border-color .28s ease,box-shadow .28s ease;
          }

          .zuno-playlist-option::after{
            content:""; position:absolute; width:150px; height:150px; right:-70px; bottom:-90px;
            border-radius:50%; background:rgba(255,224,192,.08); filter:blur(22px); pointer-events:none;
          }

          .zuno-playlist-option:hover{
            transform:translateY(-2px); background:rgba(255,255,255,.075);
            border-color:rgba(255,255,255,.22); box-shadow:0 14px 35px rgba(0,0,0,.18);
          }

          .zuno-playlist-option.active{
            background:rgba(255,255,255,.085); border-color:rgba(255,232,207,.30);
            box-shadow:0 0 24px rgba(255,220,185,.08);
          }

          .zuno-playlist-option-icon{
            display:inline-flex; align-items:center; justify-content:center;
            width:38px; height:38px; margin-bottom:14px;
            border:1px solid rgba(255,255,255,.14); border-radius:12px;
            background:rgba(255,255,255,.06); font-size:17px;
          }

          .zuno-playlist-option-title{display:block;font-size:15px;font-weight:800}
          .zuno-playlist-option-text{display:block;margin-top:4px;color:rgba(255,255,255,.52);font-size:10px;line-height:1.4}

          .zuno-playlist-recommended{position:relative}
          .zuno-playlist-recommended-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:12px}
          .zuno-playlist-recommended-title{margin:0;font-size:15px;font-weight:800}
          .zuno-playlist-recommended-note{margin:0;color:rgba(255,255,255,.43);font-size:10px}

          .zuno-recommended-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}

          .zuno-recommended-card{
            position:relative; min-height:158px; overflow:hidden;
            border:1px solid rgba(255,255,255,.14); border-radius:16px;
            background:#211b17; box-shadow:0 14px 34px rgba(0,0,0,.18); isolation:isolate;
          }

          .zuno-recommended-card::before{
            content:""; position:absolute; inset:0; z-index:-2;
            background-image:var(--playlist-bg); background-size:cover; background-position:center;
            transform:scale(1.02); transition:transform .45s ease;
          }

          .zuno-recommended-card::after{
            content:""; position:absolute; inset:0; z-index:-1;
            background:linear-gradient(180deg,rgba(0,0,0,.05) 5%,rgba(0,0,0,.16) 42%,rgba(0,0,0,.84) 100%);
          }

          .zuno-recommended-card-inner{
            min-height:158px; padding:13px; display:flex; flex-direction:column; justify-content:flex-end;
          }

          .zuno-recommended-mood{
            align-self:flex-start; margin-bottom:auto; padding:5px 8px;
            border:1px solid rgba(255,255,255,.18); border-radius:999px;
            background:rgba(0,0,0,.22); backdrop-filter:blur(8px);
            color:rgba(255,255,255,.9); font-size:9px; font-weight:700;
          }

          .zuno-recommended-card h3{margin:0;color:#fff;font-family:"DM Sans",sans-serif;font-size:16px;line-height:1.05;font-weight:800;letter-spacing:-.3px;text-shadow:0 2px 10px rgba(0,0,0,.34)}
          .zuno-recommended-card p{margin:5px 0 0;color:rgba(255,255,255,.78);font-size:9.5px;line-height:1.35}

          @media (hover:hover) and (pointer:fine){.zuno-recommended-card:hover::before{transform:scale(1.08)}}

          @keyframes zunoHubFade{from{opacity:0}to{opacity:1}}
          @keyframes zunoHubEnter{from{opacity:0;transform:translateY(10px) scale(.985)}to{opacity:1;transform:translateY(0) scale(1)}}

          @media(max-width:900px){
            .zuno-playlist-hub{padding:22px}
            .zuno-recommended-grid{display:flex;overflow-x:auto;gap:10px;padding-bottom:5px;scrollbar-width:none}
            .zuno-recommended-grid::-webkit-scrollbar{display:none}
            .zuno-recommended-card{flex:0 0 190px}
          }

          @media(max-width:600px){
            .zuno-playlist-hub-overlay{align-items:flex-end;padding:0}
            .zuno-playlist-hub{width:100%;max-height:91vh;padding:20px 16px 24px;border-radius:26px 26px 0 0}
            .zuno-playlist-hub-title{font-size:30px}
            .zuno-playlist-hub-sub{font-size:11px}
            .zuno-playlist-options{grid-template-columns:1fr 1fr;gap:8px}
            .zuno-playlist-option{min-height:104px;padding:14px}
            .zuno-playlist-option-icon{width:34px;height:34px;margin-bottom:10px}
            .zuno-playlist-option-title{font-size:13px}
            .zuno-playlist-option-text{font-size:9px}
            .zuno-recommended-card{flex-basis:72vw;max-width:260px;min-height:150px}
            .zuno-recommended-card-inner{min-height:150px}
          }

          @media(prefers-reduced-motion:reduce){
            .zuno-playlist-trigger-dot,.zuno-playlist-hub-overlay,.zuno-playlist-hub{animation:none !important}
          }
        `}</style>

        <header
          className="nav zuno-nav"
          style={{
            background: "transparent",
          }}
        >

          <div
            className="brand-mark zuno-nav-brand"
            aria-label="ZUNO"
          >
            <div className="brand-copy brand-zuno">
              <strong>ZUNO</strong>
            </div>
          </div>

          <div className="zuno-nav-actions">

            <button
              type="button"
              className="zuno-nav-action zuno-playlist-trigger"
              onClick={() => setPlaylistHubOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={playlistHubOpen}
            >
              <span className="zuno-playlist-trigger-dot" aria-hidden="true" />
              ♫ Playlists
            </button>

            <button
              type="button"
              className="zuno-nav-action"
              onClick={() => setProfileOpen(true)}
            >
              Hi,{" "}
              {profile.display_name || profile.username}
            </button>

            <div className="zuno-nav-count">
              मेरी पसंद · {tracks.length} गीत
            </div>

          </div>

        </header>


        {/* MAIN */}

        <main className="layout">

          {/* TIME-BASED HERO */}
          <section className="hero greeting-hero" aria-label="Personal time greeting">
            <h1>
              <span className="hero-name">{getFirstName(profile)}</span>
              <span className="hero-time">{timePhrase}</span>
            </h1>
          </section>

          {/* HIDDEN YOUTUBE HOST
              The actual YouTube player remains mounted for audio playback,
              while its visual video card is intentionally hidden. */}
          <div id="youtube-player" className="youtube-player-hidden" aria-hidden="true" />


          {/* PLAYER */}

          <section
            className={`player-card ${
              playing ? "is-playing" : ""
            }`}
            onDoubleClick={(event) => {
              if (event.target.closest("button, input")) {
                return;
              }
              togglePlay();
            }}
            title="Double-click to play / pause"
          >

            <div className="player-heading">

              <span>
                मेरी पसंद
              </span>

              <span className="small-mark">
                ♪
              </span>

            </div>


            <div className="now-row">
              <div className="player-song-label">
                {
                  currentTrack?.title ||
                  "अपनी पसंद से कोई गीत चुनें"
                }
              </div>

              <button
                type="button"
                className={`heart ${
                  liked
                    ? "active"
                    : ""
                }`}
                onClick={() => {
                  if (currentTrack) {
                    setLiked(!liked);
                  }
                }}
                disabled={!currentTrack}
              >
                {
                  liked
                    ? "♥"
                    : "♡"
                }
              </button>
            </div>


            <div
              className="seek"
              onClick={seek}
            >

              <div
                className="seek-fill"
                style={{
                  width:
                    `${progress}%`,
                }}
              />

            </div>


            <div className="time">

              <span>
                {elapsed}
              </span>

              <span>
                {duration}
              </span>

            </div>


            <div className="controls">

              {/* MUSIC-REACTIVE VISUALIZER */}
              <div
                className={`music-visualizer ${
                  playing ? "is-playing" : ""
                } ${!currentTrack ? "is-idle" : ""}`}
                aria-hidden="true"
              >
                {Array.from({ length: 9 }).map((_, barIndex) => (
                  <span
                    key={barIndex}
                    className="visualizer-bar"
                    style={{
                      "--bar-delay": `${barIndex * 0.08}s`,
                      "--bar-height": `${8 + ((barIndex * 11) % 17)}px`,
                    }}
                  />
                ))}
              </div>

              <button
                type="button"
                className="control"
                onClick={() =>
                  changeTrack(
                    indexRef.current -
                      1
                  )
                }
              >
                ‹
              </button>


              <button
                type="button"
                className="control play"
                onClick={
                  togglePlay
                }
              >
                {
                  playing
                    ? "Ⅱ"
                    : "▶"
                }
              </button>


              <button
                type="button"
                className="control"
                onClick={() =>
                  changeTrack(
                    indexRef.current +
                      1
                  )
                }
              >
                ›
              </button>

            </div>


            <div className="utility">

              <span className="volume-icon">
                ⌁
              </span>


              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => {

                  const value =
                    Number(
                      e.target.value
                    );

                  setVolume(
                    value
                  );

                  if (value > 0) {
                    previousVolumeRef.current = value;
                  }

                  try {
                    localStorage.setItem(
                      "pf_volume",
                      String(value)
                    );
                  } catch {
                    // Ignore storage failures.
                  }

                  playerRef.current?.setVolume(
                    value
                  );

                }}
              />


              <button
                type="button"
                onClick={() => {
                  setQueueFocusIndex(indexRef.current);
                  setQueueOpen(true);
                }}
              >
                आगे की सूची
              </button>

            </div>


            <div className="note">
              संगीत YouTube के आधिकारिक
              प्लेयर के माध्यम से चल रहा है।
            </div>

          </section>


        </main>


        {/* QUEUE */}

        {queueOpen && (

          <div
            className="queue-overlay"
            onClick={(event) => {

              if (
                event.target ===
                event.currentTarget
              ) {
                setQueueOpen(
                  false
                );
              }

            }}
          >

            <div
              className="queue open"
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              <div className="queue-title">

                आगे बजने वाले गीत


                <button
                  type="button"
                  onClick={() =>
                    setQueueOpen(
                      false
                    )
                  }
                  style={
                    panelStyles.close
                  }
                >
                  ×
                </button>

              </div>


              {tracks.map(
                (track, i) => (

                  <button
                    key={`${track.id}-${i}`}
                    type="button"
                    className={`track ${
                      i === index
                        ? "active"
                        : ""
                    }`}
                    style={
                      i === queueFocusIndex
                        ? {
                            outline: "1px solid rgba(255,255,255,.55)",
                            outlineOffset: -1,
                          }
                        : undefined
                    }
                    onClick={() =>
                      changeTrack(
                        i,
                        true
                      )
                    }
                  >

                    <span className="track-no">
                      {i + 1}
                    </span>


                    <span className="track-name">

                      {track.title}

                      <small>
                        {track.artist}
                      </small>

                    </span>


                    <span>
                      {
                        i === index
                          ? "♪"
                          : "›"
                      }
                    </span>

                  </button>

                )
              )}

            </div>

          </div>

        )}


        {/* PROFILE */}

        {profileOpen && (

          <ProfilePanel
            profile={
              profile
            }
            onSave={
              saveProfileChanges
            }
            onLogout={
              logout
            }
            onClose={() =>
              setProfileOpen(
                false
              )
            }
          />

        )}


        {/* PLAYLIST HUB */}
        {playlistHubOpen && (
          <div
            className="zuno-playlist-hub-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="zuno-playlist-hub-title"
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                setPlaylistHubOpen(false);
              }
            }}
          >
            <div
              className="zuno-playlist-hub"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="zuno-playlist-hub-head">
                <div>
                  <p className="zuno-playlist-hub-kicker">ZUNO MUSIC</p>
                  <h2 id="zuno-playlist-hub-title" className="zuno-playlist-hub-title">
                    Pick your playlist.
                  </h2>
                  <p className="zuno-playlist-hub-sub">
                    Curated moods from ZUNO, or your own playlists. Everything music, one quiet place.
                  </p>
                </div>

                <button
                  type="button"
                  className="zuno-playlist-hub-close"
                  onClick={() => setPlaylistHubOpen(false)}
                  aria-label="Close playlists"
                >
                  ×
                </button>
              </div>

              <div className="zuno-playlist-options">
                <button
                  type="button"
                  className="zuno-playlist-option active"
                  onClick={() => {}}
                >
                  <span className="zuno-playlist-option-icon" aria-hidden="true">♫</span>
                  <span className="zuno-playlist-option-title">Recommended</span>
                  <span className="zuno-playlist-option-text">ZUNO-curated playlists for every mood.</span>
                </button>

                <button
                  type="button"
                  className="zuno-playlist-option"
                  onClick={() => {
                    setPlaylistHubOpen(false);
                    setPlaylistOpen(true);
                  }}
                >
                  <span className="zuno-playlist-option-icon" aria-hidden="true">♡</span>
                  <span className="zuno-playlist-option-title">My Playlists</span>
                  <span className="zuno-playlist-option-text">Create, edit, import and play your own.</span>
                </button>
              </div>

              <div className="zuno-playlist-recommended">
                <div className="zuno-playlist-recommended-head">
                  <h3 className="zuno-playlist-recommended-title">Recommended playlists</h3>
                  <p className="zuno-playlist-recommended-note">Curated by ZUNO · 5 moods</p>
                </div>

                <div className="zuno-recommended-grid">
                  {RECOMMENDED_PLAYLISTS.map((playlist) => (
                    <article
                      key={playlist.id}
                      className="zuno-recommended-card"
                      style={{
                        "--playlist-bg": `linear-gradient(rgba(0,0,0,.08),rgba(0,0,0,.08)),url(${playlist.background})`,
                      }}
                    >
                      <div className="zuno-recommended-card-inner">
                        <span className="zuno-recommended-mood">
                          {playlist.mood}
                        </span>
                        <h3>{playlist.title}</h3>
                        <p>{playlist.subtitle}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}


        {/* PLAYLISTS */}

        {playlistOpen && (

          <PlaylistPanel
            user={user}
            token={token}
            currentTrack={
              currentTrack
            }
            onPlayPlaylist={
              playPlaylist
            }
            onLibraryChanged={
              refreshSongs
            }
            onClose={() =>
              setPlaylistOpen(
                false
              )
            }
          />

        )}

      </div>


    </div>
  );
}


/* =========================================================
   SMALL INLINE UI STYLES
   ========================================================= */

const topButton = {

  border:
    "1px solid rgba(255,255,255,.3)",

  background:
    "rgba(255,255,255,.12)",

  color:
    "#fff",

  backdropFilter:
    "blur(12px)",

  WebkitBackdropFilter:
    "blur(12px)",

  borderRadius:
    999,

  padding:
    "8px 13px",

  cursor:
    "pointer",

  fontSize:
    12,

  fontWeight:
    700,
};


const authStyles = {

  page: {

    minHeight:
      "100vh",

    display:
      "grid",

    placeItems:
      "center",

    padding:
      20,

    background:
      "#000",

    color:
      "#fff",

    fontFamily:
      '"DM Sans",sans-serif',
  },


  card: {

    width:
      "min(430px,92vw)",

    padding:
      34,

    border:
      "1px solid rgba(255,255,255,.24)",

    borderRadius:
      26,

    background:
      "rgba(8,8,8,.94)",

    backdropFilter:
      "blur(24px) saturate(140%)",

    WebkitBackdropFilter:
      "blur(24px) saturate(140%)",

    boxShadow:
      "0 30px 90px rgba(0,0,0,.35)",
  },


  mark: {

    width:
      46,

    height:
      46,

    borderRadius:
      "50%",

    display:
      "grid",

    placeItems:
      "center",

    background:
      "rgba(255,255,255,.08)",

    fontSize:
      22,

    marginBottom:
      18,
  },


  eyebrow: {

    fontSize:
      11,

    letterSpacing:
      2,

    textTransform:
      "uppercase",

    opacity:
      0.68,
  },


  title: {

    margin:
      "8px 0 6px",

    fontFamily:
      '"Tiro Devanagari Hindi",serif',

    fontSize:
      38,

    lineHeight:
      1.05,

    color:
      "#fff",
  },


  sub: {

    margin:
      "0 0 22px",

    opacity:
      0.72,

    lineHeight:
      1.6,
  },


  tabs: {

    display:
      "flex",

    gap:
      5,

    padding:
      5,

    borderRadius:
      14,

    background:
      "rgba(255,255,255,.05)",

    marginBottom:
      18,
  },


  tab: {

    flex:
      1,

    border:
      0,

    borderRadius:
      10,

    padding:
      "10px 8px",

    background:
      "transparent",

    color:
      "rgba(255,255,255,.62)",

    cursor:
      "pointer",

    fontWeight:
      700,
  },


  activeTab: {

    background:
      "rgba(255,255,255,.10)",

    color:
      "#fff",
  },


  form: {

    display:
      "grid",

    gap:
      12,
  },


  input: {

    width:
      "100%",

    boxSizing:
      "border-box",

    border:
      "1px solid rgba(255,255,255,.2)",

    borderRadius:
      12,

    padding:
      "13px 14px",

    outline:
      "none",

    background:
      "rgba(255,255,255,.04)",

    color:
      "#fff",
  },


  message: {

    padding:
      "10px 12px",

    borderRadius:
      10,

    background:
      "rgba(255,90,70,.13)",

    border:
      "1px solid rgba(255,120,100,.22)",

    color:
      "#ffd6ce",

    fontSize:
      12,

    lineHeight:
      1.5,
  },


  submit: {

    border:
      0,

    borderRadius:
      12,

    padding:
      14,

    background:
      "#fff",

    color:
      "#000",

    fontWeight:
      800,

    cursor:
      "pointer",
  },


  hint: {

    marginTop:
      18,

    fontSize:
      11,

    opacity:
      0.45,

    textAlign:
      "center",
  },


  loading: {

    textAlign:
      "center",

    fontFamily:
      '"Tiro Devanagari Hindi",serif',

    fontSize:
      26,

    lineHeight:
      1.6,
  },
};


const panelStyles = {

  backdrop: {

    position:
      "fixed",

    inset:
      0,

    zIndex:
      9999,

    display:
      "grid",

    placeItems:
      "center",

    padding:
      20,

    background:
      "rgba(0,0,0,.46)",

    backdropFilter:
      "blur(12px)",

    WebkitBackdropFilter:
      "blur(12px)",
  },


  card: {

    width:
      "min(640px,94vw)",

    maxHeight:
      "88vh",

    overflow:
      "auto",

    padding:
      25,

    borderRadius:
      22,

    border:
      "1px solid rgba(255,255,255,.22)",

    background:
      "rgba(18,18,18,.42)",

    color:
      "#fff",

    backdropFilter:
      "blur(24px) saturate(125%)",

    WebkitBackdropFilter:
      "blur(24px) saturate(125%)",

    boxShadow:
      "0 30px 90px rgba(0,0,0,.42)",
  },


  head: {

    display:
      "flex",

    justifyContent:
      "space-between",

    alignItems:
      "flex-start",

    gap:
      20,
  },


  eyebrow: {

    fontSize:
      10,

    letterSpacing:
      2,

    opacity:
      0.58,

    fontWeight:
      800,
  },


  title: {

    margin:
      "5px 0 20px",

    fontFamily:
      '"Tiro Devanagari Hindi",serif',

    fontSize:
      32,

    color:
      "#fff",
  },


  close: {

    border:
      "1px solid rgba(255,255,255,.22)",

    width:
      38,

    height:
      38,

    borderRadius:
      "50%",

    background:
      "rgba(255,255,255,.10)",

    color:
      "#fff",

    cursor:
      "pointer",

    fontSize:
      23,

    lineHeight:
      1,
  },


  label: {

    display:
      "block",

    fontSize:
      11,

    fontWeight:
      800,

    margin:
      "14px 0 6px",

    opacity:
      0.68,
  },


  readonly: {

    padding:
      "12px 13px",

    borderRadius:
      11,

    background:
      "rgba(255,255,255,.09)",

    border:
      "1px solid rgba(255,255,255,.13)",

    color:
      "#fff",
  },


  input: {

    width:
      "100%",

    boxSizing:
      "border-box",

    padding:
      "12px 13px",

    borderRadius:
      11,

    border:
      "1px solid rgba(255,255,255,.15)",

    background:
      "rgba(255,255,255,.09)",

    color:
      "#fff",

    outline:
      "none",

    marginBottom:
      4,
  },


  bgGrid: {

    display:
      "grid",

    gridTemplateColumns:
      "repeat(2,minmax(0,1fr))",

    gap:
      10,
  },


  bg: {

    minHeight:
      105,

    borderRadius:
      14,

    border:
      "2px solid transparent",

    backgroundSize:
      "cover",

    backgroundPosition:
      "center",

    color:
      "#fff",

    cursor:
      "pointer",

    display:
      "flex",

    alignItems:
      "flex-end",

    padding:
      12,

    textAlign:
      "left",

    fontWeight:
      800,

    textShadow:
      "0 2px 10px #000",
  },


  bgActive: {

    borderColor:
      "rgba(255,255,255,.85)",

    boxShadow:
      "0 0 0 2px rgba(255,255,255,.22) inset",
  },


  actions: {

    display:
      "flex",

    justifyContent:
      "space-between",

    gap:
      10,

    marginTop:
      20,
  },


  logout: {

    border:
      "1px solid rgba(255,255,255,.16)",

    borderRadius:
      11,

    padding:
      "11px 15px",

    background:
      "rgba(255,255,255,.07)",

    color:
      "rgba(255,255,255,.86)",

    cursor:
      "pointer",

    fontWeight:
      800,
  },


  save: {

    border:
      0,

    borderRadius:
      11,

    padding:
      "11px 17px",

    background:
      "rgba(255,255,255,.92)",

    color:
      "#111",

    cursor:
      "pointer",

    fontWeight:
      800,
  },


  createRow: {

    display:
      "flex",

    gap:
      8,

    marginBottom:
      20,
  },


  playlistGrid: {

    display:
      "grid",

    gridTemplateColumns:
      "1fr 1fr",

    gap:
      18,
  },


  sectionTitle: {

    fontSize:
      11,

    fontWeight:
      900,

    letterSpacing:
      1,

    textTransform:
      "uppercase",

    opacity:
      0.58,

    marginBottom:
      8,
  },


  playlistItem: {

    width:
      "100%",

    display:
      "flex",

    gap:
      10,

    alignItems:
      "center",

    border:
      "1px solid rgba(255,255,255,.12)",

    borderRadius:
      11,

    background:
      "rgba(255,255,255,.08)",

    padding:
      "12px 13px",

    marginBottom:
      7,

    cursor:
      "pointer",

    textAlign:
      "left",

    color:
      "#fff",

    fontWeight:
      700,
  },


  playlistActive: {

    background:
      "rgba(255,255,255,.16)",

    borderColor:
      "rgba(255,255,255,.32)",
  },


  empty: {

    padding:
      15,

    opacity:
      0.58,

    fontSize:
      13,

    lineHeight:
      1.5,
  },


  addSong: {

    width:
      "100%",

    border:
      "1px solid rgba(255,255,255,.14)",

    borderRadius:
      10,

    padding:
      11,

    background:
      "rgba(255,255,255,.08)",

    color:
      "#fff",

    cursor:
      "pointer",

    fontWeight:
      800,

    marginBottom:
      9,
  },


  songItem: {

    padding:
      "9px 10px",

    borderBottom:
      "1px solid rgba(255,255,255,.09)",

    color:
      "rgba(255,255,255,.92)",
  },


  playPlaylist: {

    width:
      "100%",

    marginTop:
      12,

    border:
      0,

    borderRadius:
      10,

    padding:
      12,

    background:
      "rgba(255,255,255,.92)",

    color:
      "#111",

    cursor:
      "pointer",

    fontWeight:
      800,
  },


  error: {

    marginTop:
      12,

    color:
      "#ffb7aa",

    fontSize:
      12,
  },
};


/* =========================================================
   START APP
   ========================================================= */

createRoot(
  document.getElementById(
    "root"
  )
).render(
  <App />
);
