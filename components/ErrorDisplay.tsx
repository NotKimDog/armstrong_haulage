"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Home, ArrowLeft, RefreshCcw, LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ErrorDisplayProps {
  code: string | number;
  title: string;
  message: string;
  theme: "amber" | "red" | "blue" | "purple";
  Icon: LucideIcon;
  onRetry?: () => void;
  audioSrc?: string;
}

const Rain = () => {
  const [drops, setDrops] = useState<{ id: number; x: string; duration: number; delay: number }[]>([]);

  useEffect(() => {
    setDrops(
      [...Array(20)].map((_, i) => ({
        id: i,
        x: Math.random() * 100 + "%",
        duration: Math.random() * 1 + 0.5,
        delay: Math.random() * 2,
      }))
    );
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden opacity-20">
      {drops.map((drop) => (
        <motion.div
          key={drop.id}
          initial={{ y: -100, x: drop.x, opacity: 0 }}
          animate={{ y: "100vh", opacity: [0, 1, 0] }}
          transition={{
            duration: drop.duration,
            repeat: Infinity,
            delay: drop.delay,
            ease: "linear",
          }}
          className="absolute w-0.5 h-10 bg-linear-to-b from-transparent to-white/50"
          style={{ left: drop.x }}
        />
      ))}
    </div>
  );
};

const Lightning = ({ flash }: { flash: boolean }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: flash ? [0, 0.6, 0.1, 0.8, 0] : 0 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 bg-white z-50 pointer-events-none mix-blend-overlay"
    />
  );
};

const RainDrops = () => {
  const [drops, setDrops] = useState<
    { id: number; x: number; y: number; scale: number; slide: boolean; yTarget: number; duration: number }[]
  >([]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.hidden) return;
      const isSlide = Math.random() > 0.7;
      const newDrop = {
        id: Date.now() + Math.random(),
        x: Math.random() * 100,
        y: Math.random() * 100,
        scale: Math.random() * 0.5 + 0.5,
        slide: isSlide,
        yTarget: isSlide ? Math.random() * 300 + 100 : 0,
        duration: isSlide ? Math.random() * 2 + 1 : Math.random() * 5 + 3,
      };
      setDrops((prev) => [...prev.slice(-80), newDrop]);
    }, 150);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 z-40 pointer-events-none overflow-hidden">
      {drops.map((drop) => (
        <motion.div
          key={drop.id}
          initial={{ opacity: 0, y: 0 }}
          animate={
            drop.slide
              ? { opacity: [0, 0.8, 0], y: [0, drop.yTarget] }
              : { opacity: [0, 0.5, 0.3] }
          }
          transition={{
            duration: drop.duration,
            ease: drop.slide ? "easeIn" : "easeInOut",
          }}
          className="absolute rounded-full"
          style={{
            left: `${drop.x}%`,
            top: `${drop.y}%`,
            width: `${(drop.slide ? 3 : 5) * drop.scale}px`,
            height: `${(drop.slide ? 10 : 5) * drop.scale}px`,
            background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8), rgba(255,255,255,0.1))",
            boxShadow: "inset 1px 1px 1px rgba(255,255,255,0.4), 1px 1px 2px rgba(0,0,0,0.3)",
            filter: "blur(0.5px)",
          }}
        />
      ))}
    </div>
  );
};

