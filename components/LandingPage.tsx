"use client";

// Landing Page Component
import Link from "next/link";
import Image from "next/image";

import { useState, useRef, useEffect, useMemo, memo } from 'react';
import {
  ArrowRight,
  Car,
  Users,
  Download,
  Truck,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Twitch,
  Youtube,
} from "lucide-react";
import PublicCBModal from './PublicCBModal';
import WIPModal from './WIPModal';
import { motion, useMotionValue, useTransform, animate, useInView, Variants, useScroll, useSpring, AnimatePresence } from "framer-motion";
import { Archivo_Black } from "next/font/google";

const archivoBlack = Archivo_Black({
  weight: "400",
  subsets: ["latin"],
});

const backgroundImages = [
  "/background/1.png",
  "/background/2.png",
  "/background/3.png",
  "/background/4.jpg",
  "/background/5.png",
];

const CountUp = ({ end }: { end: number }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest: number) => {
    const num = Math.round(latest);
    if (num < 1000) {
      return num.toLocaleString();
    }
    if (num < 1_000_000) {
      const val = Math.floor((num / 1000) * 10) / 10;
      return `${val.toLocaleString()}K`;
    }
    const val = Math.floor((num / 1_000_000) * 10) / 10;
    return `${val.toLocaleString()}M`;
  });
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (inView) {
      const controls = animate(count, end, { duration: 2.5, ease: [0.22, 1, 0.36, 1] });
      return controls.stop;
  }
  }, [inView, end, count]);

  return (
    <span ref={ref} className="inline-flex items-center justify-center min-w-20 tabular-nums" role="status" aria-live="polite" aria-atomic="true">
      <motion.span>{rounded}</motion.span>
    </span>
  )
}

const TiltCard = ({ children, className, animate }: { children: React.ReactNode, className?: string, animate?: React.ComponentProps<typeof motion.div>['animate'] }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseX = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseY = useSpring(y, { stiffness: 150, damping: 15 });

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    const xPct = (clientX - left) / width - 0.5;
    const yPct = (clientY - top) / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  const rotateX = useTransform(mouseY, [-0.5, 0.5], [7, -7]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-7, 7]);

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      animate={animate}
      whileHover={{ scale: 1.05, backgroundColor: "rgba(23, 23, 23, 1)" }}
      className={className}
    >
      <div style={{ transform: "translateZ(20px)" }}>
        {children}
      </div>
    </motion.div>
  );
};

interface LandingPageProps {
  miles?: number;
  members?: number;
  jobsDelivered?: number;
}

interface Streamer {
  username: string;
  platform: string;
  name: string;
  channelId?: string;
  offlineImage?: string;
}

interface StreamStatus {
  isLive: boolean;
  videoId?: string;
  followers?: number;
  lastLive?: string;
}

async function fetchStreamStatus(platform: string, id: string): Promise<StreamStatus> {
  try {
    const params = new URLSearchParams({ platform, id });
    const res = await fetch(`/api/stream/status?${params.toString()}`);
    if (!res.ok) return { isLive: false };
    return res.json();
  } catch (error) {
    console.error('Error fetching stream status:', error);
    return { isLive: false };
  }
}

