function getIds(url) {
  let parsed;

  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Invalid YouTube URL.");
  }

  const playlistId =
    parsed.searchParams.get("list");

  const videoId =
    parsed.searchParams.get("v") ||
    (
      parsed.hostname.includes("youtu.be")
        ? parsed.pathname
            .replace(/^\/+/, "")
            .split("/")[0]
        : null
    );

  return {
    playlistId,
    videoId,
  };
}


async function youtubeRequest(params) {
  const key =
    process.env.YOUTUBE_API_KEY;

  if (!key) {
    const error =
      new Error(
        "YOUTUBE_API_KEY is not configured on Vercel."
      );

    error.status = 500;

    throw error;
  }

  const url =
    new URL(
      "https://www.googleapis.com/youtube/v3/playlistItems"
    );

  Object.entries({
    ...params,
    key,
  }).forEach(
    ([name, value]) => {
      url.searchParams.set(
        name,
        value
      );
    }
  );

  const response =
    await fetch(url);

  const data =
    await response.json();

  if (!response.ok) {
    const error =
      new Error(
        data?.error?.message ||
        "YouTube API request failed."
      );

    error.status =
      response.status;

    throw error;
  }

  return data;
}


async function videoRequest(
  videoId
) {
  const key =
    process.env.YOUTUBE_API_KEY;

  if (!key) {
    const error =
      new Error(
        "YOUTUBE_API_KEY is not configured on Vercel."
      );

    error.status = 500;

    throw error;
  }

  const url =
    new URL(
      "https://www.googleapis.com/youtube/v3/videos"
    );

  url.searchParams.set(
    "part",
    "snippet"
  );

  url.searchParams.set(
    "id",
    videoId
  );

  url.searchParams.set(
    "key",
    key
  );

  const response =
    await fetch(url);

  const data =
    await response.json();

  if (!response.ok) {
    const error =
      new Error(
        data?.error?.message ||
        "YouTube API request failed."
      );

    error.status =
      response.status;

    throw error;
  }

  return data;
}


async function playlistRequest(
  playlistId
) {
  const key =
    process.env.YOUTUBE_API_KEY;

  if (!key) {
    const error =
      new Error(
        "YOUTUBE_API_KEY is not configured on Vercel."
      );

    error.status = 500;

    throw error;
  }

  const url =
    new URL(
      "https://www.googleapis.com/youtube/v3/playlists"
    );

  url.searchParams.set(
    "part",
    "snippet"
  );

  url.searchParams.set(
    "id",
    playlistId
  );

  url.searchParams.set(
    "key",
    key
  );

  const response =
    await fetch(url);

  const data =
    await response.json();

  if (!response.ok) {
    const error =
      new Error(
        data?.error?.message ||
        "YouTube playlist request failed."
      );

    error.status =
      response.status;

    throw error;
  }

  return data;
}


async function getPlaylistItems(
  playlistId
) {
  const songs = [];

  let pageToken = "";


  do {
    const params = {
      part:
        "snippet,contentDetails",

      playlistId,

      maxResults:
        "50",
    };


    if (pageToken) {
      params.pageToken =
        pageToken;
    }


    const data =
      await youtubeRequest(
        params
      );


    for (
      const item of
      data?.items || []
    ) {

      const videoId =
        item?.contentDetails
          ?.videoId ||
        item?.snippet
          ?.resourceId
          ?.videoId;


      if (!videoId)
        continue;


      const title =
        item?.snippet?.title ||
        "Unknown song";


      const artist =
        item?.snippet
          ?.videoOwnerChannelTitle ||
        "Unknown artist";


      songs.push({
        id:
          videoId,

        title:
          title,

        artist:
          artist.replace(
            /\s*-\s*Topic$/i,
            ""
          ),
      });
    }


    pageToken =
      data?.nextPageToken ||
      "";

  } while (pageToken);


  let title =
    "Imported Playlist";


  try {
    const playlistData =
      await playlistRequest(
        playlistId
      );

    title =
      playlistData
        ?.items?.[0]
        ?.snippet
        ?.title ||
      title;

  } catch {
    // Keep fallback title.
  }


  return {
    title,
    songs,
  };
}


export default async function handler(
  req,
  res
) {

  if (
    req.method !==
    "POST"
  ) {

    return res
      .status(405)
      .json({
        error:
          "Method not allowed.",
      });
  }


  try {

    const input =
      typeof req.body ===
      "string"

        ? JSON.parse(
            req.body
          )

        : req.body;


    const rawUrl =
      String(
        input?.url ||
        ""
      ).trim();


    if (!rawUrl) {

      return res
        .status(400)
        .json({
          error:
            "YouTube URL is required.",
        });
    }


    const {
      playlistId,
      videoId,
    } =
      getIds(rawUrl);


    /* =========================================
       PLAYLIST
       ========================================= */

    if (playlistId) {

      const result =
        await getPlaylistItems(
          playlistId
        );


      if (
        !result.songs.length
      ) {

        return res
          .status(404)
          .json({
            error:
              "No public songs were found in this playlist.",
          });
      }


      return res
        .status(200)
        .json({
          type:
            "playlist",

          playlistId,

          title:
            result.title,

          songs:
            result.songs,
        });
    }


    /* =========================================
       SINGLE VIDEO
       ========================================= */

    if (videoId) {

      const data =
        await videoRequest(
          videoId
        );


      const video =
        data?.items?.[0];


      if (!video) {

        return res
          .status(404)
          .json({
            error:
              "Video not found or unavailable.",
          });
      }


      return res
        .status(200)
        .json({
          type:
            "video",

          songs: [
            {
              id:
                videoId,

              title:
                video
                  ?.snippet
                  ?.title ||
                "Unknown song",

              artist:
                video
                  ?.snippet
                  ?.channelTitle ||
                "Unknown artist",
            },
          ],
        });
    }


    return res
      .status(400)
      .json({
        error:
          "Paste a YouTube video or YouTube playlist URL.",
      });

  } catch (error) {

    console.error(
      "YouTube resolver error:",
      error
    );


    return res
      .status(
        error.status ||
        500
      )
      .json({
        error:
          error.message ||
          "Could not resolve the link.",
      });
  }
}