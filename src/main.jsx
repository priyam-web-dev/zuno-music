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
   YouTube Music links for the five curated playlists.
   ========================================================= */
const RECOMMENDED_PLAYLISTS = [
  {
    id: "arijit-singh",
    title: "Arijit Singh songs",
    background: "/assets/bg8.png",
    url: "https://music.youtube.com/playlist?list=RDCLAK5uy_lSaqe-XXsDL1jXiSYdfKKuWDU2vnU6uaE&playnext=1&si=KINii4VhVIA6Y9-p",
  },
  {
    id: "punjabi-dance-hits",
    title: "Punjabi Dance Hits",
    background: "/assets/bg6.png",
    url: "https://music.youtube.com/playlist?list=RDCLAK5uy_l1tvprsrxf2EDE9pHKetlLGn8yq7XSECo&playnext=1&si=xMsn_7tGzbH1_584",
  },
  {
    id: "old-songs",
    title: "Old Songs",
    background: "/assets/bg4.png",
    url: "https://music.youtube.com/playlist?list=OLAK5uy_mUHTqhykunmVYqcjnlr_Vr-C3SlsvA2L4&si=qh0DD7NoyVZMRXgZ",
  },
  {
    id: "karan-aujla",
    title: "Karan Aujla songs",
    background: "/assets/bg10.png",
    url: "https://music.youtube.com/playlist?list=RDCLAK5uy_lnJEMm7nZ6wPjGFPgDGWJoiz0dpUsgFQ8&playnext=1&si=SObjGwYSSBBgO_UG",
  },
  {
    id: "night-retro-hindi",
    title: "Night Retro: Hindi",
    background: "/assets/bg5.png",
    url: "https://music.youtube.com/playlist?list=RDCLAK5uy_m4cVudgAhYmFlK-tudPAijltqK9DaYAOs&playnext=1&si=cVYEWZpWfyTTJQV9",
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

  if (
    !Array.isArray(playlists) ||
    !playlists.length
  ) {
    return [];
  }

  /*
    Performance:
    Fetch all playlist songs in one request instead of making one
    playlist_songs request for every playlist.
  */
  const playlistIds =
    playlists
      .map((playlist) => playlist?.id)
      .filter(Boolean);

  if (!playlistIds.length) {
    return [];
  }

  const inList =
    playlistIds
      .map((id) => `"${String(id).replace(/"/g, '\\"')}"`)
      .join(",");

  const songs =
    await supabaseRequest(
      `/rest/v1/playlist_songs?playlist_id=in.(${inList})&select=id,playlist_id,youtube_id,song_name,artist,position&order=position.asc`,
      {
        method: "GET",
      },
      token
    );

  const seen = new Set();
  const tracks = [];

  for (
    const song of
    Array.isArray(songs)
      ? songs
      : []
  ) {
    const id =
      String(
        song?.youtube_id || ""
      ).trim();

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

  return tracks;
}


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
    <>
      <style>{`
        /* =====================================================
           ZUNO — MY PLAYLISTS
           Quiet editorial UI. No dashboard-card treatment.
           ===================================================== */

        .site .scene > .zuno-my-overlay{
          position:fixed !important;
          inset:0 !important;
          z-index:99999 !important;
          width:100vw !important;
          height:100vh !important;
          display:flex;
          align-items:center;
          justify-content:center;
          padding:24px;
          box-sizing:border-box;
          background:rgba(7,6,5,.66);
          backdrop-filter:blur(16px) saturate(105%);
          -webkit-backdrop-filter:blur(16px) saturate(105%);
          animation:zunoMyFade .22s ease both;
          font-family:"DM Sans",sans-serif !important;
        }

        .zuno-my-modal{
          position:relative !important;
          z-index:100000 !important;
          width:min(940px,94vw);
          max-height:88vh;
          overflow:auto;
          box-sizing:border-box;
          padding:34px 36px 30px;
          border:1px solid rgba(255,255,255,.13);
          border-radius:20px;
          background:rgba(15,13,12,.91);
          color:#fff;
          box-shadow:0 28px 90px rgba(0,0,0,.52);
          scrollbar-width:thin;
          scrollbar-color:rgba(255,255,255,.16) transparent;
          font-family:"DM Sans",sans-serif !important;
          animation:zunoMyEnter .28s cubic-bezier(.2,.8,.2,1) both;
        }

        .zuno-my-modal,
        .zuno-my-modal button,
        .zuno-my-modal input,
        .zuno-my-modal textarea{
          font-family:"DM Sans",sans-serif !important;
        }

        .zuno-my-modal::-webkit-scrollbar{width:5px}
        .zuno-my-modal::-webkit-scrollbar-track{background:transparent}
        .zuno-my-modal::-webkit-scrollbar-thumb{
          background:rgba(255,255,255,.15);
          border-radius:99px;
        }

        .zuno-my-head{
          display:flex;
          align-items:flex-start;
          justify-content:space-between;
          gap:20px;
          padding-bottom:24px;
          border-bottom:1px solid rgba(255,255,255,.09);
        }

        .zuno-my-kicker{
          margin:0 0 8px;
          color:rgba(255,255,255,.38);
          font-family:"DM Sans",sans-serif !important;
          font-size:9px;
          font-weight:700;
          letter-spacing:2.2px;
          text-transform:uppercase;
        }

        .zuno-my-title{
          margin:0;
          color:#fff;
          font-family:"DM Sans",sans-serif !important;
          font-size:clamp(32px,4vw,42px);
          line-height:1;
          letter-spacing:-1.4px;
          font-weight:700;
        }

        .zuno-my-sub{
          margin:9px 0 0;
          color:rgba(255,255,255,.58);
          font-family:"DM Sans",sans-serif !important;
          font-size:13px;
          line-height:1.5;
        }

        .zuno-my-close{
          width:34px;
          height:34px;
          flex:0 0 auto;
          display:grid;
          place-items:center;
          border:1px solid rgba(255,255,255,.13);
          border-radius:50%;
          background:transparent;
          color:rgba(255,255,255,.72);
          font-family:"DM Sans",sans-serif !important;
          font-size:18px;
          line-height:1;
          cursor:pointer;
          transition:background .18s ease,color .18s ease,border-color .18s ease;
        }

        .zuno-my-close:hover{
          background:rgba(255,255,255,.07);
          color:#fff;
          border-color:rgba(255,255,255,.24);
        }

        .zuno-my-layout{
          display:grid;
          grid-template-columns:260px minmax(0,1fr);
          gap:38px;
          align-items:start;
          padding-top:26px;
        }

        .zuno-my-sidebar{
          display:flex;
          flex-direction:column;
          gap:24px;
        }

        /* Remove the "three feature cards" look. These are now quiet
           functional areas separated by hairlines. */
        .zuno-my-create,
        .zuno-my-import,
        .zuno-my-action{
          padding:0 0 20px;
          border:0;
          border-bottom:1px solid rgba(255,255,255,.08);
          border-radius:0;
          background:transparent;
        }

        .zuno-my-create-label,
        .zuno-my-section-label{
          margin:0 0 10px;
          color:rgba(255,255,255,.62);
          font-family:"DM Sans",sans-serif !important;
          font-size:11px;
          font-weight:700;
          letter-spacing:1.8px;
          text-transform:uppercase;
        }

        .zuno-my-create-row{
          display:flex;
          gap:7px;
        }

        .zuno-my-input{
          min-width:0;
          width:100%;
          height:38px;
          box-sizing:border-box;
          border:1px solid rgba(255,255,255,.11);
          border-radius:9px;
          background:rgba(255,255,255,.045);
          color:#fff;
          outline:none;
          padding:0 11px;
          font-family:"DM Sans",sans-serif !important;
          font-size:13px;
        }

        .zuno-my-input::placeholder{
          color:rgba(255,255,255,.48);
        }

        .zuno-my-input:focus{
          border-color:rgba(255,255,255,.25);
          box-shadow:none;
          background:rgba(255,255,255,.06);
        }

        .zuno-my-create-btn{
          flex:0 0 auto;
          height:38px;
          border:1px solid rgba(255,255,255,.14);
          border-radius:9px;
          padding:0 13px;
          background:#f2f0ec;
          color:#171513;
          font-family:"DM Sans",sans-serif !important;
          font-size:13px;
          font-weight:700;
          cursor:pointer;
        }

        .zuno-my-create-btn:hover{
          background:#fff;
        }

        .zuno-my-action-top{
          display:flex;
          align-items:center;
          gap:10px;
        }

        .zuno-my-action-icon{
          width:30px;
          height:30px;
          flex:0 0 auto;
          display:grid;
          place-items:center;
          border:1px solid rgba(255,255,255,.12);
          border-radius:8px;
          background:rgba(255,255,255,.045);
          color:rgba(255,255,255,.70);
          font-size:12px;
        }

        .zuno-my-action-title{
          color:rgba(255,255,255,.84);
          font-family:"DM Sans",sans-serif !important;
          font-size:13px;
          font-weight:700;
        }

        .zuno-my-action-copy{
          margin-top:2px;
          color:rgba(255,255,255,.52);
          font-family:"DM Sans",sans-serif !important;
          font-size:11px;
          line-height:1.4;
        }

        .zuno-my-import-row{
          display:flex;
          gap:7px;
          margin-top:10px;
        }

        .zuno-my-import-btn,
        .zuno-my-add-btn{
          width:100%;
          margin-top:7px;
          height:34px;
          border:1px solid rgba(255,255,255,.10);
          border-radius:8px;
          padding:0 10px;
          background:transparent;
          color:rgba(255,255,255,.70);
          font-family:"DM Sans",sans-serif !important;
          font-size:12px;
          font-weight:600;
          cursor:pointer;
        }

        .zuno-my-import-btn:hover,
        .zuno-my-add-btn:hover{
          background:rgba(255,255,255,.055);
          color:#fff;
        }

        .zuno-my-hint{
          color:rgba(255,255,255,.48) !important;
          font-size:11px !important;
          line-height:1.45;
          margin-top:7px;
          color:rgba(255,255,255,.27);
          font-family:"DM Sans",sans-serif !important;
          font-size:8px;
          line-height:1.45;
        }

        .zuno-my-list-head{
          display:flex;
          align-items:baseline;
          justify-content:space-between;
          gap:12px;
          padding-bottom:9px;
          border-bottom:1px solid rgba(255,255,255,.09);
        }

        .zuno-my-count{
          color:rgba(255,255,255,.55);
          font-family:"DM Sans",sans-serif !important;
          font-size:11px;
        }

        .zuno-my-playlists{
          display:block;
        }

        /* Actual playlist list: no fake album art, no colored gradients,
           no rounded SaaS cards. Just a clean music-library row. */
        .zuno-my-playlist{
          position:relative;
          display:grid;
          grid-template-columns:42px minmax(0,1fr) auto;
          align-items:center;
          gap:13px;
          width:100%;
          min-height:70px;
          padding:9px 0;
          box-sizing:border-box;
          border:0;
          border-bottom:1px solid rgba(255,255,255,.075);
          border-radius:0;
          background:transparent;
          color:#fff;
          text-align:left;
          cursor:pointer;
          transition:background .18s ease,padding-left .18s ease;
        }

        .zuno-my-playlist:hover{
          background:rgba(255,255,255,.025);
          padding-left:7px;
        }

        .zuno-my-playlist.is-selected{
          background:rgba(255,255,255,.035);
          box-shadow:inset 2px 0 0 rgba(255,255,255,.72);
          padding-left:7px;
        }

        .zuno-my-art{
          width:42px;
          height:42px;
          overflow:hidden;
          border:1px solid rgba(255,255,255,.10);
          border-radius:8px;
          display:grid;
          place-items:center;
          background:rgba(255,255,255,.055) !important;
          color:rgba(255,255,255,.68);
          font-family:"DM Sans",sans-serif !important;
          font-size:14px;
          box-shadow:none;
        }

        .zuno-my-playlist-name{
          min-width:0;
          color:rgba(255,255,255,.96);
          font-family:"DM Sans",sans-serif !important;
          font-size:14px;
          font-weight:600;
          line-height:1.35;
          white-space:nowrap;
          overflow:hidden;
          text-overflow:ellipsis;
        }

        .zuno-my-playlist-meta{
          margin-top:3px;
          color:rgba(255,255,255,.48);
          font-family:"DM Sans",sans-serif !important;
          font-size:11px;
        }

        .zuno-my-card-actions{
          display:flex;
          align-items:center;
          gap:8px;
        }

        .zuno-my-play{
          width:auto;
          height:auto;
          padding:5px 2px;
          border:0;
          border-radius:0;
          background:transparent;
          color:rgba(255,255,255,.58);
          display:grid;
          place-items:center;
          cursor:pointer;
          font-family:"DM Sans",sans-serif !important;
          font-size:13px;
          transition:color .18s ease,transform .18s ease;
        }

        .zuno-my-play:hover{
          transform:none;
          background:transparent;
          color:#fff;
        }

        .zuno-my-delete{
          width:24px;
          height:24px;
          border:0;
          background:transparent;
          color:rgba(255,255,255,.22);
          border-radius:0;
          cursor:pointer;
          font-family:"DM Sans",sans-serif !important;
          font-size:13px;
        }

        .zuno-my-delete:hover{
          color:rgba(255,255,255,.70);
          background:transparent;
        }

        .zuno-my-detail{
          margin-top:18px;
          padding:0;
          border:0;
          border-top:1px solid rgba(255,255,255,.09);
          border-radius:0;
          background:transparent;
        }

        .zuno-my-detail-head{
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:10px;
          padding:13px 0 8px;
        }

        .zuno-my-detail-title{
          min-width:0;
          color:rgba(255,255,255,.82);
          font-family:"DM Sans",sans-serif !important;
          font-size:11px;
          font-weight:600;
          overflow:hidden;
          text-overflow:ellipsis;
          white-space:nowrap;
        }

        .zuno-my-songs{
          max-height:150px;
          overflow:auto;
          scrollbar-width:thin;
        }

        .zuno-my-song{
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:10px;
          padding:7px 0;
          border-bottom:1px solid rgba(255,255,255,.055);
        }

        .zuno-my-song:last-child{border-bottom:0}

        .zuno-my-song-name{
          min-width:0;
          color:rgba(255,255,255,.88);
          font-family:"DM Sans",sans-serif !important;
          font-size:14px;
          white-space:nowrap;
          overflow:hidden;
          text-overflow:ellipsis;
        }

        .zuno-my-song-artist{
          margin-top:2px;
          color:rgba(255,255,255,.46);
          font-family:"DM Sans",sans-serif !important;
          font-size:10px;
        }

        .zuno-my-song-remove{
          border:0;
          background:transparent;
          color:rgba(255,255,255,.24);
          cursor:pointer;
          font-family:"DM Sans",sans-serif !important;
          font-size:13px;
        }

        .zuno-my-empty{
          padding:25px 10px;
          text-align:center;
          color:rgba(255,255,255,.52);
          font-family:"DM Sans",sans-serif !important;
          font-size:12px;
        }

        .zuno-my-message{
          margin-top:11px;
          color:rgba(255,190,170,.78);
          font-family:"DM Sans",sans-serif !important;
          font-size:11px;
          line-height:1.4;
        }

        @keyframes zunoMyFade{
          from{opacity:0}
          to{opacity:1}
        }

        @keyframes zunoMyEnter{
          from{opacity:0;transform:translateY(9px)}
          to{opacity:1;transform:translateY(0)}
        }

        @media(max-width:780px){
          .zuno-my-overlay{
            padding:12px;
            align-items:flex-end;
          }

          .zuno-my-modal{
            width:100%;
            max-height:92vh;
            padding:23px 18px 22px;
            border-radius:18px 18px 0 0;
          }

          .zuno-my-layout{
            grid-template-columns:1fr;
            gap:25px;
          }

          .zuno-my-sidebar{
            display:grid;
            grid-template-columns:1fr 1fr;
            gap:18px;
          }

          .zuno-my-create{
            grid-column:1/-1;
          }

          .zuno-my-import{
            grid-column:1/-1;
          }
        }

        @media(max-width:500px){
          .zuno-my-modal{padding:20px 15px 18px}
          .zuno-my-title{font-size:29px}
          .zuno-my-sidebar{display:flex}
          .zuno-my-playlist{
            grid-template-columns:38px minmax(0,1fr) auto;
            min-height:64px;
          }
          .zuno-my-art{
            width:38px;
            height:38px;
          }
        }

        @media(prefers-reduced-motion:reduce){
          .zuno-my-overlay,
          .zuno-my-modal{
            animation:none !important;
          }
          .zuno-my-action,
          .zuno-my-playlist,
          .zuno-my-play{
            transition:none !important;
          }
        }
      `}</style>

      <div
        className="zuno-my-overlay"
        onClick={onClose}
      >
        <div
          className="zuno-my-modal"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="zuno-my-head">
            <div>
              <div className="zuno-my-kicker">YOUR MUSIC</div>
              <h2 className="zuno-my-title">My Playlists</h2>
              <p className="zuno-my-sub">
                Create, manage and play your playlists.
              </p>
            </div>

            <button
              type="button"
              className="zuno-my-close"
              onClick={onClose}
              aria-label="Close playlists"
            >
              ×
            </button>
          </div>

          <div className="zuno-my-layout">

            <aside className="zuno-my-sidebar">

              <div className="zuno-my-create">
                <div className="zuno-my-create-label">CREATE</div>

                <div className="zuno-my-create-row">
                  <input
                    className="zuno-my-input"
                    placeholder="New playlist name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") create();
                    }}
                  />

                  <button
                    type="button"
                    className="zuno-my-create-btn"
                    onClick={create}
                    disabled={busy}
                  >
                    Create
                  </button>
                </div>
              </div>

              <div className="zuno-my-import">
                <div className="zuno-my-section-label">IMPORT</div>

                <div className="zuno-my-action-top">
                  <div className="zuno-my-action-icon">▶</div>
                  <div>
                    <div className="zuno-my-action-title">
                      Import from YouTube
                    </div>
                    <div className="zuno-my-action-copy">
                      Paste a YouTube playlist link
                    </div>
                  </div>
                </div>

                <div className="zuno-my-import-row" style={{marginTop:10}}>
                  <input
                    className="zuno-my-input"
                    placeholder="YouTube / YouTube Music URL"
                    value={onlineUrl}
                    onChange={(e) => setOnlineUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addOnlineSong();
                    }}
                  />
                </div>

                <button
                  type="button"
                  className="zuno-my-import-btn"
                  onClick={addOnlineSong}
                  disabled={busy}
                >
                  {onlineMode === "song" ? "Adding…" : "+ Add song"}
                </button>

                <button
                  type="button"
                  className="zuno-my-import-btn"
                  onClick={importOnlinePlaylist}
                  disabled={busy}
                >
                  {onlineMode === "playlist" ? "Importing…" : "Import playlist"}
                </button>
              </div>

              <button
                type="button"
                className="zuno-my-action"
                onClick={addCurrentSong}
                disabled={busy || !selected || !currentTrack}
              >
                <div className="zuno-my-action-top">
                  <div className="zuno-my-action-icon">♪</div>
                  <div>
                    <div className="zuno-my-action-title">Add current song</div>
                    <div className="zuno-my-action-copy">
                      Save the song currently playing
                    </div>
                  </div>
                </div>
              </button>

              <div className="zuno-my-hint">
                Select a playlist to manage its songs.
              </div>
            </aside>

            <section>
              <div className="zuno-my-list-head">
                <div className="zuno-my-section-label" style={{margin:0}}>
                  YOUR PLAYLISTS
                </div>

                <div className="zuno-my-count">
                  {playlists.length} {playlists.length === 1 ? "playlist" : "playlists"}
                </div>
              </div>

              {playlists.length === 0 ? (
                <div className="zuno-my-empty">
                  No playlists yet. Create your first one.
                </div>
              ) : (
                <div className="zuno-my-playlists">
                  {playlists.map((playlist, playlistIndex) => (
                    <div
                      key={playlist.id}
                      className={`zuno-my-playlist ${
                        selected?.id === playlist.id ? "is-selected" : ""
                      }`}
                      style={{
                        "--art-one": [
                          "#4a2c20",
                          "#3a2948",
                          "#21433f",
                          "#493327",
                          "#2e3650",
                        ][playlistIndex % 5],
                        "--art-two": [
                          "#b06d3c",
                          "#7661a6",
                          "#4c887b",
                          "#a25a38",
                          "#6876a6",
                        ][playlistIndex % 5],
                      }}
                      onClick={() => openPlaylist(playlist)}
                    >
                      <div className="zuno-my-art" aria-hidden="true">
                        ♪
                      </div>

                      <div>
                        <div className="zuno-my-playlist-name">
                          {playlist.name}
                        </div>
                        <div className="zuno-my-playlist-meta">
                          {selected?.id === playlist.id
                            ? `${songs.length} ${songs.length === 1 ? "song" : "songs"}`
                            : "Click to open"}
                        </div>
                      </div>

                      <div className="zuno-my-card-actions">
                        <button
                          type="button"
                          className="zuno-my-play"
                          title="Play playlist"
                          onClick={async (event) => {
                            event.stopPropagation();

                            try {
                              const data = await getPlaylistSongs(
                                playlist.id,
                                token
                              );

                              if (data?.length) {
                                onPlayPlaylist(data);
                                onClose();
                              } else {
                                setMessage("Playlist empty hai.");
                              }
                            } catch (e) {
                              setMessage(
                                e.message || "Playlist play नहीं हुई।"
                              );
                            }
                          }}
                        >
                          ▶
                        </button>

                        <button
                          type="button"
                          className="zuno-my-delete"
                          title="Delete playlist"
                          disabled={busy}
                          onClick={(event) => {
                            event.stopPropagation();
                            removePlaylist(playlist);
                          }}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selected && (
                <div className="zuno-my-detail">
                  <div className="zuno-my-detail-head">
                    <div className="zuno-my-detail-title">
                      {selected.name}
                    </div>

                    <button
                      type="button"
                      className="zuno-my-play"
                      onClick={() => {
                        if (songs.length) {
                          onPlayPlaylist(songs);
                          onClose();
                        }
                      }}
                      disabled={!songs.length}
                      title="Play this playlist"
                    >
                      ▶
                    </button>
                  </div>

                  <button
                    type="button"
                    className="zuno-my-add-btn"
                    onClick={addCurrentSong}
                    disabled={busy || !currentTrack}
                  >
                    + Add current song
                  </button>

                  {songs.length ? (
                    <div className="zuno-my-songs">
                      {songs.map((song) => (
                        <div key={song.id} className="zuno-my-song">
                          <div style={{minWidth:0}}>
                            <div className="zuno-my-song-name">
                              {song.song_name}
                            </div>
                            <div className="zuno-my-song-artist">
                              {song.artist}
                            </div>
                          </div>

                          <button
                            type="button"
                            className="zuno-my-song-remove"
                            onClick={() => removeSong(song)}
                            disabled={busy}
                            title="Remove song"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="zuno-my-empty">
                      This playlist is empty.
                    </div>
                  )}
                </div>
              )}

              {message && (
                <div className="zuno-my-message">
                  {message}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </>
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

  /*
    Library performance cache:
    - Per-user, so accounts never share song data.
    - Avoids repeated Supabase reads while the library is unchanged.
    - Prevents duplicate refresh requests.
  */
  const libraryCacheRef =
    useRef({
      userId: null,
      tracks: [],
      savedAt: 0,
    });

  const libraryRefreshInFlightRef =
    useRef(false);

  // Which source currently owns the player queue.
  // "recommended" must never be overwritten by the background
  // refresh of the user's personal playlists.
  const playbackSourceRef =
    useRef("library");


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

  const playerErrorSkipRef =
    useRef(0);

  const playerErrorAttemptsRef =
    useRef(0);

  const playerErrorTrackRef = useRef("");
  const playerRetryTimerRef = useRef(null);
  const autoplayIntentRef = useRef(false);


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
    recommendedOpen,
    setRecommendedOpen,
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
      setRecommendedOpen(false);
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
    async (
      force = false
    ) => {

      if (!user || !token) {
        return;
      }

      // Recommended playlists own the player while they are active.
      // Never let a background library refresh interfere with them.
      if (
        playbackSourceRef.current ===
        "recommended"
      ) {
        return;
      }

      if (
        libraryRefreshInFlightRef.current
      ) {
        return;
      }

      const CACHE_TTL =
        5 * 60 * 1000;

      const cache =
        libraryCacheRef.current;

      const cacheIsFresh =
        cache.userId === user.id &&
        Array.isArray(cache.tracks) &&
        cache.savedAt > 0 &&
        Date.now() - cache.savedAt <
          CACHE_TTL;

      // Normal background refreshes use the cache.
      if (
        !force &&
        cacheIsFresh
      ) {
        return;
      }

      libraryRefreshInFlightRef.current =
        true;

      try {
        const songs =
          await loadUserSongs(
            user.id,
            token
          );

        if (
          playbackSourceRef.current ===
          "recommended"
        ) {
          return;
        }

        const currentSongId =
          tracksRef.current?.[
            indexRef.current
          ]?.id ||
          null;

        const preservedIndex =
          currentSongId
            ? songs.findIndex(
                (song) =>
                  song.id ===
                  currentSongId
              )
            : -1;

        const storedPlayback =
          playbackRestoreRef.current ||
          getStoredPlayback();

        const restoredIndex =
          storedPlayback?.trackId
            ? songs.findIndex(
                (song) =>
                  song.id ===
                  storedPlayback.trackId
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

        const oldIds =
          tracksRef.current
            .map((track) => track?.id)
            .join("|");

        const newIds =
          songs
            .map((track) => track?.id)
            .join("|");

        libraryCacheRef.current = {
          userId: user.id,
          tracks: songs,
          savedAt: Date.now(),
        };

        // Don't cause a React queue update if nothing actually changed.
        if (
          oldIds === newIds &&
          tracksRef.current.length ===
            songs.length
        ) {
          return;
        }

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

        setQueueFocusIndex(
          safeIndex
        );

        // Do not reload YouTube if the current song still exists.
        if (
          !hadCurrentSong &&
          songs.length &&
          playerRef.current
        ) {
          playerRef.current.loadVideoById({
            videoId:
              songs[safeIndex].id,
            startSeconds:
              restoredIndex ===
                safeIndex &&
              storedPlayback
                ? storedPlayback.position
                : 0,
          });
        }

        if (!songs.length) {
          setError("");
          playerRef.current?.stopVideo?.();
        } else {
          setError("");
        }

      } catch (err) {
        console.error(err);

        // Keep already-loaded songs playable if a refresh fails.
        if (!tracksRef.current.length) {
          setError(
            err?.message ||
            "Tumhari playlists se songs load nahi ho sake."
          );
        }
      } finally {
        libraryRefreshInFlightRef.current =
          false;
      }
    };


  useEffect(() => {

    if (!user || !token)
      return;

    /* Let the first ZUNO UI paint before fetching playlist data. */
    const runInitialSongLoad =
      () => {
        refreshSongs(true);
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

    } else {
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

    /*
      Personal playlists do not need a database request every minute.
      Refresh at most every five minutes, and only while the tab is visible.
    */
    const interval =
      setInterval(
        () => {
          if (
            document.visibilityState ===
            "visible"
          ) {
            refreshSongs(false);
          }
        },
        5 * 60 * 1000
      );

    const handleVisibility =
      () => {
        if (
          document.visibilityState ===
          "visible"
        ) {
          refreshSongs(false);
        }
      };

    document.addEventListener(
      "visibilitychange",
      handleVisibility
    );

    return () => {

      cleanupInitialLoad?.();

      clearInterval(
        interval
      );
      if (playerRetryTimerRef.current) {
        clearTimeout(playerRetryTimerRef.current);
        playerRetryTimerRef.current = null;
      }

      document.removeEventListener(
        "visibilitychange",
        handleVisibility
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
          setRecommendedOpen(false);

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
      recommendedOpen ||
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
    recommendedOpen,
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

      if (playerRetryTimerRef.current) {
        clearTimeout(playerRetryTimerRef.current);
        playerRetryTimerRef.current = null;
      }

      const nextVideoId = songs[safeIndex]?.id;
      if (!nextVideoId) return;

      playerErrorTrackRef.current = nextVideoId;
      playerErrorAttemptsRef.current = 0;
      autoplayIntentRef.current = Boolean(autoplay);

      try {
        player.loadVideoById({
          videoId: nextVideoId,
          startSeconds: 0,
        });

        if (autoplay) {
          window.setTimeout(() => {
            try {
              if (playerRef.current === player) {
                if (volume > 0) {
                  player.setVolume(volume);
                  player.unMute?.();
                }
                player.playVideo();
              }
            } catch {}
          }, 80);
        } else {
          player.pauseVideo();
        }
      } catch (loadError) {
        console.warn("ZUNO playback load failed:", loadError);
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


          const nextProgress =
            total
              ? (
                  current /
                  total
                ) *
                100
              : 0;

          const nextElapsed =
            formatTime(
              current
            );

          const nextDuration =
            formatTime(
              total
            );

          setProgress(
            (previous) =>
              Math.abs(
                previous -
                nextProgress
              ) < 0.15
                ? previous
                : nextProgress
          );

          setElapsed(
            (previous) =>
              previous ===
              nextElapsed
                ? previous
                : nextElapsed
          );

          setDuration(
            (previous) =>
              previous ===
              nextDuration
                ? previous
                : nextDuration
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
        1000
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

                    if (volume > 0) {
                      event.target.setVolume(volume);
                      event.target.unMute?.();
                    } else {
                      event.target.setVolume(0);
                    }

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

                    if (autoplayIntentRef.current) {
                      window.setTimeout(() => {
                        try {
                          if (playerRef.current === event.target) {
                            if (volume > 0) {
                              event.target.setVolume(volume);
                              event.target.unMute?.();
                            }
                            event.target.playVideo();
                          }
                        } catch {}
                      }, 60);
                    }
                  },


                onStateChange:
                  (event) => {

                    const state =
                      event.data;

                    setPlaying(
                      state ===
                        YT.PlayerState
                          .PLAYING
                    );

                    if (
                      state ===
                      YT.PlayerState.PLAYING
                    ) {
                      playerErrorAttemptsRef.current = 0;
                      playerErrorTrackRef.current =
                        tracksRef.current[indexRef.current]?.id || "";
                      if (playerRetryTimerRef.current) {
                        clearTimeout(playerRetryTimerRef.current);
                        playerRetryTimerRef.current = null;
                      }
                      setError("");
                    }


                    if (
                      state ===
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

                onError:
                  (event) => {
                    const songs = tracksRef.current;
                    if (!songs.length) return;

                    const currentId = songs[indexRef.current]?.id || "";
                    if (!currentId) return;

                    if (playerErrorTrackRef.current !== currentId) {
                      playerErrorTrackRef.current = currentId;
                      playerErrorAttemptsRef.current = 0;
                    }

                    playerErrorAttemptsRef.current += 1;
                    const attempts = playerErrorAttemptsRef.current;
                    const hardUnavailable = [2, 100, 101, 150].includes(event.data);

                    if (hardUnavailable || attempts >= 3) {
                      if (playerRetryTimerRef.current) {
                        clearTimeout(playerRetryTimerRef.current);
                        playerRetryTimerRef.current = null;
                      }

                      const nextIndex =
                        (indexRef.current + 1) % songs.length;

                      setError("Skipping unavailable song…");
                      playerErrorTrackRef.current = songs[nextIndex]?.id || "";
                      playerErrorAttemptsRef.current = 0;

                      playerRetryTimerRef.current = window.setTimeout(() => {
                        playerRetryTimerRef.current = null;
                        changeTrack(nextIndex, true);
                      }, 140);
                      return;
                    }

                    setError("Trying to restore playback…");

                    if (playerRetryTimerRef.current) {
                      clearTimeout(playerRetryTimerRef.current);
                    }

                    const retryDelay = attempts === 1 ? 250 : 700;
                    playerRetryTimerRef.current = window.setTimeout(() => {
                      playerRetryTimerRef.current = null;
                      const player = playerRef.current;

                      if (!player || tracksRef.current[indexRef.current]?.id !== currentId) {
                        return;
                      }

                      try {
                        if (volume > 0) {
                          player.setVolume(volume);
                          player.unMute?.();
                        }
                        autoplayIntentRef.current = true;
                        player.loadVideoById({
                          videoId: currentId,
                          startSeconds: 0,
                        });
                        player.playVideo();
                      } catch (retryError) {
                        console.warn("ZUNO playback retry failed:", retryError);
                      }
                    }, retryDelay);
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
      if (!ready || !playerRef.current) return;

      if (playing) {
        autoplayIntentRef.current = false;
        playerRef.current.pauseVideo();
        return;
      }

      autoplayIntentRef.current = true;
      if (volume > 0) {
        playerRef.current.setVolume(volume);
        playerRef.current.unMute?.();
      }

      try {
        playerRef.current.playVideo();
      } catch {}
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
        setRecommendedOpen(true);
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

      // User explicitly chose a personal playlist, so the normal
      // library refresh is allowed to own the queue again.
      playbackSourceRef.current = "library";


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

      setRecommendedOpen(
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
     PLAY RECOMMENDED PLAYLIST INSIDE ZUNO
     ======================================================= */

  const playRecommendedPlaylist =
    async (playlist) => {

      if (!playlist?.url) return;

      try {
        setRecommendedOpen(false);
        setQueueOpen(false);

        const response = await fetch(
          "/api/youtube",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              url: playlist.url,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error ||
            "Recommended playlist load नहीं हुई।"
          );
        }

        if (
          !Array.isArray(data?.songs) ||
          !data.songs.length
        ) {
          throw new Error(
            "Is playlist mein playable songs नहीं मिले।"
          );
        }

        const mapped = data.songs
          .filter((song) => song?.id)
          .map((song) => ({
            id: song.id,
            title: song.title || "Unknown song",
            artist: song.artist || "Unknown artist",
          }));

        if (!mapped.length) {
          throw new Error(
            "Is playlist mein playable songs नहीं मिले।"
          );
        }

        // From this point onward the recommended playlist owns the
        // player queue. Background library refreshes must leave it alone.
        playbackSourceRef.current = "recommended";

        tracksRef.current = mapped;
        setTracks(mapped);
        indexRef.current = 0;
        setIndex(0);
        setQueueFocusIndex(0);
        playbackRestoreRef.current = null;
        setLiked(false);
        setProgress(0);
        setElapsed("0:00");
        setDuration("0:00");
        setError("");

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

        const startPlayback = () => {
          const player = playerRef.current;
          if (!player) return false;

          player.loadVideoById({
            videoId: mapped[0].id,
            startSeconds: 0,
          });

          return true;
        };

        if (!startPlayback()) {
          setTimeout(startPlayback, 200);
        }

      } catch (err) {
        console.error(err);
        setError(
          err?.message ||
          "Recommended playlist play नहीं हो सकी।"
        );
      }
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
            content:none !important;
            display:none !important;
          }

          .zuno-nav-brand{
            position:relative;
            display:inline-flex;
            align-items:center;
            color:#fff;
            text-decoration:none;
            font-family:"DM Sans",sans-serif !important;
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
            gap:22px;
            padding:0;
            border:0;
            border-radius:0;
            background:transparent;
            box-shadow:none;
            backdrop-filter:none;
            -webkit-backdrop-filter:none;
          }

          .zuno-nav-actions:hover{
            background:transparent;
            border-color:transparent;
            transform:none;
          }

          .zuno-nav-action{
            position:relative;
            display:inline-flex;
            align-items:center;
            justify-content:center;
            font-family:"DM Sans",sans-serif !important;
            min-height:36px;
            padding:0;
            border:0;
            border-radius:0;
            background:transparent;
            color:rgba(255,255,255,.9);
            cursor:pointer;
            font-size:12px;
            font-weight:800;
            letter-spacing:.1px;
            text-shadow:0 1px 10px rgba(0,0,0,.35);
            transition:color .28s ease,opacity .28s ease,transform .28s ease;
          }

          .zuno-nav-action:hover{
            background:transparent;
            border-color:transparent;
            color:#fff;
            opacity:1;
            transform:translateY(-1px);
          }

          .zuno-nav-action:active{
            transform:translateY(0) scale(.97);
          }

          .zuno-playlist-trigger{
            gap:7px;
            border:0;
            background:transparent;
            box-shadow:none;
            text-shadow:0 0 14px rgba(255,225,195,.18);
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
            background:transparent;
            border-color:transparent;
            box-shadow:none;
            text-shadow:0 0 18px rgba(255,225,195,.28);
          }

          @keyframes zunoPlaylistDot{
            0%,100%{opacity:.62;transform:scale(.82)}
            50%{opacity:1;transform:scale(1.16)}
          }

          .zuno-nav-count{
            display:inline-flex;
            align-items:center;
            font-family:"DM Sans",sans-serif !important;
            min-height:36px;
            padding:0 15px;
            border-left:0;
            border-radius:0;
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
              display:none !important;
            }

            .zuno-nav-actions{
              gap:12px;
              padding:0;
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
          .zuno-recommended-overlay{
            position:fixed !important; inset:0 !important; z-index:9999 !important;
            display:flex; align-items:center; justify-content:center; padding:28px;
            background:rgba(4,4,4,.62);
            backdrop-filter:blur(18px) saturate(115%); -webkit-backdrop-filter:blur(18px) saturate(115%);
            animation:zunoRecommendedFade .22s ease both;
          }
          .zuno-recommended-panel{
            position:relative; width:min(1080px,94vw); max-height:min(760px,88vh); overflow:auto;
            padding:28px; border:1px solid rgba(255,255,255,.18); border-radius:28px;
            background:linear-gradient(145deg,rgba(24,20,17,.94),rgba(9,9,9,.88));
            box-shadow:0 30px 100px rgba(0,0,0,.52),inset 0 1px 0 rgba(255,255,255,.08);
            color:#fff; animation:zunoRecommendedEnter .3s cubic-bezier(.2,.75,.2,1) both;
          }
          .zuno-recommended-panel::before{
            content:""; position:absolute; inset:-1px; border-radius:inherit; pointer-events:none;
            background:linear-gradient(120deg,rgba(255,255,255,.08),transparent 30%,transparent 70%,rgba(255,220,185,.08));
          }
          .zuno-recommended-panel-head{
            position:relative; display:flex; align-items:flex-start; justify-content:space-between; gap:20px; margin-bottom:22px;
          }
          .zuno-recommended-panel-kicker{
            margin:0 0 7px; color:rgba(255,255,255,.5); font-size:10px; font-weight:800; letter-spacing:2.4px; text-transform:uppercase;
          }
          .zuno-recommended-panel-title{
            margin:0; font-family:"DM Sans",sans-serif; font-size:clamp(30px,4vw,44px); line-height:.98; letter-spacing:-1.5px; font-weight:800;
            text-shadow:0 4px 25px rgba(0,0,0,.32);
          }
          .zuno-recommended-panel-sub{
            margin:9px 0 0; max-width:600px; color:rgba(255,255,255,.58); font-size:12px; line-height:1.55;
          }
          .zuno-recommended-panel-close{
            flex:0 0 auto; width:42px; height:42px; border:1px solid rgba(255,255,255,.14); border-radius:50%;
            background:rgba(255,255,255,.06); color:#fff; font-size:23px; line-height:1; cursor:pointer;
            transition:background .25s ease,border-color .25s ease,transform .25s ease;
          }
          .zuno-recommended-panel-close:hover{
            background:rgba(255,255,255,.12); border-color:rgba(255,255,255,.25); transform:rotate(4deg);
          }
          .zuno-recommended-panel-label{
            position:relative; margin:0 0 12px; color:rgba(255,255,255,.62); font-size:10px; font-weight:800; letter-spacing:1.8px; text-transform:uppercase;
          }
          .zuno-recommended-grid{
            position:relative; display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:10px;
          }
          @keyframes zunoRecommendedFade{from{opacity:0}to{opacity:1}}
          @keyframes zunoRecommendedEnter{from{opacity:0;transform:translateY(10px) scale(.985)}to{opacity:1;transform:translateY(0) scale(1)}}

          .zuno-recommended-card{
            appearance:none;
            -webkit-appearance:none;
            position:relative;
            min-height:138px;
            border:1px solid rgba(255,255,255,.13);
            border-radius:18px;
            padding:0;
            width:100%;
            font:inherit;
            text-align:left;
            cursor:pointer;
            overflow:hidden;
            text-decoration:none;
            color:#fff;
            background:var(--playlist-bg) center/cover no-repeat;
            box-shadow:0 16px 35px rgba(0,0,0,.24),inset 0 1px 0 rgba(255,255,255,.08);
            transition:transform .28s ease,border-color .28s ease,box-shadow .28s ease;
          }

          .zuno-recommended-card::after{
            content:"";
            position:absolute;
            inset:0;
            background:linear-gradient(
              180deg,
              rgba(0,0,0,.04) 0%,
              rgba(0,0,0,.08) 38%,
              rgba(0,0,0,.72) 100%
            );
            pointer-events:none;
          }

          .zuno-recommended-card:hover{
            transform:translateY(-4px);
            border-color:rgba(255,255,255,.28);
            box-shadow:0 22px 42px rgba(0,0,0,.34),inset 0 1px 0 rgba(255,255,255,.12);
          }

          .zuno-recommended-card:active{
            transform:translateY(-1px) scale(.99);
          }

          .zuno-recommended-card-inner{
            position:relative;
            z-index:1;
            min-height:138px;
            display:flex;
            align-items:flex-end;
            padding:16px 15px;
          }

          .zuno-recommended-card-inner h3{
            margin:0;
            max-width:100%;
            color:#fff;
            font-family:"DM Sans",sans-serif;
            font-size:15px;
            line-height:1.12;
            font-weight:800;
            letter-spacing:-.2px;
            text-shadow:0 2px 12px rgba(0,0,0,.55);
          }

          .zuno-recommended-card:hover .zuno-recommended-open{
            transform:translateY(0); opacity:1;
          }
          .zuno-recommended-open{
            display:inline-flex; align-items:center; gap:4px; margin-top:13px;
            color:rgba(255,255,255,.78); font-size:10px; font-weight:800;
            letter-spacing:.8px; text-transform:uppercase;
            transform:translateY(4px); opacity:.72;
            transition:transform .25s ease,opacity .25s ease;
          }
          @media(max-width:900px){
            .zuno-recommended-grid{display:flex;overflow-x:auto;gap:10px;padding-bottom:5px;scrollbar-width:none}
            .zuno-recommended-grid::-webkit-scrollbar{display:none}
            .zuno-recommended-card{flex:0 0 190px;min-height:138px}

          }
          @media(max-width:700px){
            .zuno-recommended-trigger,.zuno-my-playlists-trigger{padding:0 9px !important;font-size:10px !important}
          }
          @media(max-width:600px){
            .zuno-recommended-overlay{align-items:flex-end;padding:0}
            .zuno-recommended-panel{width:100%;max-height:91vh;padding:20px 16px 24px;border-radius:26px 26px 0 0}
            .zuno-recommended-panel-title{font-size:30px}
            .zuno-recommended-panel-sub{font-size:11px}
            .zuno-recommended-card{flex-basis:72vw;max-width:260px;min-height:150px}
            .zuno-recommended-card-inner{min-height:150px;padding:17px}
          }
          @media(max-width:470px){
            .zuno-recommended-trigger,.zuno-my-playlists-trigger{padding:0 6px !important;font-size:8.5px !important}
          }
          @media(prefers-reduced-motion:reduce){
            .zuno-recommended-overlay,.zuno-recommended-panel,.zuno-playlist-trigger-dot{animation:none !important}
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
              className="zuno-nav-action zuno-playlist-trigger zuno-recommended-trigger"
              onClick={() => setRecommendedOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={recommendedOpen}
            >
              <span className="zuno-playlist-trigger-dot" aria-hidden="true" />
              ♫ Recommended
            </button>

            <button
              type="button"
              className="zuno-nav-action zuno-my-playlists-trigger"
              onClick={() => setPlaylistOpen(true)}
            >
              ♡ My Playlists
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


        {/* RECOMMENDED PLAYLISTS */}
        {recommendedOpen && (
          <div
            className="zuno-recommended-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="zuno-recommended-panel-title"
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                setRecommendedOpen(false);
              }
            }}
          >
            <div
              className="zuno-recommended-panel"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="zuno-recommended-panel-head">
                <div>
                  <p className="zuno-recommended-panel-kicker">ZUNO MUSIC</p>
                  <h2 id="zuno-recommended-panel-title" className="zuno-recommended-panel-title">
                    Recommended playlists.
                  </h2>
                  <p className="zuno-recommended-panel-sub">
                    Ready-made playlists curated by ZUNO. Pick a mood and let the music take it from there.
                  </p>
                </div>
                <button
                  type="button"
                  className="zuno-recommended-panel-close"
                  onClick={() => setRecommendedOpen(false)}
                  aria-label="Close recommended playlists"
                >
                  ×
                </button>
              </div>
              <p className="zuno-recommended-panel-label">5 curated moods</p>
              <div className="zuno-recommended-grid">
                {RECOMMENDED_PLAYLISTS.map((playlist) => (
                  <button
                    key={playlist.id}
                    type="button"
                    className="zuno-recommended-card"
                    onClick={() => playRecommendedPlaylist(playlist)}
                    aria-label={`Play ${playlist.title} in ZUNO`}
                    style={{
                      "--playlist-bg": `linear-gradient(rgba(0,0,0,.08),rgba(0,0,0,.08)),url(${playlist.background})`,
                    }}
                  >
                    <div className="zuno-recommended-card-inner">
                      <h3>{playlist.title}</h3>
                    </div>
                  </button>
                ))}
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
            onLibraryChanged={() =>
              refreshSongs(true)
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
