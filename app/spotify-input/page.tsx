"use client";

import { useState } from "react";
import SpotifyInput from "@/app/components/input";
import ConversionProgress from "@/app/components/progress";
import Image from "next/image";

interface Track {
  name: string;
  artists: string[];
  album: string;
  albumImage: string;
}

interface PlaylistData {
  name: string;
  description: string;
  image: string;
  tracks: Track[];
  totalTracks: number;
}

export default function SpotifyToYouTube() {
  const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET;

  const [conversionProgress, setConversionProgress] = useState<number | null>(
    null
  );
  const [playlistData, setPlaylistData] = useState<PlaylistData | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    console.log(data);
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
          item.track.album.images[item.track.album.images.length - 1]?.url, // Get smallest image
      })),
    };
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
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
