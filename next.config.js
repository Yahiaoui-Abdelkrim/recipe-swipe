// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   images: {
//     domains: [
//       'www.themealdb.com',
//       'images.unsplash.com',
//       'placehold.co',
//       'lh3.googleusercontent.com',
//       'downshiftology.com'
//     ],
//   },
// }

// module.exports = nextConfig 
/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: '**', // Allows all domains
        },
        {
          protocol: 'http',
          hostname: '**', // Allows all domains over HTTP
        },
      ],
    },
  };
  
  module.exports = nextConfig;
  