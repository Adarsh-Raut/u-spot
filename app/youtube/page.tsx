"use client";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface TrackStatus {
  name: string;
  status: "pending" | "found" | "not found" | "added" | "error";
  message: string;
}

export default function YouTubePlaylists() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [playlistData, setPlaylistData] = useState<any>(null); // Updated type
  const [trackStatuses, setTrackStatuses] = useState<TrackStatus[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const data = searchParams.get("data");
    if (data) {
      setPlaylistData(JSON.parse(decodeURIComponent(data)));
    }
  }, [searchParams]);

  const handleCreatePlaylist = async () => {
    if (!session?.user?.accessToken) {
      setError("No access token available");
      return;
    }

    try {
      // Step 1: Create the playlist on YouTube
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
              title: playlistData.name,
              description: playlistData.description,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Error creating playlist: ${response.statusText}`);
      }

      const newPlaylist = await response.json();
      const playlistId = newPlaylist.id;

      // Step 2: Initialize track statuses and process each track
      const initialStatuses = playlistData.tracks.map((track: any) => ({
        name: track.name,
        status: "pending",
        message: "",
      }));
      setTrackStatuses(initialStatuses);

      for (const track of playlistData.tracks) {
        // Search for the track on YouTube
        try {
          const searchResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
              `${track.name} ${track.artists.join(" ")}`
            )}&type=video&maxResults=1`,
            {
              headers: {
                Authorization: `Bearer ${session.user.accessToken}`,
              },
            }
          );

          if (!searchResponse.ok) {
            throw new Error(`Error searching for track: ${track.name}`);
          }

          const searchData = await searchResponse.json();
          const videoId = searchData.items[0]?.id?.videoId;

          if (videoId) {
            // Update track status to "found"
            setTrackStatuses((prevStatuses) =>
              prevStatuses.map((status) =>
                status.name === track.name
                  ? { ...status, status: "found", message: "Video found" }
                  : status
              )
            );

            // Add the video to the new playlist
            await fetch(
              "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet",
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${session.user.accessToken}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  snippet: {
                    playlistId: playlistId,
                    resourceId: {
                      kind: "youtube#video",
                      videoId: videoId,
                    },
                  },
                }),
              }
            );

            // Update track status to "added"
            setTrackStatuses((prevStatuses) =>
              prevStatuses.map((status) =>
                status.name === track.name
                  ? { ...status, status: "added", message: "Added to playlist" }
                  : status
              )
            );
          } else {
            // Update track status to "not found"
            setTrackStatuses((prevStatuses) =>
              prevStatuses.map((status) =>
                status.name === track.name
                  ? {
                      ...status,
                      status: "not found",
                      message: "Video not found",
                    }
                  : status
              )
            );
          }
        } catch (err) {
          // Update track status to "error"
          setTrackStatuses((prevStatuses) =>
            prevStatuses.map((status) =>
              status.name === track.name
                ? { ...status, status: "error", message: "Error occurred" }
                : status
            )
          );
          console.error("Error processing track", track.name, err);
        }
      }
    } catch (err) {
      setError("Error creating playlist");
      console.error("Creating playlist failed", err);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Create YouTube Playlist</h2>
      <button onClick={handleCreatePlaylist} className="btn btn-primary mb-4">
        Create Playlist and Add Tracks
      </button>

      <div className="grid grid-cols-1 gap-4">
        {trackStatuses.map((track) => (
          <div
            key={track.name}
            className={`card shadow-md p-4 ${
              track.status === "added" ? "bg-green-100" : "bg-yellow-100"
            }`}
          >
            <h3 className="font-semibold">{track.name}</h3>
            <p>
              Status:{" "}
              <span
                className={`${
                  track.status === "added"
                    ? "text-green-600"
                    : track.status === "error"
                    ? "text-red-600"
                    : "text-yellow-600"
                }`}
              >
                {track.message}
              </span>
            </p>
          </div>
        ))}
      </div>

      {error && <p className="text-red-600 mt-4">{error}</p>}
    </div>
  );
}
