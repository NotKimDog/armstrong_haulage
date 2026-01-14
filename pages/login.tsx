"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Archivo_Black } from "next/font/google";
import { User, Lock, Truck, LogIn, Eye, EyeOff, Zap, TrendingUp, Users as UsersIcon, ExternalLink } from "lucide-react";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, setPersistence, browserLocalPersistence, browserSessionPersistence } from "firebase/auth";
import type { User as FirebaseUser } from "firebase/auth";
import { auth } from "../app/api/lib/firebase";
import { DiscordIcon, GitHubIcon, SteamIcon, TwitchIcon } from "../components/BrandIcons";

const archivoBlack = Archivo_Black({
  weight: "400",
  subsets: ["latin"],
});

export default function AuthPage() {
  const router = useRouter();
  const search = useSearchParams();
  const defaultMode = (search?.get("mode") === "register" ? "register" : "login") as "login" | "register";
  const [mode, setMode] = useState<"login" | "register">(defaultMode);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setMode(defaultMode);
  }, []);

  function getErrorMessage(err: unknown, fallback = "An error occurred.") {
    if (!err) return fallback;
    if (typeof err === "string") return err;
    if (err instanceof Error) return err.message;
    try {
      const asAny = err as { message?: unknown };
      if (asAny && typeof asAny.message === "string") return asAny.message as string;
    } catch {
      // ignore
    }
    try {
      return String(JSON.stringify(err));
    } catch {
      return fallback;
    }
  }

  function setLocalUserFromFirebase(u: FirebaseUser | null) {
    if (!u) return;
    const mapped = { displayName: u.displayName || (u.email ? u.email.split('@')[0] : undefined), email: u.email || undefined, photoURL: u.photoURL || undefined, uid: u.uid };
    try { localStorage.setItem('user', JSON.stringify(mapped)); } catch {}
    try { window.dispatchEvent(new CustomEvent('auth-change', { detail: mapped })); } catch {}
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      try { await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence); } catch {}
      const cred = await signInWithEmailAndPassword(auth, email, password);
      setLocalUserFromFirebase(cred.user);
      router.push("/");
    } catch (err: unknown) {
      const msg = getErrorMessage(err, "Invalid credentials.");
      setError(msg.replace?.("Firebase: ", "") ?? msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      try { await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence); } catch {}
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      setLocalUserFromFirebase(cred.user);
      alert("Account created successfully!");
      router.push("/");
    } catch (err: unknown) {
      const msg = getErrorMessage(err, "Could not create account.");
      setError(msg.replace?.("Firebase: ", "") ?? msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    setIsLoading(true);
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      try { await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence); } catch {}
      const cred = await signInWithPopup(auth, provider);
      setLocalUserFromFirebase(cred.user);
      router.push("/");
    } catch (err: unknown) {
      const msg = getErrorMessage(err, "Google sign-in failed.");
      setError(msg.replace?.("Firebase: ", "") ?? msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGithub = async () => {
    setIsLoading(true);
    setError("");
    try {
      window.location.href = "/api/auth/github";
    } catch (err: unknown) {
      const msg = getErrorMessage(err, "GitHub sign-in failed.");
      setError(msg.replace?.("Firebase: ", "") ?? msg);
      setIsLoading(false);
    }
  };

  const handleSteam = async () => {
    setIsLoading(true);
    setError("");
    try {
      window.location.href = "/api/auth/steam";
    } catch (err: unknown) {
      const msg = getErrorMessage(err, "Steam sign-in failed.");
      setError(msg.replace?.("Firebase: ", "") ?? msg);
      setIsLoading(false);
    }
  };

  const handleTwitch = async () => {
    setIsLoading(true);
    setError("");
    try {
      window.location.href = "/api/auth/twitch";
    } catch (err: unknown) {
      const msg = getErrorMessage(err, "Twitch sign-in failed.");
      setError(msg.replace?.("Firebase: ", "") ?? msg);
      setIsLoading(false);
    }
  };

  const handleDiscord = async () => {
    setIsLoading(true);
    setError("");
    try {
      window.location.href = "/api/auth/discord";
    } catch (err: unknown) {
      const msg = getErrorMessage(err, "Discord sign-in failed.");
      setError(msg.replace?.("Firebase: ", "") ?? msg);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-neutral-950">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 py-12 bg-black">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md w-full mx-auto"
        >
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center shadow-lg">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <h1 className={`text-4xl font-black text-white ${archivoBlack.className}`}>Armstrong Haulage</h1>
            </div>
            <p className="text-gray-300 text-lg font-semibold">Connected Fleet Management</p>
            <p className="text-gray-500 text-sm mt-2">Real-time logistics, team collaboration & performance tracking</p>
          </div>

          {/* Mode Tabs */}
          <div className="flex gap-2 mb-8 bg-neutral-900 p-1 rounded-full border border-neutral-800">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 py-2.5 px-6 rounded-full font-bold transition ${
                mode === "login"
                  ? "bg-orange-600 text-white shadow-lg"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode("register")}
              className={`flex-1 py-2.5 px-6 rounded-full font-bold transition ${
                mode === "register"
                  ? "bg-orange-600 text-white shadow-lg"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              Register
            </button>
          </div>

          {mode === "login" ? (
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email */}
              <div>
                <label htmlFor="email-login" className="block text-sm font-bold text-gray-300 mb-2">Email Address</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 pointer-events-none" />
                  <input
                    id="email-login"
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-neutral-900 border-2 border-neutral-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-orange-500 focus:bg-neutral-800 transition-all"
                    placeholder="driver@armstronghaulage.com"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password-login" className="block text-sm font-bold text-gray-300 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 pointer-events-none" />
                  <input
                    id="password-login"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-neutral-900 border-2 border-neutral-800 rounded-xl py-3 pl-12 pr-12 text-white placeholder:text-gray-600 focus:outline-none focus:border-orange-500 focus:bg-neutral-800 transition-all"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300 transition"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Remember & Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-5 h-5 rounded border-2 border-neutral-700 cursor-pointer accent-orange-500 bg-neutral-900"
                  />
                  <span className="text-sm text-gray-400 font-medium">Remember me</span>
                </label>
                <Link href="#" className="text-sm font-semibold text-orange-500 hover:text-orange-400">
                  Forgot password?
                </Link>
              </div>

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-400 text-sm bg-red-950 p-3 rounded-lg border border-red-900"
                >
                  {error}
                </motion.div>
              )}

              {/* Sign In Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    Sign In
                  </>
                )}
              </motion.button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="h-px bg-neutral-800 flex-1" />
                <span className="text-xs text-gray-600 font-semibold">OR</span>
                <div className="h-px bg-neutral-800 flex-1" />
              </div>

              {/* OAuth Buttons */}
              <button
                type="button"
                onClick={handleGoogle}
                className="w-full bg-neutral-900 border-2 border-neutral-800 hover:border-neutral-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-3 hover:bg-neutral-800"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </button>

              <button
                type="button"
                onClick={handleDiscord}
                className="w-full bg-neutral-900 border-2 border-neutral-800 hover:border-neutral-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-3 hover:bg-neutral-800"
              >
                <img src="/icons/discord.svg" alt="Discord" className="w-5 h-5" />
                Continue with Discord
              </button>

              <button
                type="button"
                className="w-full bg-neutral-900 border-2 border-neutral-800 hover:border-neutral-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-3 hover:bg-neutral-800"
              >
                <GitHubIcon className="w-5 h-5 text-gray-300" />
                Continue with GitHub
              </button>

              <button
                type="button"
                className="w-full bg-neutral-900 border-2 border-neutral-800 hover:border-neutral-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-3 hover:bg-neutral-800"
              >
                <img src="/icons/steam.png" alt="Steam" className="w-5 h-5" />
                Continue with Steam
              </button>

              <button
                type="button"
                className="w-full bg-neutral-900 border-2 border-neutral-800 hover:border-neutral-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-3 hover:bg-neutral-800"
              >
                <img src="/icons/twitch.svg" alt="Twitch" className="w-5 h-5" />
                Continue with Twitch
              </button>

              {/* Footer */}
              <p className="text-center text-gray-500 text-sm">
                New here?{" "}
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className="font-bold text-orange-500 hover:text-orange-400"
                >
                  Create an account
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-6">
              {/* Email */}
              <div>
                <label htmlFor="email-register" className="block text-sm font-bold text-gray-300 mb-2">Email Address</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 pointer-events-none" />
                  <input
                    id="email-register"
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-neutral-900 border-2 border-neutral-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-orange-500 focus:bg-neutral-800 transition-all"
                    placeholder="your@company.com"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password-register" className="block text-sm font-bold text-gray-300 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 pointer-events-none" />
                  <input
                    id="password-register"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-neutral-900 border-2 border-neutral-800 rounded-xl py-3 pl-12 pr-12 text-white placeholder:text-gray-600 focus:outline-none focus:border-orange-500 focus:bg-neutral-800 transition-all"
                    placeholder="Create a strong password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300 transition"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-400 text-sm bg-red-950 p-3 rounded-lg border border-red-900"
                >
                  {error}
                </motion.div>
              )}

              {/* Create Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    Create Account
                  </>
                )}
              </motion.button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="h-px bg-neutral-800 flex-1" />
                <span className="text-xs text-gray-600 font-semibold">OR</span>
                <div className="h-px bg-neutral-800 flex-1" />
              </div>

              {/* OAuth Buttons */}
              <button
                type="button"
                onClick={handleGoogle}
                className="w-full bg-neutral-900 border-2 border-neutral-800 hover:border-neutral-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-3 hover:bg-neutral-800"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </button>

              <button
                type="button"
                onClick={handleDiscord}
                className="w-full bg-neutral-900 border-2 border-neutral-800 hover:border-neutral-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-3 hover:bg-neutral-800"
              >
                <img src="/icons/discord.svg" alt="Discord" className="w-5 h-5" />
                Continue with Discord
              </button>

              <button
                type="button"
                className="w-full bg-neutral-900 border-2 border-neutral-800 hover:border-neutral-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-3 hover:bg-neutral-800"
              >
                <GitHubIcon className="w-5 h-5 text-gray-300" />
                Continue with GitHub
              </button>

              <button
                type="button"
                className="w-full bg-neutral-900 border-2 border-neutral-800 hover:border-neutral-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-3 hover:bg-neutral-800"
              >
                <img src="/icons/steam.png" alt="Steam" className="w-5 h-5" />
                Continue with Steam
              </button>

              <button
                type="button"
                className="w-full bg-neutral-900 border-2 border-neutral-800 hover:border-neutral-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-3 hover:bg-neutral-800"
              >
                <img src="/icons/twitch.svg" alt="Twitch" className="w-5 h-5" />
                Continue with Twitch
              </button>

              {/* Footer */}
              <p className="text-center text-gray-500 text-sm">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="font-bold text-orange-500 hover:text-orange-400"
                >
                  Sign in
                </button>
              </p>
            </form>
          )}
        </motion.div>
      </div>

      {/* Right Side - Hero with Connections */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-neutral-900 via-orange-950 to-red-950 flex-col justify-center items-center p-12 relative overflow-hidden">
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Background Image */}
        <Image
          src="/background/3.png"
          alt="Trucking"
          fill
          className="object-cover opacity-20 absolute inset-0"
        />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 text-white text-center"
        >
          <h2 className={`text-5xl font-black mb-4 ${archivoBlack.className}`}>
            Fleet Intelligence
          </h2>
          <p className="text-xl text-white/80 mb-12 max-w-md mx-auto leading-relaxed">
            Connect your platforms for real-time tracking & team collaboration
          </p>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 gap-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4 hover:bg-white/10 transition"
            >
              <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-orange-400" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-lg">Real-time Updates</h3>
                <p className="text-sm text-gray-400">Live GPS & performance data</p>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4 hover:bg-white/10 transition"
            >
              <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-400" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-lg">Analytics</h3>
                <p className="text-sm text-gray-400">Performance insights & metrics</p>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4 hover:bg-white/10 transition"
            >
              <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <UsersIcon className="w-6 h-6 text-orange-400" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-lg">Team Collaboration</h3>
                <p className="text-sm text-gray-400">Organize & communicate</p>
              </div>
            </motion.div>
          </div>

          <p className="text-gray-500 text-sm mt-12">
            &copy; 2026 Armstrong Haulage. Professional Fleet Intelligence.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

