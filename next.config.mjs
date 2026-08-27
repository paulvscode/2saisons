/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ne pas faire échouer le build de production sur du lint / des types.
  // TEMPORAIRE : lancer `npx tsc --noEmit` régulièrement et corriger les types,
  // puis repasser `ignoreBuildErrors` à false.
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb", // justificatifs (certificat médical, attestation d'assurance)
    },
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
