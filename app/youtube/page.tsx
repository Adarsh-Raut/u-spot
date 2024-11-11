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
    const fetchPlaylists = async () => {
      if (!session?.user?.accessToken) {
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
          throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();

        // Check if playlists exist in the data structure
        if (data.items) {
          setPlaylists(data.items);
        } else {
          setError("No playlists found");
        }
      } catch (err) {
        setError("Error fetching playlists");
        console.error("Fetching playlists failed", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylists();
  }, [session]);

  const handleCreatePlaylist = async () => {
    if (!session?.user?.accessToken) {
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
        throw new Error(`Error creating playlist: ${response.statusText}`);
      }

      const newPlaylist = await response.json();
      setPlaylists((prevPlaylists) => [...prevPlaylists, newPlaylist]);
    } catch (err) {
      setError("Error creating playlist");
      console.error("Creating playlist failed", err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading loading-spinner loading-lg"></div>
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
