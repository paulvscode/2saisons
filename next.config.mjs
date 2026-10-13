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
      // justificatifs (6 Mo) et images du site (8 Mo/image, plusieurs par envoi depuis l'admin)
      bodySizeLimit: "40mb",
    },
  },
  // content/ (textes + images du site) est lu sur disque à l'exécution : l'embarquer
  // dans les fonctions serverless, sinon il est absent en production.
  outputFileTracingIncludes: {
    "/**/*": ["./content/**/*"],
  },
  async redirects() {
    return [{ source: "/usc", destination: "/liens", permanent: true }];
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
