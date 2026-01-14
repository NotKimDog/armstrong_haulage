"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Archivo_Black } from "next/font/google";
import { User, Lock, ArrowRight, Truck, LogIn, Check, Eye, EyeOff } from "lucide-react";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, setPersistence, browserLocalPersistence, browserSessionPersistence } from "firebase/auth";
import type { User as FirebaseUser } from "firebase/auth";
import { auth } from "../app/api/lib/firebase";

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
    // if a query param asks for register, show it
    setMode(defaultMode);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function getErrorMessage(err: unknown, fallback = "An error occurred.") {
    if (!err) return fallback;
    if (typeof err === "string") return err;
    if (err instanceof Error) return err.message;
    try {
      // try to coerce unknown objects to string
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
      // set persistence based on rememberMe
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
      // Show message and redirect
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

  const handleDiscord = async () => {
    setIsLoading(true);
    setError("");
    try {
      // Redirect to API route which starts the Discord OAuth flow
      window.location.href = "/api/auth/discord";
    } catch (err: unknown) {
      const msg = getErrorMessage(err, "Discord sign-in failed.");
      setError(msg.replace?.("Firebase: ", "") ?? msg);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/background/3.png"
          alt="Trucking Background"
          fill
          className="object-cover opacity-30"
          priority
        />
        <div className="absolute inset-0 bg-linear-to-b from-neutral-950 via-neutral-950/80 to-neutral-950 z-10" />
        {/* subtle animated blobs */}
        <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ x: [0, 60, 0], opacity: [0.06, 0.18, 0.06] }}
            transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-600/16 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ x: [0, -60, 0], opacity: [0.06, 0.18, 0.06] }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-blue-600/16 rounded-full blur-3xl"
          />
        </div>
      </div>

      <div className="relative z-20 w-full max-w-lg px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="bg-neutral-900/50 backdrop-blur-2xl border border-white/6 p-6 sm:p-8 rounded-3xl shadow-2xl relative overflow-hidden group"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-transparent via-purple-500 to-transparent opacity-50" />
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-colors duration-500" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-colors duration-500" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-linear-to-br from-purple-600/20 to-blue-600/20 rounded-2xl flex items-center justify-center border border-white/8 shadow-[0_0_20px_rgba(168,85,247,0.08)]">
                <Truck className="w-8 h-8 text-purple-400" />
              </div>
              <div>
                <h1 className={`text-2xl sm:text-3xl font-extrabold text-white tracking-tight ${archivoBlack.className}`}>Driver Portal</h1>
                <p className="text-gray-400 text-sm">{mode === "login" ? "Sign in to your account" : "Create a new account"}</p>
              </div>
            </div>

            <div className="ml-auto flex items-center gap-2 bg-white/3 rounded-full p-1">
              <button onClick={() => setMode("login")} className={`px-4 py-1 rounded-full text-sm transition ${mode === "login" ? 'bg-linear-to-r from-purple-600 to-blue-600 text-white' : 'text-gray-300 hover:text-white'}`}>Sign In</button>
              <button onClick={() => setMode("register")} className={`px-4 py-1 rounded-full text-sm transition ${mode === "register" ? 'bg-linear-to-r from-purple-600 to-blue-600 text-white' : 'text-gray-300 hover:text-white'}`}>Register</button>
            </div>
          </div>

          {mode === "login" ? (
            <form onSubmit={handleLogin} className="space-y-5 relative" suppressHydrationWarning>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Email Address</label>
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="w-5 h-5 text-gray-500 group-focus-within/input:text-purple-400 transition-colors" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black/40 border border-white/8 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500/50 focus:bg-black/60 focus:ring-1 focus:ring-purple-500/20 transition-all"
                    placeholder="driver@armstronghaulage.com"
                    required
                    suppressHydrationWarning
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Password</label>
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-gray-500 group-focus-within/input:text-purple-400 transition-colors" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black/40 border border-white/8 rounded-xl py-3.5 pl-12 pr-12 text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500/50 focus:bg-black/60 focus:ring-1 focus:ring-purple-500/20 transition-all"
                    placeholder="••••••••"
                    required
                    suppressHydrationWarning
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-white transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="text-red-500 text-sm text-center bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group/checkbox">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${rememberMe ? 'bg-purple-600 border-purple-600' : 'bg-black/40 border-white/20 group-hover/checkbox:border-purple-500/50'}`}>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    {rememberMe && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <span className="text-sm text-gray-400 group-hover/checkbox:text-gray-300 transition-colors">Remember me</span>
                </label>
                <Link href="#" className="text-sm text-purple-400 hover:text-purple-300 transition-colors font-medium">Forgot Password?</Link>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-xl flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full hover:translate-y-0 transition-transform duration-300" />
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-5 h-5 relative z-10" /> <span className="relative z-10">Sign In</span>
                  </>
                )}
              </motion.button>

              <div className="flex items-center gap-4 my-6">
                <div className="h-px bg-white/10 flex-1" />
                <span className="text-xs text-gray-500 uppercase font-medium">Or continue with</span>
                <div className="h-px bg-white/10 flex-1" />
              </div>

              <button
                type="button"
                onClick={handleGoogle}
                className="w-full bg-white text-black font-semibold py-3 rounded-xl transition-all hover:bg-gray-100 flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Sign in with Google
              </button>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleDiscord}
                  className="w-full bg-[#5865F2] text-white font-semibold py-3 rounded-xl transition-all hover:brightness-90 flex items-center justify-center gap-3"
                >
                  <Image src="/discord.svg" alt="Discord" width={20} height={20} />
                  Continue with Discord
                </button>
              </div>
              <p className="text-center text-xs text-gray-400 mt-2">We only use Google to verify identity — no data is shared.</p>

              <div className="mt-8 pt-6 border-t border-white/6 text-center relative">
                <p className="text-gray-400 text-sm mb-2">New here?</p>
                <button onClick={() => setMode("register")} className="inline-flex items-center gap-2 text-white font-semibold hover:text-purple-300 transition-colors group">
                  Apply to Join <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-purple-500" />
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-5 relative" suppressHydrationWarning>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Email Address</label>
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="w-5 h-5 text-gray-500 group-focus-within/input:text-purple-400 transition-colors" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50 focus:bg-black/60 focus:ring-1 focus:ring-purple-500/20 transition-all"
                    placeholder="your@company.com"
                    required
                    suppressHydrationWarning
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Password</label>
                <div className="relative group/input">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-gray-500 group-focus-within/input:text-purple-400 transition-colors" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-12 pr-12 text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50 focus:bg-black/60 focus:ring-1 focus:ring-purple-500/20 transition-all"
                    placeholder="Choose a secure password"
                    required
                    suppressHydrationWarning
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-white transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="text-red-500 text-sm text-center bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                  {error}
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold py-3.5 rounded-xl transition-all shadow-xl flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed relative overflow-hidden"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-5 h-5 relative z-10" /> <span className="relative z-10">Create Account</span>
                  </>
                )}
              </motion.button>

              <div className="flex items-center gap-4 my-6">
                <div className="h-px bg-white/10 flex-1" />
                <span className="text-xs text-gray-500 uppercase font-medium">Or continue with</span>
                <div className="h-px bg-white/10 flex-1" />
              </div>

              <button
                type="button"
                onClick={handleGoogle}
                className="w-full bg-white text-black font-bold py-3.5 rounded-xl transition-all hover:bg-gray-100 flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Sign up with Google
              </button>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleDiscord}
                  className="w-full bg-[#5865F2] text-white font-semibold py-3 rounded-xl transition-all hover:brightness-90 flex items-center justify-center gap-3"
                >
                  <Image src="/discord.svg" alt="Discord" width={20} height={20} />
                  Continue with Discord
                </button>
              </div>

              <div className="mt-8 pt-6 border-t border-white/6 text-center relative">
                <p className="text-gray-400 text-sm mb-2">Already have an account?</p>
                <button onClick={() => setMode("login")} className="inline-flex items-center gap-2 text-white font-semibold hover:text-purple-300 transition-colors group">
                  Sign In <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-purple-500" />
                </button>
              </div>
            </form>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-8 text-gray-600 text-xs"
        >
          &copy; {new Date().getFullYear()} Armstrong Haulage. Protected System.
        </motion.div>
      </div>
    </div>
  );
}