const DiagnosticsLog = ({ theme, message }: { theme: string; message: string }) => {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const messages = [
      "Initializing system diagnostics...",
      "Checking hydraulic pressure... OK",
      "Verifying manifest integrity... FAILED",
      "Route calculation... ERROR",
      `Error: ${message.substring(0, 25)}...`,
      "Attempting to re-establish connection...",
      "Signal lost.",
      "System reboot initiated...",
    ];

    let i = 0;
    let timeout: NodeJS.Timeout;

    const nextLog = () => {
      setLogs((prev) => [...prev, messages[i]].slice(-5));
      const isLast = i === messages.length - 1;
      i = (i + 1) % messages.length;
      timeout = setTimeout(nextLog, isLast ? 10000 : 1000);
    };

    timeout = setTimeout(nextLog, 1000);
    return () => clearTimeout(timeout);
  }, [message]);

  const colors: Record<string, string> = {
    red: "text-red-400 border-red-900/30 bg-red-950/30",
    amber: "text-amber-400 border-amber-900/30 bg-amber-950/30",
    blue: "text-blue-400 border-blue-900/30 bg-blue-950/30",
    purple: "text-purple-400 border-purple-900/30 bg-purple-950/30",
  };

  const colorClass = colors[theme] || colors.red;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className={`mt-8 p-4 rounded-md border ${colorClass} font-mono text-xs text-left w-full max-w-md mx-auto overflow-hidden backdrop-blur-md`}
    >
      <div className="flex items-center gap-2 mb-2 opacity-70 border-b border-white/10 pb-2">
        <div className={`w-2 h-2 rounded-full bg-current animate-pulse`} />
        <span className="uppercase tracking-widest">SYSTEM_LOG</span>
      </div>
      <div className="space-y-1 font-mono">
        {logs.map((log, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`opacity-80 ${
              log.includes("ERROR") || log.includes("FAILED") || log.includes("lost") || log.includes("Error:")
                ? "text-red-500 font-bold"
                : log.includes("OK")
                ? "text-green-500 font-bold"
                : ""
            }`}
          >
            <span className="opacity-30 mr-2">{`>`}</span>
            {log}
          </motion.div>
        ))}
        <motion.div
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          className="inline-block w-2 h-4 bg-current align-middle ml-1"
        />
      </div>
    </motion.div>
  );
};

