import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Character Encoding and Viewport */}
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />

        {/* SEO & General Meta Tags */}
        <meta name="description" content="Armstrong Haulage - Professional virtual trucking community and leaderboard platform. Track your cargo, earn rewards, and compete with other drivers." />
        <meta name="theme-color" content="#000000" />
        <meta name="keywords" content="trucking, virtual trucking, ATS, SCS, haulage, leaderboard, community" />
        <meta name="author" content="Armstrong Haulage" />
        <meta name="robots" content="index, follow" />

        {/* Open Graph Meta Tags - For Discord, Facebook, etc */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Armstrong Haulage" />
        <meta property="og:title" content="Armstrong Haulage - Virtual Trucking Community" />
        <meta property="og:description" content="Professional virtual trucking community and leaderboard platform. Track your cargo, earn rewards, and compete with other drivers." />
        <meta property="og:image" content="https://armstronghaulage.com/logo.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:url" content="https://armstronghaulage.com" />
        <meta property="og:locale" content="en_US" />

        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Armstrong Haulage - Virtual Trucking Community" />
        <meta name="twitter:description" content="Professional virtual trucking community and leaderboard platform. Track your cargo, earn rewards, and compete with other drivers." />
        <meta name="twitter:image" content="https://armstronghaulage.com/logo.jpg" />
        <meta name="twitter:site" content="@ArmstrongHaulage" />
        <meta name="twitter:creator" content="@ArmstrongHaulage" />

        {/* Favicon & App Icons */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />

        {/* Preconnect & DNS Prefetch for Performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://firebase.googleapis.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />

        {/* Security & Standards */}
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="format-detection" content="telephone=no" />
      </Head>
      <body className="bg-gray-900 text-white">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
