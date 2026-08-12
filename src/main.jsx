import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const SHEET_ID =
  "1Owb2596w3vp_JWOtKGkpiR94OUO73CMRYANDZbBKHYw";

const SHEET_GID = "0";

const SHEET_URL =
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${SHEET_GID}`;

function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && insideQuotes && next === '"') {
      cell += '"';
      i++;
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      row.push(cell.trim());
      cell = "";
    } else if (
      (char === "\n" || char === "\r") &&
      !insideQuotes
    ) {
      if (char === "\r" && next === "\n") i++;

      row.push(cell.trim());

      if (row.some((value) => value !== "")) {
        rows.push(row);
      }

      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  if (cell || row.length) {
    row.push(cell.trim());

    if (row.some((value) => value !== "")) {
      rows.push(row);
    }
  }

  return rows;
}

function getYouTubeId(url) {
  if (!url) return null;

  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.replace("/", "");
    }

    if (
      parsed.hostname.includes("youtube.com") ||
      parsed.hostname.includes("music.youtube.com")
    ) {
      return parsed.searchParams.get("v");
    }

    return null;
  } catch {
    return null;
  }
}

async function loadSongs() {
  const response = await fetch(
    `${SHEET_URL}&cache=${Date.now()}`
  );

  if (!response.ok) {
    throw new Error("Google Sheet load failed");
  }

  const csv = await response.text();
  const rows = parseCSV(csv);

  if (rows.length < 2) return [];

  const headers = rows[0].map((header) =>
    header.toLowerCase().trim()
  );

  const songIndex = headers.indexOf("song name");
  const artistIndex = headers.indexOf("artist");
  const urlIndex = headers.indexOf("url");

  if (
    songIndex === -1 ||
    artistIndex === -1 ||
    urlIndex === -1
  ) {
    throw new Error(
      "Sheet must contain Song Name, Artist and URL columns"
    );
  }

  return rows
    .slice(1)
    .map((row) => {
      const songName = row[songIndex]?.trim();
      const artist = row[artistIndex]?.trim();
      const url = row[urlIndex]?.trim();

      return {
        id: getYouTubeId(url),
        title: songName || "अज्ञात गीत",
        artist: artist || "अज्ञात कलाकार",
        url,
      };
    })
    .filter(
      (song) =>
        song.id &&
        song.title &&
        song.artist
    );
}

function loadYouTubeAPI() {
  return new Promise((resolve) => {
    if (window.YT?.Player) {
      resolve(window.YT);
      return;
    }

    const previousCallback =
      window.onYouTubeIframeAPIReady;

    window.onYouTubeIframeAPIReady = () => {
      previousCallback?.();
      resolve(window.YT);
    };

    if (
      !document.querySelector(
        'script[src="https://www.youtube.com/iframe_api"]'
      )
    ) {
      const script = document.createElement("script");

      script.src =
        "https://www.youtube.com/iframe_api";

      document.head.appendChild(script);
    }
  });
}

function App() {
  const playerRef = useRef(null);
  const indexRef = useRef(0);
  const tracksRef = useRef([]);

  const [tracks, setTracks] = useState([]);
  const [index, setIndex] = useState(0);

  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);

  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState("0:00");
  const [duration, setDuration] = useState("0:00");

  const [volume, setVolume] = useState(80);
  const [queueOpen, setQueueOpen] = useState(false);
  const [liked, setLiked] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const formatTime = (seconds) => {
    const s = Math.max(
      0,
      Math.floor(Number(seconds) || 0)
    );

    return `${Math.floor(s / 60)}:${String(
      s % 60
    ).padStart(2, "0")}`;
  };

  const refreshSongs = async () => {
    try {
      const songs = await loadSongs();

      if (!songs.length) {
        throw new Error(
          "Google Sheet में कोई valid song नहीं मिला।"
        );
      }

      tracksRef.current = songs;
      setTracks(songs);

      if (indexRef.current >= songs.length) {
        indexRef.current = 0;
        setIndex(0);
      }

      setError("");
      setLoading(false);
    } catch (err) {
      console.error(err);

      setError(
        "गीतों की सूची लोड नहीं हो सकी।"
      );

      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSongs();

    const interval = setInterval(
      refreshSongs,
      60000
    );

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setQueueOpen(false);
      }
    };

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow =
      queueOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [queueOpen]);

  const changeTrack = (
    nextIndex,
    autoplay = true
  ) => {
    const songs = tracksRef.current;

    if (!songs.length) return;

    const safeIndex =
      (nextIndex + songs.length) %
      songs.length;

    indexRef.current = safeIndex;

    setIndex(safeIndex);
    setLiked(false);

    setProgress(0);
    setElapsed("0:00");
    setDuration("0:00");

    const player = playerRef.current;

    if (!player) return;

    player.loadVideoById({
      videoId: songs[safeIndex].id,
      startSeconds: 0,
    });

    if (!autoplay) {
      player.pauseVideo();
    }

    setQueueOpen(false);
  };

  useEffect(() => {
    if (!tracks.length) return;

    let cancelled = false;

    const interval = setInterval(() => {
      const player =
        playerRef.current;

      if (!player?.getDuration) return;

      const total =
        player.getDuration() || 0;

      const current =
        player.getCurrentTime() || 0;

      setProgress(
        total
          ? (current / total) * 100
          : 0
      );

      setElapsed(
        formatTime(current)
      );

      setDuration(
        formatTime(total)
      );
    }, 500);

    loadYouTubeAPI().then((YT) => {
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
            videoId: tracks[0].id,

            playerVars: {
              playsinline: 1,
              controls: 1,
              rel: 0,
              iv_load_policy: 3,
              modestbranding: 1,
              origin:
                window.location.origin,
            },

            events: {
              onReady: (event) => {
                setReady(true);
                event.target.setVolume(80);
              },

              onStateChange: (event) => {
                setPlaying(
                  event.data ===
                    YT.PlayerState.PLAYING
                );

                if (
                  event.data ===
                  YT.PlayerState.ENDED
                ) {
                  const next =
                    (indexRef.current + 1) %
                    tracksRef.current.length;

                  changeTrack(next, true);
                }
              },
            },
          }
        );
    });

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [tracks.length]);

  const togglePlay = () => {
    if (
      !ready ||
      !playerRef.current
    ) {
      return;
    }

    if (playing) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const seek = (event) => {
    if (
      !ready ||
      !playerRef.current
    ) {
      return;
    }

    const rect =
      event.currentTarget.getBoundingClientRect();

    const ratio = Math.min(
      1,
      Math.max(
        0,
        (event.clientX - rect.left) /
          rect.width
      )
    );

    const total =
      playerRef.current.getDuration() || 0;

    playerRef.current.seekTo(
      total * ratio,
      true
    );
  };

  if (loading) {
    return (
      <div className="scene">
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#f5dfb7",
            fontSize: "18px",
          }}
        >
          गीतों की सूची तैयार हो रही है...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="scene">
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#f5dfb7",
            fontSize: "18px",
          }}
        >
          {error}
        </div>
      </div>
    );
  }

  const currentTrack =
    tracks[index];

  return (
    <div className="site">

      <div className="scene">

        <header className="nav">

          <div className="logo">
            P's <span>favourites</span>
          </div>

          <div className="badge">
            मेरी पसंद · {tracks.length} गीत
          </div>

        </header>

        <main className="layout">

          <section className="hero">

            <div className="eyebrow">
              मेरी पसंद · मेरी धुनें
            </div>

            <h1>
              Priyam की
              <br />
              पसंद
            </h1>

            <p>
              हर गीत की अपनी एक कहानी होती है।
              ये वही धुनें हैं जिन्हें मैं बार-बार
              सुनना पसंद करता हूँ।
            </p>

          </section>

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
              <div id="youtube-player"></div>
            </div>

            <div className="now-row">

              <div>

                <div className="kicker">
                  अभी बज रहा है
                </div>

                <div className="song-title">
                  {currentTrack.title}
                </div>

                <div className="artist">
                  {currentTrack.artist}
                </div>

              </div>

              <button
                type="button"
                className={`heart ${
                  liked ? "active" : ""
                }`}
                onClick={() =>
                  setLiked(!liked)
                }
              >
                {liked ? "♥" : "♡"}
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
                    indexRef.current - 1
                  )
                }
              >
                ‹
              </button>

              <button
                type="button"
                className="control play"
                onClick={togglePlay}
              >
                {playing ? "Ⅱ" : "▶"}
              </button>

              <button
                type="button"
                className="control"
                onClick={() =>
                  changeTrack(
                    indexRef.current + 1
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

                  setVolume(value);

                  playerRef.current?.setVolume(
                    value
                  );
                }}
              />

              <button
                type="button"
                onClick={() =>
                  setQueueOpen(true)
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

        {queueOpen && (
          <div
            className="queue-overlay"
            onClick={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                setQueueOpen(false);
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
                    setQueueOpen(false)
                  }
                  style={{
                    float: "right",
                    width: "34px",
                    height: "34px",
                    border: "1px solid rgba(20,20,20,.2)",
                    borderRadius: "50%",
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: "22px",
                    lineHeight: "1",
                  }}
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
                      {i === index
                        ? "♪"
                        : "›"}
                    </span>

                  </button>
                )
              )}

            </div>
          </div>
        )}

      </div>

      <footer className="footer">
        This website is owned by{" "}
        <strong>
          Priyam Mishra
        </strong>
      </footer>

    </div>
  );
}

createRoot(
  document.getElementById("root")
).render(
  <App />
);