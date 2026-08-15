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
    name: "गाँव",
    value: "/assets/village-background.png",
  },

  {
    id: 2,
    name: "सूरज ढलना",
    value:
      "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=2400&q=90",
  },

  {
    id: 3,
    name: "पहाड़",
    value:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2400&q=90",
  },

  {
    id: 4,
    name: "शहर",
    value:
      "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=2400&q=90",
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
    ) || 1
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
   MAIN APP
   ========================================================= */

function App() {

  const playerRef =
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
    useState(80);

  const [queueOpen, setQueueOpen] =
    useState(false);

  const [liked, setLiked] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  /* AUTH */

  const [
    sessionLoading,
    setSessionLoading,
  ] = useState(true);

  const [user, setUser] =
    useState(null);

  const [token, setToken] =
    useState("");

  const [profile, setProfile] =
    useState(null);


  /* PANELS */

  const [
    profileOpen,
    setProfileOpen,
  ] = useState(false);

  const [
    playlistOpen,
    setPlaylistOpen,
  ] = useState(false);


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
                  1,
              },
              accessToken
            );

          existing =
            created?.[0];
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
              1,
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
            1,
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


        setSessionLoading(
          false
        );
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

        tracksRef.current =
          songs;

        setTracks(
          songs
        );

        indexRef.current =
          0;

        setIndex(0);

        if (!songs.length) {
          setError(
            "Abhi tumhari playlist me koi song nahi hai. Playlist me song add karo."
          );

          playerRef.current?.stopVideo?.();
        } else {
          setError("");
        }

        setLoading(false);

      } catch (err) {
        console.error(err);

        setError(
          err?.message ||
          "Tumhari playlists se songs load nahi ho sake."
        );

        setLoading(false);
      }
    };


  useEffect(() => {

    if (!user)
      return;


    refreshSongs();


    const interval =
      setInterval(
        refreshSongs,
        60000
      );


    return () =>
      clearInterval(
        interval
      );

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
      sessionLoading ||
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
    sessionLoading,
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
                tracks[0].id,

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

      setPlaylistOpen(
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
     LOADING
     ======================================================= */

  if (
    sessionLoading
  ) {

    return (
      <div
        style={
          authStyles.page
        }
      >

        <div
          style={
            authStyles.loading
          }
        >
          P's favourites

          <br />

          <small>
            आपकी music world तैयार हो रही है…
          </small>

        </div>

      </div>
    );
  }


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
        ) || 1
      ) - 1
    ] ||
    BACKGROUNDS[0];


  /* =======================================================
     LOADING SONGS
     ======================================================= */

  if (loading) {

    return (
      <div
        className="scene"
        style={{
          backgroundImage:
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
          गीतों की सूची तैयार हो रही है...
        </div>

      </div>
    );
  }


  const currentTrack =
    tracks[index] || {
      title: "",
      artist: "",
    };


  /* =======================================================
     MAIN UI
     ======================================================= */

  return (

    <div className="site">

      <div
        className="scene"
        style={{
          backgroundImage:
            `linear-gradient(90deg,rgba(5,10,9,.22),rgba(5,8,8,.02) 48%,rgba(5,8,8,.14)),url(${bg.value})`,
        }}
      >


        {/* NAV */}

        <header className="nav">

          <div className="logo">
            P's{" "}
            <span>
              favourites
            </span>
          </div>


          <div
            style={{
              display:
                "flex",

              alignItems:
                "center",

              gap:
                10,
            }}
          >

            <button
              type="button"
              onClick={() =>
                setPlaylistOpen(
                  true
                )
              }
              style={
                topButton
              }
            >
              ♫ Playlists
            </button>


            <button
              type="button"
              onClick={() =>
                setProfileOpen(
                  true
                )
              }
              style={
                topButton
              }
            >
              Hi,{" "}
              {
                profile.display_name ||
                profile.username
              }
            </button>


            <div className="badge">
              मेरी पसंद ·{" "}
              {tracks.length} गीत
            </div>

          </div>

        </header>


        {/* MAIN */}

        <main className="layout">


          {/* HERO */}

          <section className="hero">

            <div className="eyebrow">
              मेरी पसंद · मेरी धुनें
            </div>


            <h1>
              {
                profile.display_name ||
                "Priyam"
              }

              की

              <br />

              पसंद
            </h1>


            <p>
              हर गीत की अपनी एक कहानी होती है।
              ये वही धुनें हैं जिन्हें मैं बार-बार
              सुनना पसंद करता हूँ।
            </p>

          </section>


          {/* PLAYER */}

          <section className="player-card">

            <div className="player-heading">

              <span>
                मेरी पसंद
              </span>

              <span className="small-mark">
                ♪
              </span>

            </div>


            <div className="video-shell">

              {tracks.length ? (
                <div id="youtube-player" />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    minHeight: "250px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    padding: "30px",
                    color: "#f2dfba",
                    background: "rgba(8, 6, 4, 0.88)",
                    fontFamily: '"Tiro Devanagari Hindi", serif',
                    fontSize: "16px",
                    lineHeight: 1.8,
                  }}
                >
                  {error || (
                    <>
                      Abhi tumhari playlist me koi song nahi hai.
                      <br />
                      Playlist me song add karo, phir yahin play hoga.
                    </>
                  )}
                </div>
              )}

            </div>


            <div className="now-row">

              <div>

                <div className="kicker">
                  अभी बज रहा है
                </div>


                <div className="song-title">
                  {
                    currentTrack.title
                  }
                </div>


                <div className="artist">
                  {
                    currentTrack.artist
                  }
                </div>

              </div>


              <button
                type="button"
                className={`heart ${
                  liked
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setLiked(
                    !liked
                  )
                }
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

                  playerRef.current?.setVolume(
                    value
                  );

                }}
              />


              <button
                type="button"
                onClick={() =>
                  setQueueOpen(
                    true
                  )
                }
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


      {/* FOOTER */}

      <footer className="footer">

        This website is owned by{" "}

        <strong>
          {
            profile.display_name ||
            "Priyam Mishra"
          }
        </strong>

      </footer>

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
      "radial-gradient(circle at 20% 10%,rgba(245,223,183,.18),transparent 30%),linear-gradient(135deg,#111,#25221d)",

    color:
      "#f5dfb7",

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
      "rgba(255,255,255,.09)",

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
      "rgba(255,255,255,.13)",

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
      "rgba(0,0,0,.18)",

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
      "rgba(255,255,255,.15)",

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
      "rgba(255,255,255,.09)",

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
      "#f5dfb7",

    color:
      "#171411",

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
      "rgba(0,0,0,.38)",

    backdropFilter:
      "blur(9px)",

    WebkitBackdropFilter:
      "blur(9px)",
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
      "1px solid rgba(255,255,255,.48)",

    background:
      "rgba(247,239,221,.78)",

    color:
      "#171411",

    backdropFilter:
      "blur(26px) saturate(140%)",

    WebkitBackdropFilter:
      "blur(26px) saturate(140%)",

    boxShadow:
      "0 30px 90px rgba(0,0,0,.28)",
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
      0.5,

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
  },


  close: {

    border:
      "1px solid rgba(20,20,20,.18)",

    width:
      38,

    height:
      38,

    borderRadius:
      "50%",

    background:
      "rgba(255,255,255,.25)",

    color:
      "#111",

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
      0.65,
  },


  readonly: {

    padding:
      "12px 13px",

    borderRadius:
      11,

    background:
      "rgba(255,255,255,.35)",

    border:
      "1px solid rgba(20,20,20,.08)",
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
      "1px solid rgba(20,20,20,.14)",

    background:
      "rgba(255,255,255,.45)",

    color:
      "#111",

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
      "#111",

    boxShadow:
      "0 0 0 2px rgba(255,255,255,.7) inset",
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
      "1px solid rgba(150,30,20,.25)",

    borderRadius:
      11,

    padding:
      "11px 15px",

    background:
      "rgba(180,50,40,.08)",

    color:
      "#8a2e24",

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
      "#171411",

    color:
      "#fff",

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
      0.55,

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
      "1px solid rgba(20,20,20,.1)",

    borderRadius:
      11,

    background:
      "rgba(255,255,255,.3)",

    padding:
      "12px 13px",

    marginBottom:
      7,

    cursor:
      "pointer",

    textAlign:
      "left",

    color:
      "#111",

    fontWeight:
      700,
  },


  playlistActive: {

    background:
      "rgba(20,20,20,.09)",

    borderColor:
      "rgba(20,20,20,.3)",
  },


  empty: {

    padding:
      15,

    opacity:
      0.55,

    fontSize:
      13,

    lineHeight:
      1.5,
  },


  addSong: {

    width:
      "100%",

    border:
      "1px solid rgba(20,20,20,.16)",

    borderRadius:
      10,

    padding:
      11,

    background:
      "rgba(255,255,255,.35)",

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
      "1px solid rgba(20,20,20,.08)",
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
      "#171411",

    color:
      "#fff",

    cursor:
      "pointer",

    fontWeight:
      800,
  },


  error: {

    marginTop:
      12,

    color:
      "#8a2e24",

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