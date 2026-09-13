/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      // Next caps server-action request bodies at 1 MB by default. Uploads go
      // through a server action, so anything larger was rejected before our
      // own 10 MB check ever ran — the action simply never returned, and the
      // client crashed reading `.ok` of undefined. Match the bucket's limit,
      // plus headroom for multipart overhead.
      bodySizeLimit: "12mb",
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      // Uploads served from the Supabase Storage `media` bucket. next/image
      // refuses any host not listed here, so CMS images would 400 without it.
      { protocol: "https", hostname: "vxuanjtolyyxfctvmdnw.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
};

export default nextConfig;
