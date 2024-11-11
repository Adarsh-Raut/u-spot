"use client";

import { signIn } from "next-auth/react";

export default function SignIn() {
  const handleSignIn = () => {
    signIn("google", { callbackUrl: "/spotify-input" });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-base-200">
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Welcome</h2>
          <p>Sign in to convert your Spotify playlists to YouTube</p>
          <div className="card-actions justify-end">
            <button onClick={handleSignIn} className="btn btn-primary">
              Sign in with Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
