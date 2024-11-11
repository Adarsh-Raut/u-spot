"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface Playlist {
  id: string;
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      default: {
        url: string;
      };
    };
  };
}

export default function YouTubePlaylists() {
  const { data: session } = useSession();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log(session?.user.accessToken); // Add this line to log the access token to the console
    const fetchPlaylists = async () => {
      if (!session?.user.accessToken) {
        setError("No access token available");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          "https://www.googleapis.com/youtube/v3/playlists?part=snippet&mine=true",
          {
            headers: {
              Authorization: `Bearer ${session.user.accessToken}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch playlists");
        }

        const data = await response.json();
        setPlaylists(data.items);
      } catch (err) {
        setError("Error fetching playlists");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylists();
  }, [session]);

  const handleCreatePlaylist = async () => {
    if (!session?.user.accessToken) {
      setError("No access token available");
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
              title: "New Playlist",
              description: "A new playlist created from our app",
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create playlist");
      }

      const newPlaylist = await response.json();
      setPlaylists([...playlists, newPlaylist]);
    } catch (err) {
      setError("Error creating playlist");
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="stroke-current shrink-0 h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Your YouTube Playlists</h2>
      <button onClick={handleCreatePlaylist} className="btn btn-primary mb-4">
        Create New Playlist
      </button>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {playlists.map((playlist) => (
          <div key={playlist.id} className="card bg-base-100 shadow-xl">
            <figure>
              <img
                src={playlist.snippet.thumbnails.default.url}
                alt={playlist.snippet.title}
              />
            </figure>
            <div className="card-body">
              <h2 className="card-title">{playlist.snippet.title}</h2>
              <p>{playlist.snippet.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
