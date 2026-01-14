import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Open Graph Meta Tags - For Discord, Facebook, etc */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Armstrong Haulage" />
        <meta property="og:title" content="Armstrong Haulage" />
        <meta property="og:description" content="Coming Soon..." />
        <meta property="og:image" content="https://armstronghaulage.com/logo.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content="https://armstronghaulage.com" />

        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Armstrong Haulage" />
        <meta name="twitter:description" content="Coming Soon..." />
        <meta name="twitter:image" content="https://armstronghaulage.com/logo.jpg" />
        <meta name="twitter:site" content="@ArmstrongHaulage" />

        {/* General Meta Tags */}
        <meta name="description" content="Coming Soon..." />
        <meta name="theme-color" content="#000000" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        
        {/* Preconnect to external resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
