"use client";

import { useState, useEffect } from "react";
import SpotifyInput from "@/app/components/input";
import ConversionProgress from "@/app/components/progress";
import Image from "next/image";
import { useSession } from "next-auth/react";

interface Track {
  name: string;
  artists: string[];
  album: string;
  albumImage: string;
  status: "pending" | "found" | "not found" | "added" | "error";
  message: string;
}

interface PlaylistData {
  name: string;
  description: string;
  image: string;
  tracks: Track[];
  totalTracks: number;
}

export default function SpotifyToYouTube() {
  const { data: session } = useSession();
  const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET;

  const [conversionProgress, setConversionProgress] = useState<number | null>(
    null
  );
  const [playlistData, setPlaylistData] = useState<PlaylistData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [youtubePlaylistId, setYoutubePlaylistId] = useState<string | null>(
    null
  );

  const getAccessToken = async () => {
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: "grant_type=client_credentials",
    });

    const data = await response.json();
    return data.access_token;
  };

  const extractPlaylistId = (url: string) => {
    const regex = /playlist\/([a-zA-Z0-9]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const fetchPlaylist = async (playlistId: string, accessToken: string) => {
    const response = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch playlist");
    }

    const data = await response.json();
    return {
      name: data.name,
      description: data.description,
      image: data.images[0]?.url,
      totalTracks: data.tracks.total,
      tracks: data.tracks.items.map((item: any) => ({
        name: item.track.name,
        artists: item.track.artists.map((artist: any) => artist.name),
        album: item.track.album.name,
        albumImage:
          item.track.album.images[item.track.album.images.length - 1]?.url,
        status: "pending",
        message: "",
      })),
    };
  };

  const createYouTubePlaylist = async () => {
    if (!session?.user?.accessToken) {
      setError("No YouTube access token available");
      return;
    }

    try {
      const response = await fetch(
        "https://www.googleapis.com/youtube/v3/playlists?part=snippet",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.user.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            snippet: {
              title: playlistData?.name || "New Playlist",
              description: playlistData?.description || "Created via app",
            },
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        console.error("Error creating playlist:", data);
        throw new Error(
          `Error creating YouTube playlist: ${data.error.message}`
        );
      }

      console.log("Created playlist:", data); // Log the full response for debugging
      setYoutubePlaylistId(data.id); // Ensure this is correctly set
      return data.id;
    } catch (err) {
      console.error(err);
      setError("Failed to create YouTube playlist");
    }
  };

  const addAllTracksToYouTubePlaylist = async () => {
    console.log(youtubePlaylistId);
    let yTubePlaylistId = youtubePlaylistId;

    if (!yTubePlaylistId) {
      yTubePlaylistId = await createYouTubePlaylist();
      console.log(yTubePlaylistId);
      if (!yTubePlaylistId) {
        setError("Failed to create or fetch YouTube playlist ID");
        return;
      }
    }

    for (const track of playlistData?.tracks || []) {
      try {
        const searchResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
            `${track.name} ${track.artists.join(" ")}`
          )}&type=video&maxResults=1`,
          {
            headers: {
              Authorization: `Bearer ${session?.user?.accessToken}`,
            },
          }
        );

        if (!searchResponse.ok) {
          throw new Error(`Error searching for track: ${track.name}`);
        }

        const searchData = await searchResponse.json();
        const videoId = searchData.items[0]?.id?.videoId;

        if (videoId) {
          await fetch(
            "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${session?.user.accessToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                snippet: {
                  playlistId: yTubePlaylistId,
                  resourceId: {
                    kind: "youtube#video",
                    videoId: videoId,
                  },
                },
              }),
            }
          );

          track.status = "added";
          track.message = "Added to YouTube playlist";
        } else {
          track.status = "not found";
          track.message = "Video not found on YouTube";
        }
      } catch (err) {
        track.status = "error";
        track.message = "Error adding to YouTube";
        console.error(err);
      }

      setPlaylistData((prevData) =>
        prevData
          ? {
              ...prevData,
              tracks: prevData.tracks.map((t) =>
                t.name === track.name ? track : t
              ),
            }
          : null
      );
    }
  };

  const handleConvert = async (url: string) => {
    try {
      setError(null);
      setConversionProgress(0);

      const playlistId = extractPlaylistId(url);
      if (!playlistId) {
        throw new Error("Invalid Spotify playlist URL");
      }

      const accessToken = await getAccessToken();
      setConversionProgress(30);

      const playlist = await fetchPlaylist(playlistId, accessToken);
      setPlaylistData(playlist);

      setConversionProgress(100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setConversionProgress(null);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-base-200 p-4">
      <SpotifyInput onConvert={handleConvert} />

      {error && (
        <div className="alert alert-error mt-4">
          <span>{error}</span>
        </div>
      )}

      {conversionProgress !== null && (
        <ConversionProgress progress={conversionProgress} />
      )}

      {playlistData && (
        <div className="mt-8 w-full max-w-3xl">
          <div className="card bg-base-100 shadow-xl">
            <figure className="px-6 pt-6">
              <Image
                src={playlistData.image}
                alt={playlistData.name}
                width={300}
                height={300}
                className="rounded-xl"
              />
            </figure>
            <div className="card-body">
              <h2 className="card-title text-2xl">{playlistData.name}</h2>
              <p className="text-base-content/70">{playlistData.description}</p>
              <p className="text-base-content/70">
                {playlistData.totalTracks} tracks
              </p>

              <div className="divider"></div>

              <ul className="space-y-4">
                {playlistData.tracks.map((track, index) => (
                  <li
                    key={index}
                    className="flex items-center gap-4 p-2 hover:bg-base-200 rounded-lg transition-colors"
                  >
                    {track.albumImage && (
                      <Image
                        src={track.albumImage}
                        alt={track.album}
                        width={48}
                        height={48}
                        className="rounded-md"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{track.name}</p>
                      <p className="text-sm text-base-content/70 truncate">
                        {track.artists.join(", ")} • {track.album}
                      </p>
                      <p className="text-sm mt-1">
                        Status:{" "}
                        <span
                          className={
                            track.status === "added"
                              ? "text-green-600"
                              : track.status === "error"
                              ? "text-red-600"
                              : "text-yellow-600"
                          }
                        >
                          {track.message}
                        </span>
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              <button
                className="btn btn-primary mt-6"
                onClick={addAllTracksToYouTubePlaylist}
              >
                Add All to YouTube
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
