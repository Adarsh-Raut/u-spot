/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: [
          'i.scdn.co',           // Standard Spotify images
          'mosaic.scdn.co',      // Playlist mosaics
          'seeded.scdn.co',      // Seeded playlists
          'lineup-images.scdn.co', // Lineup images
          'image-cdn-fa.spotifycdn.com', // CDN images
          'images-ak.spotifycdn.com'    // Alternative CDN
        ],
      },
};

export default nextConfig;
