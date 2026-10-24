// Static export, deployed at https://briandaviddavidson.com/nobel/
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/nobel',
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
