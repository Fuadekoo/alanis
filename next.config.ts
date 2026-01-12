import type { NextConfig } from "next";

// Force non-interactive, no-color terminal during build to avoid raw-mode issues
// process.env.CI = process.env.CI || "1";
// process.env.TERM = process.env.TERM || "dumb";
// process.env.NO_COLOR = process.env.NO_COLOR || "1";
// process.env.NEXT_TELEMETRY_DISABLED =
//   process.env.NEXT_TELEMETRY_DISABLED || "1";

const nextConfig: NextConfig = {
  // Prevent ESLint and TypeScript errors from failing production builds
  // eslint: {
  //   ignoreDuringBuilds: true,
  // },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