const formatCount = (num?: number) => {
  if (!num) return null;
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

const timeAgo = (dateString?: string) => {
  if (!dateString) return "Offline";
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  return "Recently";
};

function LandingPage({ miles: milesProp, members: membersProp, jobsDelivered: jobsDeliveredProp }: LandingPageProps) {
  const [stats, setStats] = useState({
    miles: Number(milesProp) || 0,
    members: Number(membersProp) || 0,
    jobsDelivered: Number(jobsDeliveredProp) || 0
  });
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch stats from Firebase
        const response = await fetch('/api/db?type=stats');
        if (response.ok) {
          const data = await response.json();
          if (data && Array.isArray(data) && data.length > 0) {
            setStats((prev) => ({
              ...prev,
              miles: data[0].miles || prev.miles,
              members: data[0].members || prev.members,
              jobsDelivered: data[0].jobsDelivered || prev.jobsDelivered,
            }));
            console.log("Stats data:", data[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching stats from Firebase:", error);
      }
    };

    fetchStats();
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWIPOpen, setIsWIPOpen] = useState(true);
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1000], [0, 200]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const slideshowProgress = useMotionValue(0);
  const slideshowProgressPercent = useTransform(slideshowProgress, (v: number) => `${v}%`);
  const [isPlaying, setIsPlaying] = useState(true);
  const hostname = typeof window !== "undefined" ? window.location.hostname : "localhost";
  const [liveStatuses, setLiveStatuses] = useState<Record<string, StreamStatus>>({});
  const [streamers, setStreamers] = useState<Streamer[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/db?type=livestreamers');
        if (!res.ok) return;
        const data = await res.json();
        if (mounted) setStreamers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch livestreamers', err);
      }
    })();
    return () => { mounted = false };
  }, []);

  useEffect(() => {
    if (!streamers || streamers.length === 0) return;
    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const fetchStatuses = async () => {
      const newStatuses: Record<string, StreamStatus> = {};
      let anyLive = false;

      await Promise.all(streamers.map(async (streamer) => {
        const id = streamer.platform === 'Twitch' ? streamer.username : streamer.channelId;
        if (id) {
          const status = await fetchStreamStatus(streamer.platform, id as string);
          newStatuses[streamer.username] = status;
          if (status.isLive) anyLive = true;
        }
      }));

      if (isMounted) {
        setLiveStatuses(newStatuses);
        timeoutId = setTimeout(fetchStatuses, anyLive ? 30000 : 60000);
      }
    };

    fetchStatuses();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [streamers]);

  useEffect(() => {
    if (backgroundImages.length <= 1 || !isPlaying) return;
    
    slideshowProgress.set(0);
    const controls = animate(slideshowProgress, 100, {
      duration: 7,
      ease: "linear",
      onComplete: () => {
        setCurrentImageIndex((prev: number) => (prev + 1) % backgroundImages.length);
      }
    });
    return controls.stop;
  }, [currentImageIndex, isPlaying, slideshowProgress]);

  const nextImage = () => {
    setCurrentImageIndex((prev: number) => (prev + 1) % backgroundImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev: number) => (prev - 1 + backgroundImages.length) % backgroundImages.length);
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <div className="flex flex-col bg-neutral-950 min-h-screen">
      {/* Hero Section */}
      <div className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-linear-to-b from-black/80 via-black/50 to-neutral-950 z-10" />
          <motion.div
            style={{ y }}
            className="relative w-full h-full"
          >
            <AnimatePresence mode="popLayout">
              <motion.div
                key={currentImageIndex}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{
                  opacity: { duration: 1.5 },
                  scale: { duration: 8, ease: "linear" }
                }}
                className="absolute inset-0"
              >
                <Image
                  src={backgroundImages[currentImageIndex]}
                  alt={`Background ${currentImageIndex + 1}`}
                  fill
                  className="object-cover"
                  priority={currentImageIndex === 0}
                  sizes="100vw"
                />
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Navigation Buttons */}
          <div className="absolute inset-0 z-20 flex items-center justify-between px-4 pointer-events-none">
             <button onClick={prevImage} aria-label="Previous background" className="p-2 rounded-full bg-black/20 hover:bg-black/40 text-white/70 hover:text-white transition-all pointer-events-auto backdrop-blur-sm border border-white/10">
               <ChevronLeft className="w-8 h-8" />
             </button>
             <button onClick={nextImage} aria-label="Next background" className="p-2 rounded-full bg-black/20 hover:bg-black/40 text-white/70 hover:text-white transition-all pointer-events-auto backdrop-blur-sm border border-white/10">
               <ChevronRight className="w-8 h-8" />
             </button>
          </div>

        <div className="relative z-20 text-center px-4 max-w-6xl mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div variants={itemVariants} className="mb-6">
              <span className="py-1 px-3 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium uppercase tracking-wider">
                Virtual Trucking Company
              </span>
            </motion.div>
            <motion.h1 variants={itemVariants} className={`text-5xl md:text-7xl tracking-tight mb-8 drop-shadow-2xl ${archivoBlack.className}`}>
              <span className="text-white">ARMSTRONG</span>
              <span className="block text-transparent bg-clip-text bg-linear-to-r from-purple-400 to-purple-600">HAULAGE</span>
            </motion.h1>
            <motion.p variants={itemVariants} className="mt-4 text-xl md:text-2xl text-gray-300 mb-12 font-light max-w-3xl mx-auto leading-relaxed">
              Professional Virtual Trucking. Delivering excellence across Europe and America with a community that cares.
            </motion.p>

            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-8">
              <TiltCard 
                className="text-center p-4 rounded-2xl bg-neutral-900/80 backdrop-blur-sm border border-white/10 transition-colors"
              >
                <div className="flex items-center justify-center gap-2 text-purple-400 mb-2"><Truck className="w-5 h-5" /></div>
                <p className="text-3xl font-bold text-white"><CountUp end={stats.jobsDelivered} /></p>
                <p className="text-gray-400 text-xs uppercase tracking-wider mt-1">Jobs Delivered</p>
              </TiltCard>
              <TiltCard 
                className="text-center p-4 rounded-2xl bg-neutral-900/80 backdrop-blur-sm border border-white/10 transition-colors"
              >
                <div className="flex items-center justify-center gap-2 text-purple-400 mb-2"><Car className="w-5 h-5" /></div>
                <p className="text-3xl font-bold text-white"><CountUp end={stats.miles} /></p>
                <p className="text-gray-400 text-xs uppercase tracking-wider mt-1">Total Miles</p>
              </TiltCard>
              <TiltCard 
                className="text-center p-4 rounded-2xl bg-neutral-900/80 backdrop-blur-sm border border-white/10 transition-colors"
              >
                <div className="flex items-center justify-center gap-2 text-purple-400 mb-2"><Users className="w-5 h-5" /></div>
                <p className="text-3xl font-bold text-white"><CountUp end={stats.members} /></p>
                <p className="text-gray-400 text-xs uppercase tracking-wider mt-1">Drivers</p>
              </TiltCard>
            </motion.div>

            <motion.div variants={itemVariants} className="flex flex-col items-center gap-6">
              <div className="flex flex-col sm:flex-row justify-center gap-6 relative transition-all duration-300">
                <Link href="https://hub.truckyapp.com/vtc/armstrong-haulage" target="_blank" rel="noopener noreferrer">
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="group relative px-8 py-4 bg-purple-600 hover:bg-purple-700 rounded-full font-bold text-lg transition-all shadow-[0_0_40px_-10px_rgba(147,51,234,0.5)] flex items-center justify-center gap-3 overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center gap-2">Join Our VTC <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></span>
                  </motion.div>
                </Link>
                <Link href="https://discord.gg/95MeYjFPre" target="_blank" rel="noopener noreferrer">
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    role="link"
                    aria-label="Join our Discord (opens in new tab)"
                    className="px-8 py-4 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-full font-bold text-lg transition-all flex items-center justify-center gap-3"
                  >
                    <Image src='/discord.svg' alt='Discord Logo' width={20} height={20}/> Join Discord
                  </motion.div>
                </Link>
              </div>
              
              <motion.button
                type="button"
                onClick={() => setIsModalOpen(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-full font-bold text-lg transition-all flex items-center justify-center gap-3"
              >
                <Download className="w-5 h-5 group-hover:translate-x-1 transition-transform" /><span className="relative z-10 flex items-center gap-2">Public CB</span>
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
        

        <PublicCBModal open={isModalOpen} onClose={() => setIsModalOpen(false)} />
        <WIPModal open={isWIPOpen} onClose={() => setIsWIPOpen(false)} />

        <div className="absolute bottom-8 left-0 right-0 z-30 flex items-center justify-center gap-4 px-4 max-w-4xl mx-auto pointer-events-none">
          <button 
            onClick={() => setIsPlaying(!isPlaying)} 
            aria-label="Toggle slideshow play or pause"
            aria-pressed={!isPlaying}
            type="button"
            className="p-2 rounded-full bg-black/20 hover:bg-black/40 text-white/70 hover:text-white transition-all pointer-events-auto backdrop-blur-sm border border-white/10"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          
          <div className="flex-1 flex gap-2 pointer-events-auto">
          {backgroundImages.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Show background ${index + 1}`}
              aria-pressed={index === currentImageIndex}
              className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden hover:bg-white/30 transition-colors"
              onClick={() => {
                setCurrentImageIndex(index);
                slideshowProgress.set(0);
              }}
            >
              <motion.div 
                className="h-full bg-white"
                style={{ 
                  width: index === currentImageIndex 
                    ? slideshowProgressPercent 
                    : index < currentImageIndex ? "100%" : "0%" 
                }}
              />
            </button>
          ))}
          </div>
        </div>
        
      </div>

      {/* Livestreamers Section */}
      {false && (
      <section className="py-24 px-4 w-full bg-neutral-950 relative z-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight">
              LIVE <span className="text-transparent bg-clip-text bg-linear-to-r from-purple-400 to-purple-600">STREAMERS</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              Follow our drivers as they haul across the virtual roads.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(streamers as Streamer[]).map((streamer, index: number) => {
              const status = liveStatuses[streamer.username];
              const isLive = status?.isLive || false;
              const profileUrl = streamer.platform === "Twitch" 
                ? `https://twitch.tv/${streamer.username}` : `https://youtube.com/channel/${streamer.channelId}`;
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`group relative rounded-3xl overflow-hidden border transition-all duration-500 ${
                    isLive 
                      ? "bg-neutral-900/90 border-purple-500/50 shadow-[0_0_40px_-10px_rgba(168,85,247,0.2)]" 
                      : "bg-neutral-900/50 border-white/5 hover:border-white/10 hover:bg-neutral-900/70"
                  }`}
                >
                  {/* Video Embed */}
                  <div className="relative aspect-video bg-black overflow-hidden">
                    {isLive ? (
                      <>
                        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1 bg-red-600 text-white text-[10px] font-bold rounded-full shadow-lg shadow-red-900/20 animate-pulse">
                          <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                          LIVE NOW
                        </div>
                        {streamer.platform === "Twitch" ? (
                          <iframe
                            src={`https://player.twitch.tv/?channel=${streamer.username}&parent=${hostname}&muted=true`}
                            className="absolute inset-0 w-full h-full"
                            allowFullScreen
                          />
                        ) : (
                          <iframe // Assuming streamer has channelId for YouTube
                            src={status?.videoId 
                              ? `https://www.youtube-nocookie.com/embed/${status.videoId}?autoplay=1&mute=1&modestbranding=1&rel=0&controls=0&iv_load_policy=3&fs=0&disablekb=1&playsinline=1`
                              : `https://www.youtube-nocookie.com/embed/live_stream?channel=${streamer.channelId}&autoplay=1&mute=1&modestbranding=1&rel=0&controls=0&iv_load_policy=3&fs=0&disablekb=1&playsinline=1`
                            }
                            className="absolute inset-0 w-full h-full"
                            allowFullScreen
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          />
                        )}
                      </>
                    ) : (
                      <div className="absolute inset-0">
                        <Image
                          src={streamer.offlineImage || "/offline.jpg"} 
                          alt={`${streamer.name} Offline`}
                          fill
                          className="object-cover opacity-50 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500"
                        />
                        <div className="absolute inset-0 bg-black/50 group-hover:bg-black/30 transition-colors" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                           <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                              <Play className="w-5 h-5 text-white fill-white" />
                           </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors line-clamp-1">{streamer.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          {streamer.platform === 'Twitch' ? <Twitch className="w-3.5 h-3.5 text-[#9146FF]" /> : <Youtube className="w-3.5 h-3.5 text-[#FF0000]" />}
                          <span className="text-xs font-medium text-gray-400">{streamer.platform}</span>
                        </div>
                      </div>
                      {status?.followers && (
                        <div className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-xs font-medium text-gray-300">
                          {formatCount(status.followers)} <span className="text-gray-500">{streamer.platform === 'YouTube' ? 'Subs' : 'Followers'}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <div className="text-xs text-gray-500">
                        {!isLive && status?.lastLive ? (
                          <span>Last live {timeAgo(status.lastLive)}</span>
                        ) : isLive ? (
                          <span className="text-purple-400 font-medium">Streaming now</span>
                        ) : (
                          <span>Offline</span>
                        )}
                      </div>
                      
                      <Link href={profileUrl} target="_blank" className="flex items-center gap-1 text-xs font-bold text-white hover:text-purple-400 transition-colors">
                        VISIT CHANNEL <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
      )}
    </div>
  );
}

export default memo(LandingPage);