export default function ErrorDisplay({
  code,
  title,
  message,
  theme,
  Icon,
  onRetry,
  audioSrc,
}: ErrorDisplayProps) {
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [flash, setFlash] = useState(false);
  const [weather, setWeather] = useState<'clear' | 'rain' | 'storm'>('clear');

  useEffect(() => {
    if (audioRef.current && audioSrc) {
      audioRef.current.volume = 0.5;
      // Attempt to play audio. Browsers may block this if there hasn't been user interaction yet.
      audioRef.current.play().catch(() => {});
    }
  }, [audioSrc]);

  useEffect(() => {
    const weathers: ('clear' | 'rain' | 'storm')[] = ['clear', 'rain', 'storm'];
    // Use setTimeout to avoid synchronous state update warning during effect execution
    const timer = setTimeout(() => {
      setWeather(weathers[Math.floor(Math.random() * weathers.length)]);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (weather !== 'storm') return;

    let timeout: NodeJS.Timeout;

    const triggerFlash = () => {
      setFlash(true);
      setTimeout(() => setFlash(false), 150);

      // Random interval between 3 and 10 seconds
      const nextFlash = Math.random() * 7000 + 3000;
      timeout = setTimeout(triggerFlash, nextFlash);
    };

    timeout = setTimeout(triggerFlash, 2000);
    return () => clearTimeout(timeout);
  }, [weather]);

  const colors = {
    amber: {
      selection: "selection:bg-amber-500/30",
      gradientFrom: "from-neutral-900/50",
      gradientVia: "via-neutral-950/80",
      lineGradient: "from-amber-500/10",
      lineColor: "#fbbf24",
      lineShadow: "rgba(251,191,36,0.6)",
      iconBg: "bg-amber-500/10",
      iconBorder: "border-amber-500/20",
      iconColor: "text-amber-500",
      glow: "bg-amber-500/30",
      buttonBg: "bg-amber-600",
      buttonHover: "hover:bg-amber-700",
      buttonShadow: "shadow-amber-500/20",
    },
    red: {
      selection: "selection:bg-red-500/30",
      gradientFrom: "from-neutral-900/50",
      gradientVia: "via-neutral-950/80",
      lineGradient: "from-red-500/10",
      lineColor: "#ef4444",
      lineShadow: "rgba(239,68,68,0.6)",
      iconBg: "bg-red-500/10",
      iconBorder: "border-red-500/20",
      iconColor: "text-red-500",
      glow: "bg-red-500/20",
      buttonBg: "bg-red-600",
      buttonHover: "hover:bg-red-700",
      buttonShadow: "shadow-red-500/20",
    },
    blue: {
      selection: "selection:bg-blue-500/30",
      gradientFrom: "from-neutral-900/50",
      gradientVia: "via-neutral-950/80",
      lineGradient: "from-blue-500/10",
      lineColor: "#3b82f6",
      lineShadow: "rgba(59,130,246,0.6)",
      iconBg: "bg-blue-500/10",
      iconBorder: "border-blue-500/20",
      iconColor: "text-blue-500",
      glow: "bg-blue-500/30",
      buttonBg: "bg-blue-600",
      buttonHover: "hover:bg-blue-700",
      buttonShadow: "shadow-blue-500/20",
    },
    purple: {
      selection: "selection:bg-purple-500/30",
      gradientFrom: "from-neutral-900/50",
      gradientVia: "via-neutral-950/80",
      lineGradient: "from-purple-500/10",
      lineColor: "#a855f7",
      lineShadow: "rgba(168,85,247,0.6)",
      iconBg: "bg-purple-500/10",
      iconBorder: "border-purple-500/20",
      iconColor: "text-purple-500",
      glow: "bg-purple-500/30",
      buttonBg: "bg-purple-600",
      buttonHover: "hover:bg-purple-700",
      buttonShadow: "shadow-purple-500/20",
    },
  };

  const c = colors[theme];

  return (
    <div className={`min-h-screen bg-neutral-950 flex flex-col items-center justify-center relative overflow-hidden px-4 font-sans ${c.selection}`}>
      {audioSrc && <audio ref={audioRef} src={audioSrc} />}

      {/* Screen Effects (Scanlines & Vignette) */}
      <div className="absolute inset-0 pointer-events-none z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-size-[100%_4px,3px_100%] opacity-20" />
      <div className="absolute inset-0 pointer-events-none z-40 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]" />

      {(weather === 'rain' || weather === 'storm') && <Rain />}
      {(weather === 'rain' || weather === 'storm') && <RainDrops />}
      {weather === 'storm' && <Lightning flash={flash} />}

      {/* Moving Road Background Effect */}
      <div className="absolute inset-0 flex justify-center items-center pointer-events-none overflow-hidden">
        {/* Road surface gradient */}
        <div className={`absolute inset-0 bg-linear-to-b ${c.gradientFrom} ${c.gradientVia} to-neutral-950`} />

        {/* Moving dashed lines (Road markings) */}
        <motion.div
          className="absolute inset-0 flex justify-center"
          animate={{ opacity: flash ? [0.2, 0.6, 0.3, 0.8, 0.2] : 0.2 }}
          transition={{ duration: 0.4 }}
        >
          <motion.div
            initial={{ backgroundPositionY: "0%" }}
            animate={{ backgroundPositionY: "100%" }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="h-full w-2 bg-size-[100%_100px]"
            style={{
              backgroundImage: `linear-gradient(to bottom, transparent 50%, ${c.lineColor} 50%)`,
              filter: `drop-shadow(0 0 8px ${c.lineShadow})`,
            }}
          />
        </motion.div>

        {/* Side passing lights effect */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.3, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", times: [0, 0.5, 1] }}
          className={`absolute left-0 top-0 bottom-0 w-64 bg-linear-to-r ${c.lineGradient} to-transparent`}
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.3, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2, times: [0, 0.5, 1] }}
          className={`absolute right-0 top-0 bottom-0 w-64 bg-linear-to-l ${c.lineGradient} to-transparent`}
        />

        {/* Low Fog */}
        <motion.div
          initial={{ opacity: 0, x: "-10%" }}
          animate={{ opacity: [0.1, 0.3, 0.1], x: "10%" }}
          transition={{ duration: 8, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
          className="absolute bottom-0 left-0 right-0 h-64 bg-linear-to-t from-neutral-900 via-neutral-900/50 to-transparent z-0"
        />
      </div>

      <div className="relative z-30 text-center max-w-2xl mx-auto">
        <div className="relative inline-flex items-center justify-center mb-8">
          {/* Radar Ping Effect */}
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              initial={{ width: "100%", height: "100%", opacity: 0 }}
              animate={{ width: "200%", height: "200%", opacity: 0 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.6,
                ease: "easeOut",
                repeatDelay: 1,
              }}
              style={{ opacity: 0.5 }}
              className={`absolute rounded-full border ${c.iconBorder}`}
            />
          ))}

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className={`relative z-10 p-8 rounded-full ${c.iconBg} border ${c.iconBorder} backdrop-blur-sm group`}
          >
          <motion.div
            animate={
              theme === "red"
                ? { rotate: [0, -10, 10, -10, 0] }
                : theme === "blue"
                ? { scale: [1, 1.1, 1] }
                : { y: [0, -3, 0] }
            }
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Icon className={`w-20 h-20 ${c.iconColor}`} strokeWidth={1.5} />
          </motion.div>

          {/* Glow effect */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [1, 0.8, 1, 1, 0.4, 1, 0.9, 1] }}
            transition={{ duration: 3, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", times: [0, 0.1, 0.2, 0.4, 0.6, 0.7, 0.8, 1] }}
            className={`absolute inset-0 ${c.glow} blur-2xl rounded-full pointer-events-none`}
          />
          </motion.div>
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: [1, 0.8, 1, 1, 0.4, 1, 0.9, 1],
            y: 0,
            textShadow: [
              "0 0 0px rgba(255,0,0,0), 0 0 0px rgba(0,0,255,0)",
              "4px 0 0px rgba(255,0,0,0.8), -4px 0 0px rgba(0,0,255,0.8)",
              "0 0 0px rgba(255,0,0,0), 0 0 0px rgba(0,0,255,0)",
            ],
          }}
          transition={{ y: { delay: 0.2, duration: 0.5 }, opacity: { duration: 3, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", times: [0, 0.1, 0.2, 0.4, 0.6, 0.7, 0.8, 1] }, textShadow: { duration: 0.2, repeat: Infinity, repeatDelay: 3.5 } }}
          className="text-8xl md:text-9xl font-black text-white mb-2 tracking-tighter flex items-center justify-center gap-2 drop-shadow-2xl"
        >
          {code.toString().split("").map((char, i) => (
            <span key={i} className={i === 1 && code === "404" ? `inline-block ${c.iconColor}` : ""}>
              {char}
            </span>
          ))}
        </motion.h1>

        <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }} className="text-2xl md:text-4xl font-bold text-white mb-6 uppercase tracking-widest">
          {title}
        </motion.h2>

        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }} className="text-gray-400 text-lg mb-10 max-w-lg mx-auto leading-relaxed font-light">
          {message}
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5 }} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {onRetry ? (
            <motion.button onClick={onRetry} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className={`inline-flex items-center gap-2 px-8 py-4 ${c.buttonBg} ${c.buttonHover} text-white rounded-full font-bold transition-all shadow-lg ${c.buttonShadow} cursor-pointer border border-white/10`}>
              <RefreshCcw className="w-5 h-5" /> Jump Start
            </motion.button>
          ) : (
            <Link href="/">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className={`inline-flex items-center gap-2 px-8 py-4 ${c.buttonBg} ${c.buttonHover} text-white rounded-full font-bold transition-all shadow-lg ${c.buttonShadow} border border-white/10`}>
                <Home className="w-5 h-5" /> Return to HQ
              </motion.div>
            </Link>
          )}

          {onRetry ? (
            <Link href="/">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-flex items-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-full font-bold transition-all border border-white/10 backdrop-blur-sm">
                <Home className="w-5 h-5" /> Return to HQ
              </motion.div>
            </Link>
          ) : (
            <motion.button onClick={() => router.back()} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-flex items-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-full font-bold transition-all border border-white/10 backdrop-blur-sm cursor-pointer">
              <ArrowLeft className="w-5 h-5" /> Go Back
            </motion.button>
          )}
        </motion.div>

        <DiagnosticsLog theme={theme} message={message} />
      </div>
    </div>
  );
}