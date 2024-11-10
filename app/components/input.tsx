"use client";

import { useState } from "react";

export default function SpotifyInput({
  onConvert,
}: {
  onConvert: (url: string) => void;
}) {
  const [playlistUrl, setPlaylistUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConvert(playlistUrl);
  };

  return (
    <div className="card w-96 bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Convert Spotify Playlist to YouTube</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Spotify Playlist URL</span>
            </label>
            <input
              type="url"
              placeholder="https://open.spotify.com/playlist/..."
              className="input input-bordered w-full"
              value={playlistUrl}
              onChange={(e) => setPlaylistUrl(e.target.value)}
              required
            />
          </div>
          <div className="card-actions justify-end mt-4">
            <button type="submit" className="btn btn-primary">
              Convert to YouTube Playlist
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
