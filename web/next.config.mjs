/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep dev and production build outputs separate to avoid chunk cache collisions.
  distDir: process.env.NODE_ENV === "production" ? ".next-build" : ".next",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
    ],
  },
};

export default nextConfig;
