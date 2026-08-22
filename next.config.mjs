/** @type {import('next').NextConfig} */
const nextConfig = {
  cacheComponents: true,
  images: {
    remotePatterns: [{ hostname: "image.tmdb.org" }],
  },
};

export default nextConfig;
