/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  // Add this if you're doing static export
  // output: 'export',
  
  // Skip generating error pages during build
  generateBuildId: async () => {
    return 'build-id'
  },
}

export default nextConfig