"use client";
import './globals.css';
import type { AppProps } from 'next/app';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useUserActivityTracking } from '../app/hooks/useUserActivityTracking';

function ActivityTracker() {
  useUserActivityTracking();
  return null;
}

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-950 text-white">
      <ActivityTracker />
      <Navbar />
      <main className="flex-1">
        <Component {...pageProps} />
      </main>
      <Footer />
    </div>
  );
}
