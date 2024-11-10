"use client";

import { useState } from "react";
import SpotifyInput from "@/app/components/input";
import ConversionProgress from "@/app/components/progress";

interface Track {
  name: string;
  artists: string[];
  album: string;
}

interface PlaylistData {
  name: string;
  tracks: Track[];
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
    return {
      name: data.name,
      tracks: data.tracks.items.map((item: any) => ({
        name: item.track.name,
        artists: item.track.artists.map((artist: any) => artist.name),
        album: item.track.album.name,
      })),
    };
  };

  const handleConvert = async (url: string) => {
    try {
      setError(null);
      setConversionProgress(0);

      // Extract playlist ID from URL
      const playlistId = extractPlaylistId(url);
      if (!playlistId) {
        throw new Error("Invalid Spotify playlist URL");
      }

      // Get access token
      const accessToken = await getAccessToken();

      // Fetch playlist data
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-base-200">
      <SpotifyInput onConvert={handleConvert} />

      {conversionProgress !== null && (
        <ConversionProgress progress={conversionProgress} />
      )}

      {playlistData && (
        <div className="mt-8 w-full max-w-2xl">
          <h2 className="text-2xl font-bold mb-4">{playlistData.name}</h2>
          <div className="bg-base-100 rounded-lg p-4">
            <ul className="space-y-2">
              {playlistData.tracks.map((track, index) => (
                <li key={index} className="p-2 hover:bg-base-200 rounded">
                  <p className="font-medium">{track.name}</p>
                  <p className="text-sm text-gray-500">
                    {track.artists.join(", ")} • {track.album}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
