/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.HYDRA_NEXT_DIST_DIR || ".next",
  transpilePackages: ["@hydrasleuth/agents", "@hydrasleuth/shared", "@hydrasleuth/magicblock-integration"],
};

export default nextConfig;
