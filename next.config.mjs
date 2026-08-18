/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // iTunes/Apple Music album artwork
      { protocol: 'https', hostname: '*.mzstatic.com' },
    ],
  },
}

export default nextConfig
