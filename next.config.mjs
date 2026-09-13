/** @type {import('next').NextConfig} */
const nextConfig = {
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
